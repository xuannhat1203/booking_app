import { register } from '@/apis/authApi';
import { AuthButton } from '@/components/auth/button';
import { AuthInput } from '@/components/auth/input';
import { LogoHeader } from '@/components/auth/logo-header';
import { AUTH_COLORS } from '@/constants/auth';
import { useToast } from '@/hooks/use-toast';
import { setAccessToken } from '@/utils/axiosInstance';
import { sanitizeErrorMessage } from '@/utils/errorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
] as const;

export default function RegisterScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, showWarning, ToastComponent } = useToast();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [datePickerModalVisible, setDatePickerModalVisible] = useState<boolean>(false);

  const registerMutation = useMutation({
    mutationFn: (registerData: {
      fullName: string;
      email: string;
      password: string;
      address: string;
      phone?: string;
      gender: string;
      dateOfBirth: string;
    }) => register(registerData),
    onSuccess: async (data) => {
      try {
        const token = data?.data?.token || data?.data?.accessToken || data?.token;
        if (token) {
          // Trim token để loại bỏ khoảng trắng thừa
          const trimmedToken = token.trim();
          await AsyncStorage.setItem('accessToken', trimmedToken);
          setAccessToken(trimmedToken);
          const refreshToken = data?.data?.refreshToken || data?.refreshToken;
          if (refreshToken) {
            await AsyncStorage.setItem('refreshToken', refreshToken);
          }
          const userId = 
            data?.data?.userId || 
            data?.data?.user?.id || 
            data?.data?.user?.userId ||
            data?.data?.id ||
            data?.userId ||
            data?.user?.id ||
            data?.user?.userId ||
            data?.id;
          
          if (userId) {
            await AsyncStorage.setItem('userId', String(userId));
            if (__DEV__) {
              console.log('UserId saved:', userId);
            }
          } else {
            if (__DEV__) {
              console.warn('UserId not found in register response:', JSON.stringify(data, null, 2));
            }
          }
        }
        await AsyncStorage.setItem('email', email.trim());
        showSuccess('Đăng ký thành công!');
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } catch (storageError) {
        if (__DEV__) {
          console.error('Error saving token:', storageError);
        }
        showError('Không thể lưu thông tin đăng nhập. Vui lòng thử lại.');
      }
    },
    onError: (error: any) => {
      if (__DEV__) {
        console.log('Register error details:', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
          userMessage: error?.userMessage,
        });
      }
      const errorMessage = sanitizeErrorMessage(error);
      showError(errorMessage);
    },
  });

  const formatDateForAPI = (date: Date): string => {
    // Format thành DD-MM-YYYY cho backend Java (theo test Postman thành công)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setDatePickerModalVisible(false);
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate >= today) {
        showWarning('Ngày sinh phải là một ngày trong quá khứ');
        return;
      }
      setDateOfBirth(selectedDate);
    }
  };

  const handleRegister = (): void => {
    if (!fullName.trim()) {
      showWarning('Vui lòng nhập họ tên');
      return;
    }
    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      showWarning('Họ tên phải có từ 2-100 ký tự');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showWarning('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showWarning('Email không hợp lệ');
      return;
    }
    if (!password.trim() || password.length < 6) {
      showWarning('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (!address.trim()) {
      showWarning('Vui lòng nhập địa chỉ');
      return;
    }
    if (address.trim().length < 5 || address.trim().length > 255) {
      showWarning('Địa chỉ phải có từ 5-255 ký tự');
      return;
    }
    if (phone.trim()) {
      const cleanedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        showWarning('Số điện thoại không hợp lệ. Vui lòng nhập 10-15 chữ số');
        return;
      }
    }
    if (!gender) {
      showWarning('Vui lòng chọn giới tính');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateOfBirth >= today) {
      showWarning('Ngày sinh phải là một ngày trong quá khứ');
      return;
    }

    // Format gender theo backend yêu cầu (Nam, Nữ, Khác)
    let formattedGender = gender;
    if (gender === 'MALE') {
      formattedGender = 'Nam';
    } else if (gender === 'FEMALE') {
      formattedGender = 'Nữ';
    } else if (gender === 'OTHER') {
      formattedGender = 'Khác';
    }

    registerMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      password: password.trim(),
      address: address.trim(),
      phone: phone.trim() || undefined,
      gender: formattedGender,
      dateOfBirth: formatDateForAPI(dateOfBirth),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.BACKGROUND} />
      {ToastComponent}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <LogoHeader />

        <View style={styles.content}>
          <Text style={styles.title}>Đăng ký ngay!</Text>
          <Text style={styles.subtitle}>Nhập thông tin của bạn bên dưới</Text>

          <AuthInput
            label="Họ tên *"
            placeholder="Nhập họ tên (2-100 ký tự)"
            value={fullName}
            onChangeText={setFullName}
            keyboardType="default"
            leftIcon="person-outline"
          />

          <AuthInput
            label="Địa chỉ email *"
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon="mail-outline"
          />

          <AuthInput
            label="Mật khẩu *"
            placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
          />

          <AuthInput
            label="Địa chỉ *"
            placeholder="Nhập địa chỉ (5-255 ký tự)"
            value={address}
            onChangeText={setAddress}
            keyboardType="default"
            leftIcon="location-outline"
          />

          <AuthInput
            label="Số điện thoại"
            placeholder="Nhập số điện thoại (tùy chọn)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          {/* Gender Selection */}
          <View style={styles.genderContainer}>
            <Text style={styles.label}>Giới tính *</Text>
            <View style={styles.genderOptions}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    gender === option.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => setGender(option.value)}>
                  <View
                    style={[
                      styles.radioButton,
                      gender === option.value && styles.radioButtonSelected,
                    ]}>
                    {gender === option.value && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text
                    style={[
                      styles.genderText,
                      gender === option.value && styles.genderTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.dateContainer}>
            <Text style={styles.label}>Ngày sinh *</Text>
            <AuthInput
              placeholder="Chọn ngày sinh"
              value={formatDateForDisplay(dateOfBirth)}
              onChangeText={() => {}}
              editable={false}
              leftIcon="calendar-outline"
              onPress={() => {
                if (Platform.OS === 'ios') {
                  setDatePickerModalVisible(true);
                  setShowDatePicker(true);
                } else {
                  setShowDatePicker(true);
                }
              }}
            />
          </View>

          <AuthButton
            title="Đăng ký"
            onPress={handleRegister}
            loading={registerMutation.isPending}
            disabled={registerMutation.isPending}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Android Date Picker - không dùng modal */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display="default"
          maximumDate={new Date(Date.now() - 24 * 60 * 60 * 1000)} // Yesterday
          onChange={handleDateChange}
        />
      )}

      {/* iOS Date Picker Modal */}
      <Modal
        visible={datePickerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setDatePickerModalVisible(false);
          setShowDatePicker(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngày sinh</Text>
              <TouchableOpacity
                onPress={() => {
                  setDatePickerModalVisible(false);
                  setShowDatePicker(false);
                }}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={AUTH_COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={dateOfBirth}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date(Date.now() - 24 * 60 * 60 * 1000)} // Yesterday
                  onChange={handleDateChange}
                  locale="vi-VN"
                />
                <TouchableOpacity
                  style={styles.datePickerDoneButton}
                  onPress={() => {
                    setDatePickerModalVisible(false);
                    setShowDatePicker(false);
                  }}>
                  <Text style={styles.datePickerDoneButtonText}>Xong</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AUTH_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: AUTH_COLORS.TEXT_SECONDARY,
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: AUTH_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: AUTH_COLORS.INPUT_BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AUTH_COLORS.INPUT_BORDER,
  },
  genderOptionSelected: {
    borderColor: AUTH_COLORS.PRIMARY,
    backgroundColor: `${AUTH_COLORS.PRIMARY}10`,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AUTH_COLORS.INPUT_BORDER,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: AUTH_COLORS.PRIMARY,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AUTH_COLORS.PRIMARY,
  },
  genderText: {
    fontSize: 16,
    color: AUTH_COLORS.TEXT_PRIMARY,
  },
  genderTextSelected: {
    color: AUTH_COLORS.PRIMARY,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: AUTH_COLORS.TEXT_SECONDARY,
  },
  footerLink: {
    fontSize: 14,
    color: AUTH_COLORS.PRIMARY,
    fontWeight: '600',
  },
  dateContainer: {
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AUTH_COLORS.BACKGROUND,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AUTH_COLORS.INPUT_BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.TEXT_PRIMARY,
  },
  modalCloseButton: {
    padding: 4,
  },
  datePickerContainer: {
    padding: 20,
  },
  datePickerDoneButton: {
    marginTop: 20,
    backgroundColor: AUTH_COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerDoneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.BACKGROUND,
  },
});
