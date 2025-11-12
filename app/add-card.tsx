import { createCard, getDetaiCart } from '@/apis/authApi';
import { createBooking, CreateBookingData } from '@/apis/bookingApi';
import { BOOKING_COLORS } from '@/constants/booking';
import { useToast } from '@/hooks/use-toast';
import { getBookingErrorMessage } from '@/utils/errorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddCardScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, ToastComponent } = useToast();
  const params = useLocalSearchParams<{
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
    nights: string;
    adults: string;
    children: string;
    infants?: string;
    rooms: string;
    total: string;
    imageUrl?: string;
    hotelName?: string;
    pricePerNight?: string;
  }>();

  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
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

  // Format date cho API: "DD-MM-YYYY HH:mm"
  const formatDateForAPI = (dateString: string, time: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year} ${time}`;
  };

  // Mutation để tạo thẻ
  const createCardMutation = useMutation({
    mutationFn: (cardData: { userId: number; cardNumber: string; cardHolderName: string; expiryDate: string; cvv: string }) => 
      createCard(cardData),
    onSuccess: () => {
      showSuccess('Thêm thẻ thành công!');
    },
    onError: (error: any) => {
      const errorMessage = getBookingErrorMessage(error);
      showError(errorMessage);
    },
  });

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
          },
        });
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = getBookingErrorMessage(error);
      showError(errorMessage);
    },
  });

  const formatCardNumber = (text: string): string => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };
  const { data: getCard, isLoading: isLoadingCard, error: cardError } = useQuery({
    queryKey: ["get_card", userId],
    queryFn: () => getDetaiCart(parseInt(userId)),
    enabled: !!userId && userId.trim() !== '',
  });

  // Log thông tin thẻ từ API
  React.useEffect(() => {
    if (getCard) {
      if (__DEV__) {
        console.log('====================================');
        console.log('THÔNG TIN THẺ TỪ API:');
        console.log('====================================');
        console.log('Full Response:', JSON.stringify(getCard, null, 2));
        console.log('Data:', getCard?.data);
        if (getCard?.data) {
          const cardData = getCard.data;
          console.log('Số thẻ:', cardData.cardNumber);
          console.log('Tên chủ thẻ:', cardData.cardHolderName);
          console.log('Ngày hết hạn:', cardData.expiryDate);
          console.log('CVV:', cardData.cvv);
          console.log('Tất cả các trường:', Object.keys(cardData));
        }
        console.log('====================================');
      }
    }
    if (cardError) {
      if (__DEV__) {
        console.error('Lỗi khi lấy thông tin thẻ:', cardError);
      }
    }
  }, [getCard, cardError]);
  const handleAddCard = async (): Promise<void> => {
    // Validate card info
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 16 || !cardHolder || !expiryDate || cvv.length < 3) {
      showError('Vui lòng điền đầy đủ thông tin thẻ');
      return;
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

    const userIdNum = parseInt(userId, 10);

    // Kiểm tra nếu API getCard đã có dữ liệu
    const savedCard = getCard?.data;
    
    if (!savedCard) {
      // Chưa có thẻ -> Thêm thẻ mới
      if (createCardMutation.isPending) return;
      
      createCardMutation.mutate(
        {
          userId: userIdNum,
          cardNumber: cleanedCardNumber,
          cardHolderName: cardHolder.trim(),
          expiryDate: expiryDate.trim(),
          cvv: cvv.trim(),
        },
        {
          onSuccess: () => {
            // Sau khi thêm thẻ thành công, tạo booking
            const bookingData: CreateBookingData = {
              userId: userIdNum,
              roomId: parseInt(params.roomId, 10),
              checkInDate: formatDateForAPI(params.checkInDate, '14:00'),
              checkOutDate: formatDateForAPI(params.checkOutDate, '12:00'),
              adults: parseInt(params.adults || '2', 10),
              children: parseInt(params.children || '0', 10),
              rooms: parseInt(params.rooms || '1', 10),
              typePayment: false, // false = thanh toán bằng tài khoản (thẻ)
            };
            bookingMutation.mutate(bookingData);
          },
        }
      );
      return;
    }

    // Nếu đã có thẻ nhưng vẫn vào màn hình này (có thể từ profile hoặc lỗi logic)
    // Thì chỉ cho phép thêm thẻ mới, không cho xác nhận
    showError('Bạn đã có thẻ được lưu trong hệ thống. Vui lòng quay lại và thanh toán.');
    return;
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
        <Text style={styles.headerTitle}>Thêm thẻ mới</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.content}>
          {isLoadingCard ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BOOKING_COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Đang tải thông tin thẻ...</Text>
            </View>
          ) : getCard?.data ? (
            <View style={styles.cardInfoContainer}>
              <View style={styles.cardInfoHeader}>
                <Ionicons name="card" size={24} color={BOOKING_COLORS.PRIMARY} />
                <Text style={styles.cardInfoTitle}>Thẻ đã được lưu</Text>
              </View>
              <Text style={styles.cardInfoText}>
                Bạn đã có thẻ được lưu trong hệ thống. Vui lòng quay lại màn hình thanh toán để tiếp tục.
              </Text>
            </View>
          ) : (
            <View style={styles.cardInfoContainer}>
              <View style={styles.cardInfoHeader}>
                <Ionicons name="add-circle-outline" size={24} color={BOOKING_COLORS.PRIMARY} />
                <Text style={styles.cardInfoTitle}>Thêm thẻ mới</Text>
              </View>
              <Text style={styles.cardInfoText}>
                Bạn chưa có thẻ được lưu. Vui lòng nhập thông tin thẻ để thêm vào hệ thống.
              </Text>
            </View>
          )}
          
          <Text style={styles.sectionTitle}>Thông tin thẻ</Text>

          {/* Card Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Số thẻ</Text>
            <TextInput
              style={styles.input}
              placeholder="8976 5467 XX87 0098"
              placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          {/* Card Holder Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tên chủ thẻ</Text>
            <TextInput
              style={styles.input}
              placeholder="Curtis Weaver"
              placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
              value={cardHolder}
              onChangeText={setCardHolder}
              autoCapitalize="words"
            />
          </View>

          {/* Expiry Date and CVV Row */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Ngày hết hạn</Text>
              <TextInput
                style={styles.input}
                placeholder="12/26"
                placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
                value={expiryDate}
                onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="..."
                placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
                value={cvv}
                onChangeText={(text) => setCvv(text.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity 
          style={[
            styles.addCardButton,
            (!cardNumber || !cardHolder || !expiryDate || !cvv || bookingMutation.isPending || createCardMutation.isPending) && styles.addCardButtonDisabled
          ]}
          onPress={handleAddCard}
          disabled={!cardNumber || !cardHolder || !expiryDate || !cvv || bookingMutation.isPending || createCardMutation.isPending || !!getCard?.data}>
          {(bookingMutation.isPending || createCardMutation.isPending) ? (
            <ActivityIndicator size="small" color={BOOKING_COLORS.BACKGROUND} />
          ) : (
            <Text style={styles.addCardButtonText}>
              {getCard?.data ? 'Thẻ đã được lưu' : 'Thêm thẻ và thanh toán'}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: BOOKING_COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
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
  addCardButton: {
    width: '100%',
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  addCardButtonDisabled: {
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
  addCardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  cardInfoContainer: {
    backgroundColor: `${BOOKING_COLORS.PRIMARY}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${BOOKING_COLORS.PRIMARY}30`,
  },
  cardInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  cardInfoText: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
});





