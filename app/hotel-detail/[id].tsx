import { getRoomDetails, getRoomReviews } from '@/apis/roomApi';
import { BOOKING_COLORS, Room } from '@/constants/booking';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Review {
  id: string | number;
  userId?: string | number;
  username?: string;
  comment: string;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

const formatVND = (amount: number): string => {
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
};

export default function HotelDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [reviewsModalVisible, setReviewsModalVisible] = useState<boolean>(false);
  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);
  const [galleryModalVisible, setGalleryModalVisible] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const imageFlatListRef = useRef<FlatList>(null);
  
  // Booking form states
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  const [bookingStep, setBookingStep] = useState<'date' | 'guests'>('date');
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  });
  const [showCheckInPicker, setShowCheckInPicker] = useState<boolean>(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState<boolean>(false);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(1);
  const { data: roomData, isLoading, isError } = useQuery({
    queryKey: ['room-detail', id],
    queryFn: () => getRoomDetails(id || ''),
    enabled: !!id,
  });

  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['room-reviews', id],
    queryFn: () => getRoomReviews(id || ''),
    enabled: !!id && reviewsModalVisible,
  });

  const reviews: Review[] = React.useMemo(() => {
    if (reviewsData && Array.isArray(reviewsData)) {
      return reviewsData;
    }
    if (roomData?.reviews && Array.isArray(roomData.reviews)) {
      return roomData.reviews;
    }
    return [];
  }, [reviewsData, roomData]);

  const handleImagePress = (index: number): void => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatReviewDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getNights = (): number => {
    return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleCheckInChange = (event: any, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowCheckInPicker(false);
    }
    if (selectedDate) {
      setCheckInDate(selectedDate);
      // Auto update check-out if it's before check-in
      if (checkOutDate <= selectedDate) {
        const newCheckOut = new Date(selectedDate);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        setCheckOutDate(newCheckOut);
      }
    }
  };

  const handleCheckOutChange = (event: any, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowCheckOutPicker(false);
    }
    if (selectedDate && selectedDate > checkInDate) {
      setCheckOutDate(selectedDate);
    }
  };

  const handleDateSelectionComplete = (): void => {
    if (checkInDate && checkOutDate && checkOutDate > checkInDate) {
      setBookingStep('guests');
    }
  };

  const handleBookingComplete = (): void => {
    if (!room || !room.id) {
      return;
    }
    
    const nights = getNights();
    const bookingParams = {
      roomId: room.id,
      checkInDate: checkInDate.toISOString().split('T')[0],
      checkOutDate: checkOutDate.toISOString().split('T')[0],
      nights: nights.toString(),
      adults: adults.toString(),
      children: children.toString(),
      infants: '0', // Default to 0 as we don't have infants selector
      rooms: rooms.toString(),
      imageUrl: room.imageUrl || '',
      hotelName: room.hotelName || '',
      pricePerNight: room.pricePerNight.toString(),
    };
    
    router.push({
      pathname: '/confirm-pay',
      params: bookingParams,
    });
  };

  const updateCount = (type: 'adults' | 'children' | 'rooms', delta: number): void => {
    if (type === 'adults') {
      setAdults(Math.max(1, Math.min(10, adults + delta)));
    } else if (type === 'children') {
      setChildren(Math.max(0, Math.min(10, children + delta)));
    } else if (type === 'rooms') {
      setRooms(Math.max(1, Math.min(5, rooms + delta)));
    }
  };

  // Helper function to normalize image URLs to array of strings
  const getImageUrls = (data: any): string[] => {
    if (!data?.roomImageUrls || !Array.isArray(data.roomImageUrls)) {
      return [];
    }
    return data.roomImageUrls
      .map((item: any) => {
        if (typeof item === 'string') {
          return item;
        }
        return item?.imageUrl || item?.url || item?.image_url || '';
      })
      .filter((url: string) => url && url.trim().length > 0);
  };

  // Calculate imageUrls from roomData (safe even if roomData is undefined)
  const imageUrls = roomData ? getImageUrls(roomData) : [];

  // Scroll to selected image when modal opens
  useEffect(() => {
    if (imageModalVisible && imageUrls.length > 0 && imageFlatListRef.current) {
      setTimeout(() => {
        imageFlatListRef.current?.scrollToIndex({
          index: selectedImageIndex,
          animated: false,
        });
      }, 100);
    }
  }, [imageModalVisible, selectedImageIndex, imageUrls.length]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={BOOKING_COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (isError || !roomData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Không tìm thấy phòng</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const room: Room = {
    id: String(roomData.id || ''),
    roomNumber: roomData.roomNumber || '',
    type: roomData.type || '',
    pricePerNight: roomData.pricePerNight 
      ? (typeof roomData.pricePerNight === 'number' 
          ? roomData.pricePerNight 
          : parseFloat(String(roomData.pricePerNight)))
      : 0,
    available: Boolean(roomData.available ?? true),
    capacity: roomData.capacity || 0,
    hotelId: String(roomData.hotelId || ''),
    hotelName: roomData.hotelName || '',
    imageUrl: roomData.imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerButton, styles.headerButtonTransparent]}>
          <Ionicons name="arrow-back" size={24} color={BOOKING_COLORS.BACKGROUND} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setIsFavorite(!isFavorite)}
            style={[styles.headerButton, styles.headerButtonTransparent]}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? BOOKING_COLORS.HEART : BOOKING_COLORS.BACKGROUND}
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, styles.headerButtonTransparent]}>
            <Ionicons name="share-outline" size={24} color={BOOKING_COLORS.BACKGROUND} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={[styles.imageContainer, { width }]}>
          <ExpoImage
            source={{ uri: room.imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400' }}
            style={styles.mainImage}
            contentFit="cover"
            transition={200}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color={BOOKING_COLORS.RATING} />
              <Text style={styles.ratingText}>{roomData.rating || 0}</Text>
            </View>
            <Text style={styles.reviews}>({roomData.countRating || 0} đánh giá)</Text>
          </View>

          <Text style={styles.hotelName}>{room.hotelName}</Text>
          <Text style={styles.roomNumber}>Phòng {room.roomNumber} - {room.type}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={BOOKING_COLORS.TEXT_SECONDARY} />
            <Text style={styles.location}>
              {[
                roomData.address,
                roomData.city,
                roomData.country
              ].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
            </Text>
          </View>
          {roomData.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.overviewText}>{roomData.description}</Text>
            </View>
          )}

          {/* Booking Form - Date Selection */}
          {showBookingForm && bookingStep === 'date' && (
            <View style={styles.bookingSection}>
              <Text style={styles.bookingSectionTitle}>Chọn ngày</Text>
              <View style={styles.bookingRow}>
                <View style={styles.bookingItem}>
                  <Text style={styles.bookingLabel}>Ngày nhận phòng</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowCheckInPicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
                    <Text style={styles.dateInputText}>{formatDateShort(checkInDate)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.bookingItem}>
                  <Text style={styles.bookingLabel}>Ngày trả phòng</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowCheckOutPicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
                    <Text style={styles.dateInputText}>{formatDateShort(checkOutDate)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.bookingNextButton,
                  (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) && styles.bookingNextButtonDisabled,
                ]}
                onPress={handleDateSelectionComplete}
                disabled={!checkInDate || !checkOutDate || checkOutDate <= checkInDate}>
                <Text style={styles.bookingNextButtonText}>Tiếp theo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Booking Form - Guest and Room Selection */}
          {showBookingForm && bookingStep === 'guests' && (
            <View style={styles.bookingSection}>
              <View style={styles.bookingSectionHeader}>
                <TouchableOpacity
                  onPress={() => setBookingStep('date')}
                  style={styles.bookingBackButton}
                  activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={22} color={BOOKING_COLORS.PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.bookingSectionTitle}>Thông tin đặt phòng</Text>
                <View style={styles.bookingHeaderSpacer} />
              </View>
              <View style={styles.bookingRow}>
                <View style={styles.bookingItem}>
                  <Text style={styles.bookingLabel}>Người lớn</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={[styles.counterButton, adults <= 1 && styles.counterButtonDisabled]}
                      onPress={() => updateCount('adults', -1)}
                      disabled={adults <= 1}>
                      <Ionicons
                        name="remove"
                        size={18}
                        color={adults <= 1 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{adults}</Text>
                    <TouchableOpacity
                      style={[styles.counterButton, adults >= 10 && styles.counterButtonDisabled]}
                      onPress={() => updateCount('adults', 1)}
                      disabled={adults >= 10}>
                      <Ionicons
                        name="add"
                        size={18}
                        color={adults >= 10 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bookingItem}>
                  <Text style={styles.bookingLabel}>Trẻ em</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={[styles.counterButton, children <= 0 && styles.counterButtonDisabled]}
                      onPress={() => updateCount('children', -1)}
                      disabled={children <= 0}>
                      <Ionicons
                        name="remove"
                        size={18}
                        color={children <= 0 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{children}</Text>
                    <TouchableOpacity
                      style={[styles.counterButton, children >= 10 && styles.counterButtonDisabled]}
                      onPress={() => updateCount('children', 1)}
                      disabled={children >= 10}>
                      <Ionicons
                        name="add"
                        size={18}
                        color={children >= 10 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bookingItem}>
                  <Text style={styles.bookingLabel}>Số phòng</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={[styles.counterButton, rooms <= 1 && styles.counterButtonDisabled]}
                      onPress={() => updateCount('rooms', -1)}
                      disabled={rooms <= 1}>
                      <Ionicons
                        name="remove"
                        size={18}
                        color={rooms <= 1 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{rooms}</Text>
                    <TouchableOpacity
                      style={[styles.counterButton, rooms >= 5 && styles.counterButtonDisabled]}
                      onPress={() => updateCount('rooms', 1)}
                      disabled={rooms >= 5}>
                      <Ionicons
                        name="add"
                        size={18}
                        color={rooms >= 5 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.bookingNextButton}
                onPress={handleBookingComplete}>
                <Text style={styles.bookingNextButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => {
              setReviewsModalVisible(true);
            }}>
            <Ionicons name="star" size={18} color={BOOKING_COLORS.PRIMARY} />
            <Text style={styles.reviewButtonText}>Đánh giá</Text>
          </TouchableOpacity>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ảnh</Text>
              <TouchableOpacity onPress={() => setGalleryModalVisible(true)}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={imageUrls}
              renderItem={({ item, index }) => {
                if (!item) return null;
                
                return (
                  <TouchableOpacity
                    style={styles.photoThumbnail}
                    onPress={() => handleImagePress(index)}
                    activeOpacity={0.8}>
                    <ExpoImage
                      source={{ uri: item }}
                      style={styles.photoImage}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item, index) => `image-${index}-${item ? item.substring(item.length - 20) : 'empty'}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosList}
              ListEmptyComponent={
                <Text style={styles.emptyPhotosText}>Chưa có ảnh</Text>
              }
            />
          </View>

          {/* Room Details */}
          <View style={styles.section}>
            <Text style={styles.roomTitle}>Thông tin phòng</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
                <Text style={styles.detailText}>{room.capacity} khách</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="bed-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
                <Text style={styles.detailText}>{roomData.bedType || 'Chưa có thông tin'}</Text>
              </View>
              {roomData.bathroomCount !== undefined && roomData.bathroomCount > 0 && (
                <View style={styles.detailItem}>
                  <Ionicons name="water-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
                  <Text style={styles.detailText}>{roomData.bathroomCount} phòng tắm</Text>
                </View>
              )}
              {roomData.roomSize && (
                <View style={styles.detailItem}>
                  <Ionicons name="expand-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
                  <Text style={styles.detailText}>{roomData.roomSize}m²</Text>
                </View>
              )}
            </View>
            <View style={styles.availabilityRow}>
              <Ionicons 
                name={room.available ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={room.available ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.availabilityText, { color: room.available ? "#10B981" : "#EF4444" }]}>
                {room.available ? "Còn trống" : "Đã đặt"}
              </Text>
            </View>
          </View>

          {/* Amenities */}
          {roomData.amenities && roomData.amenities.trim().length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tiện ích</Text>
              <Text style={styles.amenitiesText}>{roomData.amenities}</Text>
            </View>
          )}

          {/* Facilities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cơ sở vật chất</Text>
            <View style={styles.facilitiesGrid}>
              <View style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.facilityText}>Miễn phí Wi-Fi</Text>
              </View>
              <View style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.facilityText}>Dịch vụ phòng</Text>
              </View>
              <View style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.facilityText}>Bàn tiếp tân [24 giờ]</Text>
              </View>
              <View style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.facilityText}>Hoàn toàn không hút thuốc</Text>
              </View>
              <View style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.facilityText}>Quán bar</Text>
              </View>
              <View style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.facilityText}>Dọn phòng hằng ngày</Text>
              </View>
              <View style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.facilityText}>Ban công/sân hiên</Text>
              </View>
              <View style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.facilityText}>Máy điều hòa ở khu vực chung</Text>
              </View>
            </View>
          </View>

          {/* Location Map Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trên bản đồ</Text>
            
            {/* Map Placeholder */}
            <View style={styles.mapContainer}>
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={48} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.mapPlaceholderText}>Bản đồ</Text>
                <View style={styles.mapMarker}>
                  <Ionicons name="location" size={24} color="#EF4444" />
                </View>
              </View>
            </View>

            {/* Location Rating */}
            <View style={styles.locationRatingContainer}>
              <Text style={styles.locationRatingScore}>9,4 Trên cả tuyệt vời</Text>
              <Text style={styles.locationRatingLabel}>Điểm đánh giá vị trí</Text>
            </View>

            {/* Rare Location */}
            <View style={styles.rareLocationContainer}>
              <Ionicons name="trophy-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
              <Text style={styles.rareLocationText}>Vị trí hiếm có</Text>
            </View>

            {/* Famous Landmarks */}
            <View style={styles.landmarksSection}>
              <Text style={styles.landmarksTitle}>Các địa danh nổi tiếng</Text>
              <View style={styles.landmarkItem}>
                <Ionicons name="business-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Bảo tàng Chứng tích chiến tranh</Text>
                <Text style={styles.landmarkDistance}>7,3 km</Text>
              </View>
              <View style={styles.landmarkItem}>
                <Ionicons name="musical-notes-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Chương trình nghệ thuật À Ố S...</Text>
                <Text style={styles.landmarkDistance}>8,1 km</Text>
              </View>
              <View style={styles.landmarkItem}>
                <Ionicons name="business-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Quảng trường Hồ Chí Minh</Text>
                <Text style={styles.landmarkDistance}>8,7 km</Text>
              </View>
              <View style={styles.landmarkItem}>
                <Ionicons name="business-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Địa đạo Củ Chi</Text>
                <Text style={styles.landmarkDistance}>40,3 km</Text>
              </View>
            </View>

            {/* Nearest Landmarks */}
            <View style={styles.landmarksSection}>
              <Text style={styles.landmarksTitle}>Địa danh gần nhất</Text>
              <View style={styles.landmarkItem}>
                <Ionicons name="location-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Nhà thuốc Kim Nga</Text>
                <Text style={styles.landmarkDistance}>120 m</Text>
              </View>
              <View style={styles.landmarkItem}>
                <Ionicons name="location-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Country House Coffee</Text>
                <Text style={styles.landmarkDistance}>570 m</Text>
              </View>
              <View style={styles.landmarkItem}>
                <Ionicons name="location-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Phòng khám Sản phụ khoa BS ...</Text>
                <Text style={styles.landmarkDistance}>590 m</Text>
              </View>
              <View style={styles.landmarkItem}>
                <Ionicons name="location-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Nhà thuốc Bảo Vy</Text>
                <Text style={styles.landmarkDistance}>880 m</Text>
              </View>
              <View style={styles.landmarkItem}>
                <Ionicons name="location-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                <Text style={styles.landmarkName}>Nhà thuốc tây Ngọc Diệp</Text>
                <Text style={styles.landmarkDistance}>900 m</Text>
              </View>
            </View>
          </View>

          {/* Reviews Section - Hide when modal is open */}
          

        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 },]}>
        <View style={styles.bottomBarContent}>
          {/* Price Section */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Giá</Text>
            <View style={styles.priceRow}>
              <Text 
                style={styles.priceText}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}>
                {room.pricePerNight ? formatVND(room.pricePerNight) : '0 đ'}
              </Text>
              <Text style={styles.priceUnit}>/đêm</Text>
            </View>
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => {
              if (!showBookingForm) {
                setShowBookingForm(true);
                setBookingStep('date');
              } else {
                // If form is already showing, complete booking
                if (bookingStep === 'guests') {
                  handleBookingComplete();
                } else {
                  handleDateSelectionComplete();
                }
              }
            }}
            activeOpacity={0.8}>
            <Text style={styles.bookButtonText}>
              {!showBookingForm ? 'Đặt phòng' : bookingStep === 'date' ? 'Tiếp theo' : 'Xác nhận'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reviews Modal */}
      <Modal
        visible={reviewsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setReviewsModalVisible(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <StatusBar barStyle="dark-content" />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setReviewsModalVisible(false)}
              style={styles.modalCloseButton}>
              <Ionicons name="arrow-back" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đánh giá</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            {/* Overall Rating */}
            <View style={styles.modalOverallRatingContainer}>
              <View style={styles.modalRatingLeft}>
                <Text style={styles.modalOverallRatingScore}>{roomData.rating || 0}</Text>
                <View style={styles.modalStarsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(roomData.rating || 0) ? "star" : "star-outline"}
                      size={24}
                      color={BOOKING_COLORS.RATING}
                    />
                  ))}
                </View>
                <Text style={styles.modalTotalReviews}>{roomData.countRating || 0} đánh giá</Text>
              </View>
              <View style={styles.modalRatingRight}>
                <View style={styles.modalRatingBar}>
                  <Text style={styles.modalRatingBarLabel}>5</Text>
                  <View style={styles.modalRatingBarContainer}>
                    <View style={[styles.modalRatingBarFill, { width: '60%' }]} />
                  </View>
                  <Text style={styles.modalRatingBarValue}>60%</Text>
                </View>
                <View style={styles.modalRatingBar}>
                  <Text style={styles.modalRatingBarLabel}>4</Text>
                  <View style={styles.modalRatingBarContainer}>
                    <View style={[styles.modalRatingBarFill, { width: '30%' }]} />
                  </View>
                  <Text style={styles.modalRatingBarValue}>30%</Text>
                </View>
                <View style={styles.modalRatingBar}>
                  <Text style={styles.modalRatingBarLabel}>3</Text>
                  <View style={styles.modalRatingBarContainer}>
                    <View style={[styles.modalRatingBarFill, { width: '10%' }]} />
                  </View>
                  <Text style={styles.modalRatingBarValue}>10%</Text>
                </View>
                <View style={styles.modalRatingBar}>
                  <Text style={styles.modalRatingBarLabel}>2</Text>
                  <View style={styles.modalRatingBarContainer}>
                    <View style={[styles.modalRatingBarFill, { width: '0%' }]} />
                  </View>
                  <Text style={styles.modalRatingBarValue}>0%</Text>
                </View>
                <View style={styles.modalRatingBar}>
                  <Text style={styles.modalRatingBarLabel}>1</Text>
                  <View style={styles.modalRatingBarContainer}>
                    <View style={[styles.modalRatingBarFill, { width: '0%' }]} />
                  </View>
                  <Text style={styles.modalRatingBarValue}>0%</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalReviewsList}>
              {isLoadingReviews ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={BOOKING_COLORS.PRIMARY} />
                  <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
                </View>
              ) : reviews && Array.isArray(reviews) && reviews.length > 0 ? (
                reviews.map((review: Review) => (
                  <View key={String(review.id)} style={styles.modalReviewItem}>
                    <View style={styles.modalReviewHeader}>
                      <View style={styles.modalReviewerInfo}>
                        <View style={styles.modalReviewerAvatar}>
                          <Text style={styles.modalReviewerAvatarText}>
                            {getInitials(review.username)}
                          </Text>
                        </View>
                        <View style={styles.modalReviewerDetails}>
                          <Text style={styles.modalReviewerName}>
                            {review.username || 'Người dùng'}
                          </Text>
                          <Text style={styles.modalReviewDate}>
                            {formatReviewDate(review.createdAt || review.updatedAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.modalReviewRating}>
                        <Ionicons name="star" size={16} color={BOOKING_COLORS.RATING} />
                        <Text style={styles.modalReviewRatingText}>{review.rating}</Text>
                      </View>
                    </View>
                    <Text style={styles.modalReviewText}>{review.comment}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubble-outline" size={64} color={BOOKING_COLORS.TEXT_SECONDARY} />
                  <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Gallery Grid Modal */}
      <Modal
        visible={galleryModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setGalleryModalVisible(false)}>
        <View style={[styles.galleryModalContainer, { paddingTop: insets.top }]}>
          <StatusBar barStyle="dark-content" />
          
          {/* Gallery Header */}
          <View style={styles.galleryHeader}>
            <TouchableOpacity
              onPress={() => setGalleryModalVisible(false)}
              style={styles.galleryBackButton}
              activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={BOOKING_COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>Photos</Text>
            <View style={styles.galleryHeaderSpacer} />
          </View>

          {/* Gallery Grid */}
          {imageUrls.length > 0 ? (
            <FlatList
              data={imageUrls}
              numColumns={3}
              keyExtractor={(item, index) => `gallery-image-${index}-${item ? item.substring(item.length - 20) : 'empty'}`}
              contentContainerStyle={styles.galleryGrid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.galleryItem}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setGalleryModalVisible(false);
                    setImageModalVisible(true);
                  }}
                  activeOpacity={0.8}>
                  <ExpoImage
                    source={{ uri: item }}
                    style={styles.galleryImage}
                    contentFit="cover"
                    transition={200}
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.galleryEmptyContainer}>
              <Ionicons name="images-outline" size={64} color={BOOKING_COLORS.TEXT_SECONDARY} />
              <Text style={styles.galleryEmptyText}>Chưa có ảnh</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}>
        <View style={[styles.imageModalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <StatusBar barStyle="light-content" />
          
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setImageModalVisible(false)}
            style={styles.imageModalCloseButton}>
            <Ionicons name="close" size={28} color={BOOKING_COLORS.BACKGROUND} />
          </TouchableOpacity>

          {/* Image FlatList with swipe */}
          {imageUrls.length > 0 && (
            <>
              <FlatList
                ref={imageFlatListRef}
                data={imageUrls}
                renderItem={({ item, index }) => (
                  <View style={[styles.imageModalItem, { width }]}>
                    <ExpoImage
                      source={{ uri: item }}
                      style={styles.imageModalImage}
                      contentFit="contain"
                      transition={200}
                    />
                  </View>
                )}
                keyExtractor={(item, index) => `modal-image-${index}-${item ? item.substring(item.length - 20) : 'empty'}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(
                    event.nativeEvent.contentOffset.x / width
                  );
                  if (newIndex >= 0 && newIndex < imageUrls.length) {
                    setSelectedImageIndex(newIndex);
                  }
                }}
                onScrollToIndexFailed={(info) => {
                  // Fallback if scroll fails
                  setTimeout(() => {
                    imageFlatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: false,
                    });
                  }, 100);
                }}
              />

              {/* Image Counter */}
              <View style={styles.imageModalCounter}>
                <Text style={styles.imageModalCounterText}>
                  {selectedImageIndex + 1} / {imageUrls.length}
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>


      {/* Date Pickers */}
      {showCheckInPicker && (
        <DateTimePicker
          value={checkInDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleCheckInChange}
        />
      )}
      {showCheckOutPicker && (
        <DateTimePicker
          value={checkOutDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000)}
          onChange={handleCheckOutChange}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonTransparent: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  reviews: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  hotelName: {
    fontSize: 24,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  location: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    lineHeight: 24,
  },
  amenitiesText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    lineHeight: 24,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
  },
  facilityText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  mapContainer: {
    marginBottom: 16,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginTop: 8,
  },
  mapMarker: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  locationRatingContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
  },
  locationRatingScore: {
    fontSize: 24,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  locationRatingLabel: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  rareLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 12,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 8,
  },
  rareLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  landmarksSection: {
    marginBottom: 24,
  },
  landmarksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  landmarkName: {
    flex: 1,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  landmarkDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  overallRatingContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    padding: 16,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    gap: 24,
  },
  ratingLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallRatingScore: {
    fontSize: 48,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  ratingRight: {
    flex: 1,
    gap: 8,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    width: 20,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: BOOKING_COLORS.BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: BOOKING_COLORS.RATING,
  },
  ratingBarValue: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    width: 35,
    textAlign: 'right',
  },
  reviewsList: {
    gap: 16,
    marginBottom: 16,
  },
  reviewItem: {
    padding: 16,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  reviewerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  reviewText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    lineHeight: 24,
  },
  showMoreReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  showMoreReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  modalScrollView: {
    flex: 1,
  },
  modalOverallRatingContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    gap: 24,
  },
  modalRatingLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverallRatingScore: {
    fontSize: 48,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  modalStarsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  modalTotalReviews: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  modalRatingRight: {
    flex: 1,
    gap: 8,
  },
  modalRatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalRatingBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    width: 20,
  },
  modalRatingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: BOOKING_COLORS.BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalRatingBarFill: {
    height: '100%',
    backgroundColor: BOOKING_COLORS.RATING,
  },
  modalRatingBarValue: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    width: 35,
    textAlign: 'right',
  },
  modalReviewsList: {
    padding: 16,
    gap: 16,
  },
  modalReviewItem: {
    padding: 16,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
  },
  modalReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalReviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalReviewerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalReviewerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
  modalReviewerDetails: {
    flex: 1,
  },
  modalReviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  modalReviewDate: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  modalReviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalReviewRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  modalReviewText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    lineHeight: 24,
  },
  photosList: {
    gap: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyPhotosText: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingVertical: 20,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  roomDetails: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '45%',
  },
  detailText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BOOKING_COLORS.PRIMARY}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    lineHeight: 24,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  bottomBar: {
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    display: 'flex',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BOOKING_COLORS.BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  priceContainer: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 8,
    minWidth: 0,
    display: 'flex',
    justifyContent: 'space-between',
  },
  bookButton: {
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    ...Platform.select({
      ios: {
        shadowColor: BOOKING_COLORS.PRIMARY,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '700',
    color: BOOKING_COLORS.PRICE,
    lineHeight: 28,
    flexShrink: 1,
    minWidth: 0,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: BOOKING_COLORS.PRICE,
    lineHeight: 28,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginBottom: 2,
    flexShrink: 0,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BOOKING_COLORS.BORDER,
    height: 44,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.BACKGROUND,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageModalItem: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
  },
  imageModalCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageModalCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.BACKGROUND,
  },
  bookingSection: {
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  bookingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bookingHeaderSpacer: {
    width: 40,
    height: 40,
  },
  bookingSectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  bookingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bookingItem: {
    flex: 1,
  },
  bookingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  dateInputText: {
    flex: 1,
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  counterButtonDisabled: {
    borderColor: BOOKING_COLORS.BORDER,
    opacity: 0.5,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    minWidth: 30,
    textAlign: 'center',
  },
  bookingNextButton: {
    width: '100%',
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  bookingNextButtonDisabled: {
    backgroundColor: BOOKING_COLORS.TEXT_SECONDARY,
    opacity: 0.5,
  },
  bookingNextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
  galleryModalContainer: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  galleryBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  galleryHeaderSpacer: {
    width: 40,
    height: 40,
  },
  galleryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  galleryGrid: {
    padding: 2,
  },
  galleryItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  galleryEmptyText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
});