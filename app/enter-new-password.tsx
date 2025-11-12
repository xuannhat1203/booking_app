import { resetPassword } from '@/apis/authApi';
import { AuthButton } from '@/components/auth/button';
import { AuthInput } from '@/components/auth/input';
import { AUTH_COLORS } from '@/constants/auth';
import { useToast } from '@/hooks/use-toast';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function EnterNewPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, showWarning, ToastComponent } = useToast();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const getStoredData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        const storedOtp = await AsyncStorage.getItem('otpCode'); // dùng cùng key với màn OTP
        if (storedEmail) setEmail(storedEmail);
        if (storedOtp) setOtpCode(storedOtp);
      } catch (error) {
        if (__DEV__) console.error('Error retrieving data from storage:', error);
      }
    };
    getStoredData();
  }, []);
  const changePassword = useMutation({
    mutationFn: ({ email, newPassword, otp }: { email: string; newPassword: string; otp: string }) =>
      resetPassword(email, newPassword, otp),
    onSuccess: () => {
      setLoading(false);
      showSuccess('Đặt lại mật khẩu thành công!');
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      setLoading(false);
      showError(error?.message || 'Không thể đặt lại mật khẩu');
    },
  });

  const handleSave = (): void => {
    if (password.length < 6) {
      showWarning('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      showError('Mật khẩu không khớp');
      return;
    }

    if (!email || !otpCode) {
      showError('Thiếu email hoặc mã OTP, vui lòng thử lại');
      return;
    }

    setLoading(true);
    changePassword.mutate({ email, newPassword: password, otp: otpCode });
  };

  const handleBackToHome = (): void => {
    setShowSuccessModal(false);
    router.replace('/login');
  };

  const isFormValid = password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword;

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.BACKGROUND} />
        {ToastComponent}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={AUTH_COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>Nhập mật khẩu mới</Text>
            <Text style={styles.subtitle}>Vui lòng nhập mật khẩu mới của bạn</Text>

            <View style={styles.illustration}>
              <View style={styles.illustrationPlaceholder}>
                <Ionicons name="key-outline" size={80} color={AUTH_COLORS.PRIMARY} />
                <Ionicons
                  name="shield-checkmark-outline"
                  size={40}
                  color={AUTH_COLORS.SUCCESS}
                  style={styles.shieldIcon}
                />
              </View>
            </View>

            <AuthInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <AuthInput
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <AuthButton
              title="Lưu"
              onPress={handleSave}
              disabled={!isFormValid || loading}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ✅ Modal khi reset thành công */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleBackToHome}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIllustration}>
              <View style={styles.successIllustrationPlaceholder}>
                <Ionicons name="checkmark-circle" size={100} color={AUTH_COLORS.SUCCESS} />
                <Ionicons
                  name="phone-portrait-outline"
                  size={60}
                  color={AUTH_COLORS.PRIMARY}
                  style={styles.phoneIcon}
                />
              </View>
            </View>

            <Text style={styles.successTitle}>Cập nhật mật khẩu thành công</Text>
            <Text style={styles.successSubtitle}>
              Mật khẩu của bạn đã được cập nhật thành công
            </Text>

            <AuthButton title="Về trang chủ" onPress={handleBackToHome} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AUTH_COLORS.BACKGROUND },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backButton: { padding: 8 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  content: { paddingHorizontal: 24 },
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
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  illustration: { alignItems: 'center', marginBottom: 40, minHeight: 200 },
  illustrationPlaceholder: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  shieldIcon: { position: 'absolute', top: -10, right: -10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: AUTH_COLORS.BACKGROUND,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  successIllustration: { marginBottom: 24 },
  successIllustrationPlaceholder: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  phoneIcon: { position: 'absolute', bottom: -10, right: -10 },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: AUTH_COLORS.TEXT_SECONDARY,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
});
