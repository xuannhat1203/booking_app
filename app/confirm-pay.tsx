import { getDetaiCart, getListCart, getDetail, Card } from '@/apis/authApi';
import { createBooking, CreateBookingData } from '@/apis/bookingApi';
import { BOOKING_COLORS } from '@/constants/booking';
import { useToast } from '@/hooks/use-toast';
import { getBookingErrorMessage } from '@/utils/errorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';

interface PaymentOption {
  id: string;
  label: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'card', label: 'Thanh toán bằng thẻ' },
  { id: 'later', label: 'Thanh toán sau' },
] as const;

export default function ConfirmPayScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, ToastComponent } = useToast();
  const params = useLocalSearchParams<{
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
    adults: string;
    children: string;
    infants?: string;
    rooms?: string;
    nights?: string;
    imageUrl?: string;
    hotelName?: string;
    pricePerNight?: string;
  }>();
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>('card');
  const [userId, setUserId] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCardDetail, setSelectedCardDetail] = useState<Card | null>(null);
  
  // Initialize dates and guests from params
  const [checkIn, setCheckIn] = useState<Date>(new Date(params.checkInDate || ''));
  const [checkOut, setCheckOut] = useState<Date>(new Date(params.checkOutDate || ''));
  const [adults, setAdults] = useState<number>(parseInt(params.adults || '2', 10));
  const [children, setChildren] = useState<number>(parseInt(params.children || '0', 10));
  const [rooms, setRooms] = useState<number>(parseInt(params.rooms || '1', 10));
  
  // Edit booking states
  const [editDateModalVisible, setEditDateModalVisible] = useState<boolean>(false);
  const [editGuestsModalVisible, setEditGuestsModalVisible] = useState<boolean>(false);
  const [tempCheckIn, setTempCheckIn] = useState<Date>(new Date(params.checkInDate || ''));
  const [tempCheckOut, setTempCheckOut] = useState<Date>(new Date(params.checkOutDate || ''));
  const [tempAdults, setTempAdults] = useState<number>(parseInt(params.adults || '2', 10));
  const [tempChildren, setTempChildren] = useState<number>(parseInt(params.children || '0', 10));
  const [tempRooms, setTempRooms] = useState<number>(parseInt(params.rooms || '1', 10));
  const [showCheckInPicker, setShowCheckInPicker] = useState<boolean>(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState<boolean>(false);

  React.useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id && id.trim() !== '') {
          setUserId(id.trim());
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error fetching userId:', error);
        }
      }
    };
    fetchUserId();
  }, []);

  // Query để lấy danh sách thẻ khi chọn thanh toán bằng thẻ
  const { data: cardsList, isLoading: isLoadingCards, error: cardsError, refetch: refetchCards } = useQuery({
    queryKey: ["get_list_cards", userId],
    queryFn: () => getListCart(parseInt(userId)),
    enabled: !!userId && userId.trim() !== '' && selectedPaymentOption === 'card',
    retry: false,
  });

  // Query để lấy chi tiết thẻ đã chọn
  const { data: cardDetail, isLoading: isLoadingCardDetail } = useQuery({
    queryKey: ["get_card_detail", selectedCardId],
    queryFn: () => getDetail(selectedCardId!),
    enabled: !!selectedCardId && selectedCardId > 0,
    retry: false,
  });

  // Cập nhật selectedCardDetail khi cardDetail thay đổi
  useEffect(() => {
    if (cardDetail?.data) {
      setSelectedCardDetail(cardDetail.data);
    }
  }, [cardDetail]);

  // Tự động chọn thẻ đầu tiên nếu chỉ có 1 thẻ và chưa chọn thẻ nào
  useEffect(() => {
    if (
      selectedPaymentOption === 'card' &&
      cardsList?.data &&
      cardsList.data.length === 1 &&
      !selectedCardId
    ) {
      const firstCard = cardsList.data[0];
      if (__DEV__) {
        console.log('Auto-selecting first card:', {
          cardId: firstCard.id,
          cardNumber: firstCard.cardNumber,
        });
      }
      setSelectedCardId(firstCard.id);
    }
  }, [cardsList, selectedPaymentOption, selectedCardId]);

  // Log khi selectedCardId thay đổi
  useEffect(() => {
    if (__DEV__ && selectedPaymentOption === 'card') {
      console.log('selectedCardId changed:', {
        selectedCardId,
        selectedCardIdType: typeof selectedCardId,
        selectedPaymentOption,
      });
    }
  }, [selectedCardId, selectedPaymentOption]);

  // Update temp values when modal opens
  React.useEffect(() => {
    if (editDateModalVisible) {
      setTempCheckIn(checkIn);
      setTempCheckOut(checkOut);
    }
  }, [editDateModalVisible]);
  
  React.useEffect(() => {
    if (editGuestsModalVisible) {
      setTempAdults(adults);
      setTempChildren(children);
      setTempRooms(rooms);
    }
  }, [editGuestsModalVisible]);
  
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const pricePerNight = parseFloat(params.pricePerNight || '0');
  const basePrice = nights * pricePerNight * rooms;
  const discount = 50;
  const taxes = 10;
  const grandTotal = basePrice - discount + taxes;

  const formatVND = (amount: number): string => {
    return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
      setTempCheckIn(selectedDate);
      // Auto update check-out if it's before check-in
      if (tempCheckOut <= selectedDate) {
        const newCheckOut = new Date(selectedDate);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        setTempCheckOut(newCheckOut);
      }
    }
  };

  const handleCheckOutChange = (event: any, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowCheckOutPicker(false);
    }
    if (selectedDate && selectedDate > tempCheckIn) {
      setTempCheckOut(selectedDate);
    }
  };

  const handleSaveDateChanges = (): void => {
    if (tempCheckIn && tempCheckOut && tempCheckOut > tempCheckIn) {
      setCheckIn(tempCheckIn);
      setCheckOut(tempCheckOut);
      setEditDateModalVisible(false);
    }
  };

  const handleSaveGuestsChanges = (): void => {
    setAdults(tempAdults);
    setChildren(tempChildren);
    setRooms(tempRooms);
    setEditGuestsModalVisible(false);
  };

  const updateCount = (type: 'adults' | 'children' | 'rooms', delta: number): void => {
    if (type === 'adults') {
      setTempAdults(Math.max(1, Math.min(10, tempAdults + delta)));
    } else if (type === 'children') {
      setTempChildren(Math.max(0, Math.min(10, tempChildren + delta)));
    } else if (type === 'rooms') {
      setTempRooms(Math.max(1, Math.min(5, tempRooms + delta)));
    }
  };

  // Format date cho API: "DD-MM-YYYY HH:mm"
  const formatDateForAPI = (date: Date, time: string): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year} ${time}`;
  };

  // Mutation để tạo booking
  const bookingMutation = useMutation({
    mutationFn: (bookingData: CreateBookingData) => createBooking(bookingData),
    onSuccess: () => {
      showSuccess('Đặt phòng thành công!');
      setTimeout(() => {
        router.push({
          pathname: '/payment-success',
          params: {
            ...params,
            nights: nights.toString(),
            total: grandTotal.toString(),
          },
        });
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = getBookingErrorMessage(error);
      showError(errorMessage);
    },
  });

  const handlePayNow = (): void => {
    if (__DEV__) {
      console.log('=== handlePayNow called ===', {
        selectedPaymentOption,
        selectedCardId,
        userId,
        params: {
          roomId: params.roomId,
          checkInDate: params.checkInDate,
          checkOutDate: params.checkOutDate,
        },
      });
    }

    // Kiểm tra userId
    if (!userId) {
      showError('Vui lòng đăng nhập để đặt phòng');
      return;
    }

    // Kiểm tra dữ liệu cần thiết
    if (!params.roomId || !params.checkInDate || !params.checkOutDate) {
      showError('Thiếu thông tin đặt phòng');
      return;
    }

    if (selectedPaymentOption === 'later') {
      if (__DEV__) {
        console.log('Payment option: LATER (cash payment)');
      }
      // Thanh toán sau - tạo booking ngay
      const bookingData: CreateBookingData = {
        userId: parseInt(userId, 10),
        roomId: parseInt(params.roomId, 10),
        checkInDate: formatDateForAPI(checkIn, '14:00'),
        checkOutDate: formatDateForAPI(checkOut, '12:00'),
        adults: adults,
        children: children,
        rooms: rooms,
        typePayment: true, // true = thanh toán sau (tiền mặt)
      };
      bookingMutation.mutate(bookingData);
    } else if (selectedPaymentOption === 'card') {
      if (__DEV__) {
        console.log('Payment option: CARD (card payment)', {
          isLoadingCards,
          cardsList: cardsList?.data,
          selectedCardId,
        });
      }

      // Thanh toán bằng thẻ - kiểm tra xem đã chọn thẻ chưa
      if (isLoadingCards) {
        showError('Đang tải danh sách thẻ...');
        return;
      }

      // Kiểm tra nếu không có thẻ nào
      const cards = cardsList?.data || [];
      if (cards.length === 0) {
        // Không có thẻ -> Chuyển sang trang add-card
        router.push({
          pathname: '/add-card',
          params: {
            ...params,
            nights: nights.toString(),
            total: grandTotal.toString(),
          },
        });
        return;
      }

      // Kiểm tra xem đã chọn thẻ chưa
      if (!selectedCardId) {
        showError('Vui lòng chọn thẻ để thanh toán');
        return;
      }

      // Nếu có selectedCardId nhưng chưa có selectedCardDetail, vẫn cho phép thanh toán
      // (cardDetail sẽ được fetch tự động)
      if (!selectedCardDetail && isLoadingCardDetail) {
        showError('Đang tải thông tin thẻ...');
        return;
      }

      // Đã chọn thẻ -> Tạo booking trực tiếp với typePayment = false và cardId
      if (__DEV__) {
        console.log('Creating booking with card payment:', {
          selectedCardId,
          selectedCardIdType: typeof selectedCardId,
          selectedCardDetail,
          hasCardId: !!selectedCardId,
          cardsList: cardsList?.data,
          selectedPaymentOption,
        });
      }

      // Đảm bảo selectedCardId là number, không phải null
      if (!selectedCardId || typeof selectedCardId !== 'number') {
        showError('Vui lòng chọn thẻ để thanh toán');
        if (__DEV__) {
          console.error('selectedCardId is invalid:', selectedCardId);
        }
        return;
      }

      const bookingData: CreateBookingData = {
        userId: parseInt(userId, 10),
        roomId: parseInt(params.roomId, 10),
        checkInDate: formatDateForAPI(checkIn, '14:00'),
        checkOutDate: formatDateForAPI(checkOut, '12:00'),
        adults: adults,
        children: children,
        rooms: rooms,
        typePayment: false, // false = thanh toán bằng tài khoản (thẻ)
        cardId: selectedCardId, // Gửi cardId của thẻ đã chọn (đảm bảo là number)
      };

      if (__DEV__) {
        console.log('=== BOOKING DATA TO SEND ===');
        console.log('Booking data to send:', JSON.stringify(bookingData, null, 2));
        console.log('Booking data cardId value:', bookingData.cardId);
        console.log('Booking data cardId type:', typeof bookingData.cardId);
        console.log('Booking data typePayment:', bookingData.typePayment);
        console.log('============================');
      }

      bookingMutation.mutate(bookingData);
    } else {
      if (__DEV__) {
        console.error('Unknown payment option:', selectedPaymentOption);
      }
      showError('Phương thức thanh toán không hợp lệ');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {ToastComponent}
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận & Thanh toán</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.content}>
          {/* Booking Summary Card */}
          <View style={styles.summaryCard}>
            <ExpoImage
              source={{ uri: params.imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400' }}
              style={styles.summaryImage}
              contentFit="cover"
            />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryHotelName}>
                {params.hotelName || 'Tên khách sạn'}
              </Text>
              <View style={styles.summaryRating}>
                <Ionicons name="star" size={16} color={BOOKING_COLORS.RATING} />
                <Text style={styles.summaryRatingText}>4.5</Text>
                <Text style={styles.summaryReviews}>(95 đánh giá)</Text>
              </View>
              <Text style={styles.summaryGuests}>
                {adults} người lớn | {children} trẻ em
                {rooms > 1 && ` | ${rooms} phòng`}
              </Text>
            </View>
          </View>

          {/* Booking Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết đặt phòng</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Ngày</Text>
                <Text style={styles.detailValue}>
                  {formatDate(checkIn)} - {formatDate(checkOut)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditDateModalVisible(true)}>
                <Ionicons name="create-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Khách</Text>
                <Text style={styles.detailValue}>
                  {adults} người lớn | {children} trẻ em
                  {rooms > 1 && ` | ${rooms} phòng`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditGuestsModalVisible(true)}>
                <Ionicons name="create-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn phương thức thanh toán</Text>
            {PAYMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.paymentOption}
                onPress={() => setSelectedPaymentOption(option.id)}>
                <View style={styles.radioButton}>
                  {selectedPaymentOption === option.id && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.paymentOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Card List - Only show when card payment is selected */}
          {selectedPaymentOption === 'card' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn thẻ thanh toán</Text>
              
              {isLoadingCards ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={BOOKING_COLORS.PRIMARY} />
                  <Text style={styles.loadingText}>Đang tải danh sách thẻ...</Text>
                </View>
              ) : cardsError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
                  <Text style={styles.errorText}>Không thể tải danh sách thẻ</Text>
                </View>
              ) : (
                <>
                  {cardsList?.data && cardsList.data.length > 0 ? (
                    <View style={styles.cardsListContainer}>
                      {cardsList.data.map((card) => (
                        <TouchableOpacity
                          key={card.id}
                          style={[
                            styles.cardItem,
                            selectedCardId === card.id && styles.cardItemSelected,
                          ]}
                          onPress={() => {
                            if (__DEV__) {
                              console.log('Card selected:', {
                                cardId: card.id,
                                cardNumber: card.cardNumber,
                                previousSelectedCardId: selectedCardId,
                              });
                            }
                            setSelectedCardId(card.id);
                            // Reset selectedCardDetail để trigger fetch lại
                            setSelectedCardDetail(null);
                          }}>
                          <View style={styles.cardItemContent}>
                            <View style={styles.cardItemHeader}>
                              <Ionicons
                                name="card-outline"
                                size={24}
                                color={selectedCardId === card.id ? BOOKING_COLORS.PRIMARY : BOOKING_COLORS.TEXT_PRIMARY}
                              />
                              <View style={styles.cardItemInfo}>
                                <Text style={[
                                  styles.cardItemNumber,
                                  selectedCardId === card.id && styles.cardItemNumberSelected,
                                ]}>
                                  {card.cardNumber}
                                </Text>
                                <Text style={styles.cardItemName}>{card.cardHolderName}</Text>
                              </View>
                            </View>
                            <View style={styles.cardItemFooter}>
                              <View style={styles.cardItemDetails}>
                                <Text style={styles.cardItemLabel}>Hết hạn:</Text>
                                <Text style={styles.cardItemValue}>{card.expiryDate}</Text>
                              </View>
                              <View style={styles.cardItemDetails}>
                                <Text style={styles.cardItemLabel}>Số dư:</Text>
                                <Text style={[
                                  styles.cardItemValue,
                                  styles.cardItemBalance,
                                ]}>
                                  {formatVND(card.balance)}
                                </Text>
                              </View>
                            </View>
                          </View>
                          {selectedCardId === card.id && (
                            <View style={styles.cardItemCheckmark}>
                              <Ionicons name="checkmark-circle" size={24} color={BOOKING_COLORS.PRIMARY} />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyCardsContainer}>
                      <Ionicons name="card-outline" size={48} color={BOOKING_COLORS.TEXT_SECONDARY} />
                      <Text style={styles.emptyCardsText}>Bạn chưa có thẻ nào</Text>
                      <Text style={styles.emptyCardsSubtext}>Thêm thẻ để thanh toán</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.addPaymentButton}
                    onPress={() => router.push({
                      pathname: '/add-card',
                      params: {
                        ...params,
                        nights: nights.toString(),
                        total: grandTotal.toString(),
                      },
                    })}>
                    <Ionicons name="add-circle-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
                    <Text style={styles.addPaymentButtonText}>Thêm thẻ mới</Text>
                  </TouchableOpacity>

                  {/* Hiển thị thông tin thẻ đã chọn */}
                  {selectedCardDetail && (
                    <View style={styles.selectedCardInfo}>
                      <View style={styles.selectedCardInfoHeader}>
                        <Ionicons name="information-circle-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
                        <Text style={styles.selectedCardInfoTitle}>Thẻ đã chọn</Text>
                      </View>
                      <View style={styles.selectedCardInfoContent}>
                        <Text style={styles.selectedCardInfoText}>
                          {selectedCardDetail.cardNumber} • {selectedCardDetail.cardHolderName}
                        </Text>
                        <Text style={styles.selectedCardInfoSubtext}>
                          Số dư: {formatVND(selectedCardDetail.balance)}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Price Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết giá</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {nights} đêm{rooms > 1 && ` × ${rooms} phòng`}
              </Text>
              <Text style={styles.priceValue}>{formatVND(basePrice)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giảm giá</Text>
              <Text style={[styles.priceValue, styles.discountValue]}>
                -{formatVND(discount)}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Thuế và phí</Text>
              <Text style={styles.priceValue}>{formatVND(taxes)}</Text>
            </View>

            <View style={[styles.priceRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Tổng cộng</Text>
              <Text style={styles.grandTotalValue}>{formatVND(grandTotal)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Date Modal */}
      <Modal
        visible={editDateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditDateModalVisible(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditDateModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setEditDateModalVisible(false)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={22} color={BOOKING_COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chỉnh sửa ngày</Text>
              <View style={styles.modalCloseButton} />
            </View>
            
            <View style={styles.bookingSection}>
              <View style={styles.bookingRow}>
                <View style={styles.bookingItem}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="calendar-outline" size={16} color={BOOKING_COLORS.PRIMARY} />
                    <Text style={styles.bookingLabel}>Ngày nhận phòng</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowCheckInPicker(true)}
                    activeOpacity={0.7}>
                    <Text style={styles.dateInputText}>{formatDateShort(tempCheckIn)}</Text>
                    <Ionicons name="chevron-down-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                  </TouchableOpacity>
                </View>
                <View style={styles.bookingItem}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="calendar-outline" size={16} color={BOOKING_COLORS.PRIMARY} />
                    <Text style={styles.bookingLabel}>Ngày trả phòng</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowCheckOutPicker(true)}
                    activeOpacity={0.7}>
                    <Text style={styles.dateInputText}>{formatDateShort(tempCheckOut)}</Text>
                    <Ionicons name="chevron-down-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Nights display */}
              <View style={styles.nightsDisplay}>
                <Ionicons name="moon-outline" size={18} color={BOOKING_COLORS.PRIMARY} />
                <Text style={styles.nightsText}>
                  {Math.ceil((tempCheckOut.getTime() - tempCheckIn.getTime()) / (1000 * 60 * 60 * 24))} đêm
                </Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.bookingNextButton,
                  (!tempCheckIn || !tempCheckOut || tempCheckOut <= tempCheckIn) && styles.bookingNextButtonDisabled,
                ]}
                onPress={handleSaveDateChanges}
                disabled={!tempCheckIn || !tempCheckOut || tempCheckOut <= tempCheckIn}
                activeOpacity={0.8}>
                <Text style={styles.bookingNextButtonText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Guests Modal */}
      <Modal
        visible={editGuestsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditGuestsModalVisible(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditGuestsModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setEditGuestsModalVisible(false)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={22} color={BOOKING_COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chỉnh sửa số khách</Text>
              <View style={styles.modalCloseButton} />
            </View>
            
            <View style={styles.bookingSection}>
              <View style={styles.guestsContentBox}>
                <View style={styles.guestItem}>
                  <Text style={styles.guestItemLabel}>Người lớn</Text>
                  <View style={styles.guestCounterContainer}>
                    <TouchableOpacity
                      style={[styles.guestCounterButton, tempAdults <= 1 && styles.guestCounterButtonDisabled]}
                      onPress={() => updateCount('adults', -1)}
                      disabled={tempAdults <= 1}>
                      <Ionicons
                        name="remove"
                        size={18}
                        color={tempAdults <= 1 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                    <Text style={styles.guestCounterValue}>{tempAdults}</Text>
                    <TouchableOpacity
                      style={[styles.guestCounterButton, tempAdults >= 10 && styles.guestCounterButtonDisabled]}
                      onPress={() => updateCount('adults', 1)}
                      disabled={tempAdults >= 10}>
                      <Ionicons
                        name="add"
                        size={18}
                        color={tempAdults >= 10 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.guestItem}>
                  <Text style={styles.guestItemLabel}>Trẻ em</Text>
                  <View style={styles.guestCounterContainer}>
                    <TouchableOpacity
                      style={[styles.guestCounterButton, tempChildren <= 0 && styles.guestCounterButtonDisabled]}
                      onPress={() => updateCount('children', -1)}
                      disabled={tempChildren <= 0}>
                      <Ionicons
                        name="remove"
                        size={18}
                        color={tempChildren <= 0 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                    <Text style={styles.guestCounterValue}>{tempChildren}</Text>
                    <TouchableOpacity
                      style={[styles.guestCounterButton, tempChildren >= 10 && styles.guestCounterButtonDisabled]}
                      onPress={() => updateCount('children', 1)}
                      disabled={tempChildren >= 10}>
                      <Ionicons
                        name="add"
                        size={18}
                        color={tempChildren >= 10 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.guestItem}>
                  <Text style={styles.guestItemLabel}>Số phòng</Text>
                  <View style={styles.guestCounterContainer}>
                    <TouchableOpacity
                      style={[styles.guestCounterButton, tempRooms <= 1 && styles.guestCounterButtonDisabled]}
                      onPress={() => updateCount('rooms', -1)}
                      disabled={tempRooms <= 1}>
                      <Ionicons
                        name="remove"
                        size={18}
                        color={tempRooms <= 1 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                    <Text style={styles.guestCounterValue}>{tempRooms}</Text>
                    <TouchableOpacity
                      style={[styles.guestCounterButton, tempRooms >= 5 && styles.guestCounterButtonDisabled]}
                      onPress={() => updateCount('rooms', 1)}
                      disabled={tempRooms >= 5}>
                      <Ionicons
                        name="add"
                        size={18}
                        color={tempRooms >= 5 ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.bookingNextButton}
                onPress={handleSaveGuestsChanges}
                activeOpacity={0.85}>
                <Text style={styles.bookingNextButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showCheckInPicker && (
        <DateTimePicker
          value={tempCheckIn}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleCheckInChange}
        />
      )}
      {showCheckOutPicker && (
        <DateTimePicker
          value={tempCheckOut}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date(tempCheckIn.getTime() + 24 * 60 * 60 * 1000)}
          onChange={handleCheckOutChange}
        />
      )}

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.payButton, bookingMutation.isPending && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={bookingMutation.isPending}>
          {bookingMutation.isPending ? (
            <ActivityIndicator size="small" color={BOOKING_COLORS.BACKGROUND} />
          ) : (
            <Text style={styles.payButtonText}>
              {selectedPaymentOption === 'later' ? 'Xác nhận đặt phòng' : 'Thanh toán ngay'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  summaryImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  summaryHotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  summaryRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  summaryRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  summaryReviews: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  summaryGuests: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BOOKING_COLORS.PRIMARY,
  },
  paymentOptionText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  addPaymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  cardsListContainer: {
    gap: 12,
    marginBottom: 8,
  },
  cardItem: {
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: BOOKING_COLORS.BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardItemSelected: {
    borderColor: BOOKING_COLORS.PRIMARY,
    backgroundColor: BOOKING_COLORS.PRIMARY + '10',
  },
  cardItemContent: {
    flex: 1,
  },
  cardItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardItemInfo: {
    flex: 1,
  },
  cardItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  cardItemNumberSelected: {
    color: BOOKING_COLORS.PRIMARY,
  },
  cardItemName: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  cardItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BOOKING_COLORS.BORDER,
  },
  cardItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardItemLabel: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  cardItemValue: {
    fontSize: 12,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  cardItemBalance: {
    color: '#10B981',
  },
  cardItemCheckmark: {
    marginLeft: 12,
  },
  emptyCardsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyCardsText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  emptyCardsSubtext: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  selectedCardInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: BOOKING_COLORS.PRIMARY + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.PRIMARY + '30',
  },
  selectedCardInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  selectedCardInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  selectedCardInfoContent: {
    gap: 4,
  },
  selectedCardInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  selectedCardInfoSubtext: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  discountValue: {
    color: '#10B981',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BOOKING_COLORS.BORDER,
  },
  grandTotalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.PRIMARY,
  },
  bottomBar: {
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: BOOKING_COLORS.BORDER,
    paddingHorizontal: 16,
    paddingTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  payButton: {
    width: '100%',
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: BOOKING_COLORS.BORDER,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  bookingSection: {
    padding: 0,
  },
  guestsContentBox: {
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  guestItem: {
    marginBottom: 20,
  },
  guestItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  guestCounterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  guestCounterButtonDisabled: {
    borderColor: BOOKING_COLORS.BORDER,
    opacity: 0.4,
  },
  guestCounterValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    minWidth: 40,
    textAlign: 'center',
  },
  bookingSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 20,
    textAlign: 'center',
  },
  bookingRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  bookingItem: {
    flex: 1,
  },
  guestsListContainer: {
    gap: 20,
    marginBottom: 28,
  },
  guestItemCard: {
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BOOKING_COLORS.BORDER,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  guestItemCardInner: {
    padding: 20,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
  },
  guestItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 14,
  },
  guestItemIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestItemIconBackground: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BOOKING_COLORS.PRIMARY + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: BOOKING_COLORS.PRIMARY + '35',
  },
  guestItemIconBackgroundSecondary: {
    backgroundColor: '#10B981' + '15',
    borderColor: '#10B981' + '35',
  },
  guestItemIconBackgroundTertiary: {
    backgroundColor: '#8B5CF6' + '15',
    borderColor: '#8B5CF6' + '35',
  },
  guestItemInfo: {
    flex: 1,
  },
  guestItemLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  guestItemSubtext: {
    fontSize: 13,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    fontWeight: '400',
    lineHeight: 18,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  bookingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    borderWidth: 1.5,
    borderColor: BOOKING_COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dateInputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  nightsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: BOOKING_COLORS.PRIMARY + '10',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.PRIMARY + '20',
  },
  nightsText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.PRIMARY,
  },
  guestsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: BOOKING_COLORS.PRIMARY + '10',
    borderRadius: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: BOOKING_COLORS.PRIMARY + '20',
    ...Platform.select({
      ios: {
        shadowColor: BOOKING_COLORS.PRIMARY,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  guestsSummaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BOOKING_COLORS.PRIMARY + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BOOKING_COLORS.PRIMARY + '30',
  },
  guestsSummaryContent: {
    flex: 1,
    gap: 3,
  },
  guestsSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  guestsSummaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  counterButtonMinus: {
    backgroundColor: '#EF4444',
  },
  counterButtonPlus: {
    backgroundColor: BOOKING_COLORS.PRIMARY,
  },
  counterButtonDisabled: {
    backgroundColor: BOOKING_COLORS.BORDER,
    opacity: 0.35,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  counterValueContainer: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  counterValueBackground: {
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: BOOKING_COLORS.PRIMARY + '25',
    minWidth: 64,
    ...Platform.select({
      ios: {
        shadowColor: BOOKING_COLORS.PRIMARY,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  counterValue: {
    fontSize: 28,
    fontWeight: '700',
    color: BOOKING_COLORS.PRIMARY,
    letterSpacing: 0.5,
  },
  bookingNextButton: {
    width: '100%',
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: BOOKING_COLORS.PRIMARY,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bookingNextButtonDisabled: {
    backgroundColor: BOOKING_COLORS.TEXT_SECONDARY,
    opacity: 0.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  bookingNextButtonIcon: {
    marginRight: 2,
  },
  bookingNextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
});

