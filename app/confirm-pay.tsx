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
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

  const checkIn = new Date(params.checkInDate || '');
  const checkOut = new Date(params.checkOutDate || '');
  const nights = params.nights ? parseInt(params.nights, 10) : Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const pricePerNight = parseFloat(params.pricePerNight || '0');
  const rooms = parseInt(params.rooms || '1', 10);
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
        adults: parseInt(params.adults || '2', 10),
        children: parseInt(params.children || '0', 10),
        rooms: parseInt(params.rooms || '1', 10),
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
        adults: parseInt(params.adults || '2', 10),
        children: parseInt(params.children || '0', 10),
        rooms: parseInt(params.rooms || '1', 10),
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
                {params.adults || '2'} người lớn | {params.children || '0'} trẻ em
                {params.infants && parseInt(params.infants, 10) > 0 && ` | ${params.infants} trẻ sơ sinh`}
                {params.rooms && parseInt(params.rooms, 10) > 1 && ` | ${params.rooms} phòng`}
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
              <TouchableOpacity>
                <Ionicons name="create-outline" size={20} color={BOOKING_COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Khách</Text>
                <Text style={styles.detailValue}>
                  {params.adults || '2'} người lớn | {params.children || '0'} trẻ em
                  {params.infants && parseInt(params.infants, 10) > 0 && ` | ${params.infants} trẻ sơ sinh`}
                  {params.rooms && parseInt(params.rooms, 10) > 1 && ` | ${params.rooms} phòng`}
                </Text>
              </View>
              <TouchableOpacity>
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
});

