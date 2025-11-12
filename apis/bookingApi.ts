import axiosInstance, { setAccessToken } from '@/utils/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CreateBookingData {
  userId: number;
  roomId: number;
  checkInDate: string; // Format: "DD-MM-YYYY HH:mm"
  checkOutDate: string; // Format: "DD-MM-YYYY HH:mm"
  adults: number;
  children: number;
  rooms: number;
  typePayment?: boolean; // true = thanh toán sau (tiền mặt), false = thanh toán bằng tài khoản (thẻ)
  cardId?: number; // ID của thẻ được chọn khi thanh toán bằng thẻ
}

export interface BookingResponse {
  id?: number;
  userId?: number;
  roomId?: number;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  status?: string;
  [key: string]: any;
}

/**
 * Tạo booking mới
 * @param bookingData - Dữ liệu đặt phòng
 * @returns Promise<BookingResponse>
 */
export const createBooking = async (bookingData: CreateBookingData): Promise<BookingResponse> => {
  try {
    // Đảm bảo token được load từ AsyncStorage trước khi gọi API
    const token = await AsyncStorage.getItem('accessToken');
    axiosInstance.interceptors.request.use(async (config) => {
      if (__DEV__) {
        console.log('👉 Sending request:', {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers,
        });
        if (config.data && typeof config.data === 'object') {
          console.log('👉 Request body:', JSON.stringify(config.data, null, 2));
          console.log('👉 Request cardId:', config.data.cardId);
          console.log('👉 Request typePayment:', config.data.typePayment);
        }
      }
      return config;
    });
    if (token) {
      setAccessToken(token);
      if (__DEV__) {
        console.log('Token loaded from AsyncStorage for booking API');
      }
    } else {
      if (__DEV__) {
        console.warn('No access token found in AsyncStorage');
      }
    }

    if (__DEV__) {
      console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
      console.log('Booking data cardId:', bookingData.cardId);
      console.log('Booking data typePayment:', bookingData.typePayment);
    }

    const response = await axiosInstance.post('/bookings', bookingData);

    if (__DEV__) {
      console.log('Booking API response:', JSON.stringify(response?.data, null, 2));
    }

    if (__DEV__) {
      console.log('Booking created successfully:', response?.data);
    }

    return response?.data?.data || response?.data || {};
  } catch (error: any) {
    if (__DEV__) {
      console.error('API createBooking error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
    }
    throw error;
  }
};

export interface ApiBookingItem {
  id: number;
  roomId: number;
  hotelName: string;
  roomNumber: string;
  roomType: string;
  imageUrl: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  rooms: number;
  status: string;
  address: string;
  total_price: number;
}

export interface GetBookingResponse {
  data: {
    completed: ApiBookingItem[];
    other: ApiBookingItem[];
    totalCompleted: number;
    totalOther: number;
  };
  success: boolean;
}

/**
 * Lấy danh sách booking đã được nhóm theo trạng thái
 * @param userId - ID của user
 * @returns Promise<GetBookingResponse>
 */
export const getBooking = async (userId: number | string): Promise<GetBookingResponse> => {
  try {
    // Thử các endpoint có thể có
    const endpoints = [
      `/bookings/user/${userId}/grouped`,
      `/users/${userId}/bookings/grouped`,
      `/user/${userId}/grouped`,
      `/bookings/grouped?userId=${userId}`,
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        if (__DEV__) {
          console.log(`Trying endpoint: ${endpoint}`);
        }
        const response = await axiosInstance.get<GetBookingResponse>(endpoint);
        if (response.data && response.data.success !== false) {
          if (__DEV__) {
            console.log(`Success with endpoint: ${endpoint}`, response.data);
          }
          return response.data;
        }
      } catch (err: any) {
        lastError = err;
        if (__DEV__) {
          console.log(`Failed endpoint: ${endpoint}`, err?.response?.status);
        }
        // Nếu không phải 404, throw ngay
        if (err?.response?.status !== 404) {
          throw err;
        }
      }
    }

    // Nếu tất cả đều fail, throw error cuối cùng
    if (lastError) {
      if (__DEV__) {
        console.error('All booking endpoints failed:', lastError);
      }
      throw lastError;
    }

    // Fallback: trả về empty response
    return {
      success: true,
      data: {
        completed: [],
        other: [],
        totalCompleted: 0,
        totalOther: 0,
      },
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('API getBooking error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        userId,
      });
    }
    // Throw error để React Query xử lý
    throw error;
  }
};