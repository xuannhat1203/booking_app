import { ApiBookingItem, getBooking, GetBookingResponse } from '@/apis/bookingApi';
import { addCommentForRoom } from '@/apis/roomApi';
import { BOOKING_COLORS } from '@/constants/booking';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Booking {
  id: string;
  bookingId: string;
  roomId: number;
  roomNumber: string;
  bookingDate: string;
  checkInDate: string;
  checkOutDate: string;
  hotelName: string;
  imageUrl: string;
  rating: number;
  location: string;
  status: 'upcoming' | 'past';
  totalPrice: number;
}

const DEFAULT_RATING = 4.5;

const formatVND = (amount: number): string => {
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
};

const formatBookingDate = (checkInDate: string, checkOutDate: string): string => {
  try {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    return `${checkIn.toLocaleDateString('en-US', options)} - ${checkOut.toLocaleDateString('en-US', options)}`;
  } catch (error) {
    return `${checkInDate} - ${checkOutDate}`;
  }
};

const transformApiBookingToBooking = (apiBooking: ApiBookingItem, status: 'upcoming' | 'past'): Booking => {
  return {
    id: String(apiBooking.id),
    bookingId: String(apiBooking.id),
    roomId: apiBooking.roomId,
    roomNumber: apiBooking.roomNumber || '',
    bookingDate: formatBookingDate(apiBooking.checkInDate, apiBooking.checkOutDate),
    checkInDate: apiBooking.checkInDate,
    checkOutDate: apiBooking.checkOutDate,
    hotelName: apiBooking.hotelName,
    imageUrl: apiBooking.imageUrl,
    rating: DEFAULT_RATING,
    location: apiBooking.address,
    status,
    totalPrice: apiBooking.total_price || 0,
  };
};

