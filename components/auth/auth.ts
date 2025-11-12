import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Kiểm tra xem token có hợp lệ không
 * @returns Promise<boolean> - true nếu có token, false nếu không
 */
export const isTokenValid = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token && token.trim().length > 0;
  } catch (error) {
    if (__DEV__) {
      console.warn('Error checking token validity:', error);
    }
    return false;
  }
};