export default function BookingsScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [userId, setUserId] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [modalHeight, setModalHeight] = useState<number>(0.6); // 60% of screen height initially
  const panY = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;
  const minHeight = 0.5; // 50% minimum
  const maxHeight = 0.95; // 95% maximum

  // Enable LayoutAnimation for Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    const getUserId = async (): Promise<void> => {
      try {
        const idUser = await AsyncStorage.getItem("userId");
        if (idUser) {
          setUserId(idUser);
        }
      } catch (error) {
        console.log('====================================');
        console.log(error);
        console.log('====================================');
      }
    };
    getUserId();
  }, []);

  const { data: bookingResponse, error: bookingError, isLoading: isLoadingBookings } = useQuery<GetBookingResponse>({
    queryKey: ["get_list_booking", userId],
    queryFn: () => getBooking(Number(userId)),
    enabled: !!userId,
    retry: 1,
  });

  const upcomingBookings: Booking[] = React.useMemo(() => {
    if (!bookingResponse?.data?.other) return [];
    return bookingResponse.data.other.map((item) => transformApiBookingToBooking(item, 'upcoming'));
  }, [bookingResponse]);

  const pastBookings: Booking[] = React.useMemo(() => {
    if (!bookingResponse?.data?.completed) return [];
    return bookingResponse.data.completed.map((item) => transformApiBookingToBooking(item, 'past'));
  }, [bookingResponse]);

  const bookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const submitReviewMutation = useMutation({
    mutationFn: async ({ roomId, comment, rating, userId }: { roomId: number; comment: string; rating: number; userId: string }) => {
      return await addCommentForRoom(String(roomId), comment, rating, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get_list_booking"] });
      setReviewModalVisible(false);
      setSelectedBooking(null);
      setRating(0);
      setComment('');
    },
    onError: (error) => {
      console.error('Error submitting review:', error);
    },
  });

  const handleOpenReviewModal = (booking: Booking): void => {
    setSelectedBooking(booking);
    setReviewModalVisible(true);
    setRating(0);
    setComment('');
    setModalHeight(0.6); // Reset to initial height
    panY.setValue(0);
  };

  const handleCloseReviewModal = (): void => {
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start(() => {
      setReviewModalVisible(false);
      setSelectedBooking(null);
      setRating(0);
      setComment('');
      setModalHeight(0.6);
      panY.setValue(0);
    });
  };

  const expandModal = (): void => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
    });
    setModalHeight(maxHeight);
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();
  };

  const minimizeModal = (): void => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
    });
    setModalHeight(0.6);
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();
  };

  const handleBarPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        panY.setOffset((panY as any)._value || 0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Giới hạn phạm vi kéo để tránh giật
        const currentHeight = modalHeight;
        const maxDragUp = screenHeight * (maxHeight - currentHeight);
        const maxDragDown = screenHeight * (currentHeight - minHeight);
        
        let limitedDy = gestureState.dy;
        
        // Giới hạn kéo lên
        if (gestureState.dy < -maxDragUp) {
          limitedDy = -maxDragUp;
        }
        // Giới hạn kéo xuống
        if (gestureState.dy > maxDragDown) {
          limitedDy = maxDragDown;
        }
        
        panY.setValue(limitedDy);
      },
      onPanResponderRelease: (_, gestureState) => {
        panY.flattenOffset();
        
        const velocity = gestureState.vy;
        const dragDistance = gestureState.dy;
        
        // Nếu kéo nhanh (velocity > 0.5), ưu tiên velocity
        if (Math.abs(velocity) > 0.5) {
          if (velocity < -0.5) {
            // Kéo lên nhanh -> expand
            expandModal();
          } else if (velocity > 0.5) {
            // Kéo xuống nhanh
            if (modalHeight > 0.7) {
              minimizeModal();
            } else {
              handleCloseReviewModal();
            }
          } else {
            // Snap back
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 300,
            }).start();
          }
        } 
        // Nếu kéo chậm, dựa vào distance
        else if (dragDistance < -80) {
          // Kéo lên > 80px -> expand
          expandModal();
        } else if (dragDistance > 80) {
          // Kéo xuống > 80px -> minimize or close
          if (modalHeight > 0.7) {
            minimizeModal();
          } else {
            handleCloseReviewModal();
          }
        } else {
          // Snap back
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 300,
          }).start();
        }
      },
    })
  ).current;

  const handleSubmitReview = (): void => {
    if (!selectedBooking || !userId || rating === 0) {
      return;
    }
    submitReviewMutation.mutate({
      roomId: selectedBooking.roomId,
      comment,
      rating,
      userId,
    });
  };
  const renderBookingCard = ({ item }: { item: Booking }): React.JSX.Element => (
    <View style={styles.bookingCard}>
      <ExpoImage
        source={{ uri: item.imageUrl }}
        style={styles.bookingImage}
        contentFit="cover"
      />
      <View style={styles.bookingContent}>
        <View style={styles.bookingHeader}>
          <View>
            {item.roomNumber ? (
              <Text style={styles.bookingId}>Phòng {item.roomNumber}</Text>
            ) : (
              <Text style={styles.bookingId}>Booking ID: {item.bookingId}</Text>
            )}
            <Text style={styles.bookingDate}>{item.bookingDate}</Text>
          </View>
        </View>

        <Text style={styles.hotelName}>{item.hotelName}</Text>
        
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color={BOOKING_COLORS.RATING} />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={BOOKING_COLORS.TEXT_SECONDARY} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>

        {item.totalPrice > 0 && (
          <View style={styles.priceRow}>
            <Ionicons name="cash-outline" size={16} color={BOOKING_COLORS.PRICE} />
            <Text style={styles.priceText}>{formatVND(item.totalPrice)}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {item.status === 'upcoming' ? (
            <>
              <TouchableOpacity style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsButtonText}>View Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.reviewButton}
                onPress={() => handleOpenReviewModal(item)}>
                <Text style={styles.reviewButtonText}>Viết đánh giá</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookAgainButton}>
                <Text style={styles.bookAgainButtonText}>Book Again</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}>
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}>
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {isLoadingBookings ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="hourglass-outline" size={64} color={BOOKING_COLORS.TEXT_SECONDARY} />
          <Text style={styles.emptyText}>Loading bookings...</Text>
        </View>
      ) : bookingError ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={BOOKING_COLORS.HEART} />
          <Text style={styles.emptyText}>Failed to load bookings</Text>
          <Text style={styles.errorText}>
            {bookingError instanceof Error ? bookingError.message : 'Unknown error'}
          </Text>
          {__DEV__ && (
            <Text style={styles.errorText}>
              Check console for endpoint details
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={BOOKING_COLORS.TEXT_SECONDARY} />
              <Text style={styles.emptyText}>No {activeTab} bookings</Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseReviewModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={handleCloseReviewModal}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={styles.modalWrapper}>
            <Animated.View 
              style={[
                styles.modalContainer,
                {
                  height: screenHeight * modalHeight,
                  maxHeight: Platform.OS === 'ios'
                    ? screenHeight - insets.top
                    : screenHeight,
                  transform: [{ translateY: panY }],
                },
              ]}>
                {/* Handle Bar */}
                <View 
                  style={styles.modalHandleBar}
                  {...handleBarPanResponder.panHandlers}>
                  <TouchableOpacity 
                    onPress={expandModal}
                    activeOpacity={0.7}
                    style={styles.modalHandleTouchable}>
                    <View style={styles.modalHandle} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Text style={styles.modalTitle}>Viết đánh giá</Text>
                    <Text style={styles.modalSubtitle}>Chia sẻ trải nghiệm của bạn</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={handleCloseReviewModal}
                    style={styles.modalCloseButton}>
                    <Ionicons name="close" size={22} color={BOOKING_COLORS.TEXT_SECONDARY} />
                  </TouchableOpacity>
                </View>

            {selectedBooking && (
              <View style={styles.modalHotelInfo}>
                <ExpoImage
                  source={{ uri: selectedBooking.imageUrl }}
                  style={styles.modalHotelImage}
                  contentFit="cover"
                />
                <View style={styles.modalHotelDetails}>
                  <Text style={styles.modalHotelName}>{selectedBooking.hotelName}</Text>
                  <View style={styles.modalHotelLocationContainer}>
                    <Ionicons name="location-outline" size={14} color={BOOKING_COLORS.TEXT_SECONDARY} />
                    <Text style={styles.modalHotelLocation}>{selectedBooking.location}</Text>
                  </View>
                </View>
              </View>
            )}

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              alwaysBounceVertical={false}
              scrollEventThrottle={16}>
              {/* Star Rating */}
              <View style={styles.ratingSection}>
                <View style={styles.ratingLabelContainer}>
                  <View style={styles.ratingIconContainer}>
                    <Ionicons name="star" size={22} color={BOOKING_COLORS.RATING} />
                  </View>
                  <View style={styles.ratingLabelTextContainer}>
                    <Text style={styles.ratingLabel}>Đánh giá của bạn</Text>
                    <Text style={styles.ratingSubLabel}>Chạm để đánh giá chuyến lưu trú</Text>
                  </View>
                </View>
                <View style={styles.starContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                      activeOpacity={0.6}>
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={star <= rating ? BOOKING_COLORS.RATING : BOOKING_COLORS.TEXT_SECONDARY}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={16} color={BOOKING_COLORS.BACKGROUND} />
                    <Text style={styles.ratingBadgeText}>{rating} {rating === 1 ? 'Sao' : 'Sao'}</Text>
                  </View>
                )}
              </View>

              {/* Comment Input */}
              <View style={styles.commentSection}>
                <View style={styles.commentLabelContainer}>
                  <View style={styles.commentIconContainer}>
                    <Ionicons name="chatbubble-outline" size={22} color={BOOKING_COLORS.PRIMARY} />
                  </View>
                  <View style={styles.commentLabelTextContainer}>
                    <Text style={styles.commentLabel}>Đánh giá của bạn</Text>
                    <Text style={styles.commentSubLabel}>Chia sẻ với mọi người về trải nghiệm của bạn</Text>
                  </View>
                </View>
                <View style={styles.commentInputWrapper}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Chia sẻ trải nghiệm của bạn tại khách sạn này... Bạn thích điều gì? Điều gì cần cải thiện?"
                    placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
                    multiline
                    numberOfLines={6}
                    value={comment}
                    onChangeText={(text) => {
                      if (text.length <= 500) {
                        setComment(text);
                      }
                    }}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>
                <View style={styles.commentHintContainer}>
                  <View style={styles.commentHintLeft}>
                    <Ionicons name="pencil-outline" size={12} color={BOOKING_COLORS.TEXT_SECONDARY} />
                    <Text style={styles.commentHintText}>Tùy chọn nhưng hữu ích</Text>
                  </View>
                  <View style={styles.commentHintRight}>
                    <Text style={[styles.commentHint, comment.length > 450 && styles.commentHintWarning]}>
                      {comment.length} / 500 ký tự
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={[styles.modalFooter, Platform.OS === 'ios' && { paddingBottom: 20 + insets.bottom }]}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (rating === 0 || submitReviewMutation.isPending) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={rating === 0 || submitReviewMutation.isPending}>
                {submitReviewMutation.isPending ? (
                  <ActivityIndicator color={BOOKING_COLORS.BACKGROUND} />
                ) : (
                  <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                )}
              </TouchableOpacity>
            </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: BOOKING_COLORS.PRIMARY,
    borderColor: BOOKING_COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  tabTextActive: {
    color: BOOKING_COLORS.BACKGROUND,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bookingImage: {
    width: '100%',
    height: 180,
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.PRICE,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.PRIMARY,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.BACKGROUND,
  },
  reviewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.PRIMARY,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  bookAgainButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
  },
  bookAgainButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.BACKGROUND,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: BOOKING_COLORS.HEART,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalHandleBar: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  modalHandleTouchable: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: BOOKING_COLORS.TEXT_SECONDARY,
    borderRadius: 2,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    fontWeight: '400',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  modalHotelInfo: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  modalHotelImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 16,
  },
  modalHotelDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  modalHotelName: {
    fontSize: 17,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  modalHotelLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalHotelLocation: {
    fontSize: 13,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    minHeight: 300,
  },
  modalContentContainer: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  ratingSection: {
    marginBottom: 24,
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingLeft: 12,
  },
  ratingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BOOKING_COLORS.RATING}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ratingLabelTextContainer: {
    flex: 1,
    paddingLeft: 0,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  ratingSubLabel: {
    fontSize: 13,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    fontWeight: '400',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  starButton: {
    padding: 8,
  },
  ratingBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: BOOKING_COLORS.PRIMARY,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
    letterSpacing: 0.3,
  },
  commentSection: {
    marginBottom: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  commentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  commentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BOOKING_COLORS.PRIMARY}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentLabelTextContainer: {
    flex: 1,
  },
  commentLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  commentSubLabel: {
    fontSize: 13,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    fontWeight: '400',
  },
  commentInputWrapper: {
    borderRadius: 16,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderWidth: 1.5,
    borderColor: BOOKING_COLORS.BORDER,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
    }),
  },
  commentInput: {
    padding: 18,
    fontSize: 15,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    minHeight: 150,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  commentHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  commentHintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentHintRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentHint: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  commentHintText: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  commentHintWarning: {
    color: BOOKING_COLORS.HEART,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: BOOKING_COLORS.BORDER,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  submitButton: {
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: BOOKING_COLORS.PRIMARY,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: BOOKING_COLORS.TEXT_SECONDARY,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
    letterSpacing: 0.3,
  },
});

