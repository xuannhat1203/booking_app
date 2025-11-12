import { sendRequestCode, verifyCode } from '@/apis/authApi';
import { AuthButton } from '@/components/auth/button';
import { AUTH_COLORS } from '@/constants/auth';
import { useToast } from '@/hooks/use-toast';
import { sanitizeErrorMessage } from '@/utils/errorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
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

const OTP_LENGTH = 6;
const OTP_EXPIRE_TIME = 60; 

export default function EnterOTPScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, showInfo, ToastComponent } = useToast();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timeLeft, setTimeLeft] = useState<number>(OTP_EXPIRE_TIME);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [email, setEmail] = useState<string>('');
  useEffect(() => {
    const getEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        if (storedEmail) setEmail(storedEmail);
      } catch (error) {
        if (__DEV__) console.error('Error retrieving email from storage:', error);
      }
    };
    getEmail();
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const verifyOTPMutation = useMutation({
    mutationFn: ({ emailToVerify, code }: { emailToVerify: string; code: string }) =>
      verifyCode(emailToVerify, code),
    onSuccess: async () => {
      showSuccess('Xác thực OTP thành công!');
      await AsyncStorage.setItem('otpCode', otp.join(''));
      setTimeout(() => {
        router.push('/enter-new-password');
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = sanitizeErrorMessage(error);
      showError(errorMessage);
    },
  });
  const resendOTPMutation = useMutation({
    mutationFn: (emailToSend: string) => sendRequestCode(emailToSend),
    onSuccess: () => {
      showSuccess('Mã OTP mới đã được gửi lại!');
      setTimeLeft(OTP_EXPIRE_TIME);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    },
    onError: (error: any) => {
      const errorMessage = sanitizeErrorMessage(error);
      showError(errorMessage);
    },
  });
  const handleOtpChange = (value: string, index: number): void => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number): void => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handleVerify = (): void => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      showError('Vui lòng nhập đầy đủ mã OTP');
      return;
    }

    if (!email) {
      showError('Không tìm thấy email. Vui lòng thử lại.');
      return;
    }

    verifyOTPMutation.mutate({ emailToVerify: email, code: otpCode });
  };
  const handleResend = (): void => {
    if (timeLeft > 0) {
      showInfo(`Vui lòng đợi ${timeLeft} giây trước khi gửi lại`);
      return;
    }

    if (!email) {
      showError('Không tìm thấy email. Vui lòng thử lại.');
      return;
    }

    resendOTPMutation.mutate(email);
  };
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}s`;
  };

  const isOtpComplete = otp.every((digit) => digit !== '');
  useEffect(() => {
    return () => {
      inputRefs.current = [];
    };
  }, []);

  return (
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
          <Text style={styles.title}>Enter OTP Code</Text>
          <Text style={styles.subtitle}>
            OTP code has been sent to email: {email || 'Loading...'}
          </Text>

          <View style={styles.illustration}>
            <View style={styles.illustrationPlaceholder}>
              <Ionicons name="laptop-outline" size={80} color={AUTH_COLORS.PRIMARY} />
              <Ionicons
                name="shield-checkmark-outline"
                size={40}
                color={AUTH_COLORS.SUCCESS}
                style={styles.shieldIcon}
              />
            </View>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleResend}
            disabled={timeLeft > 0}
            style={styles.resendContainer}>
            <Text style={[styles.resendText, timeLeft > 0 && styles.resendTextDisabled]}>
              Resend code {formatTime(timeLeft)}
            </Text>
          </TouchableOpacity>

          <AuthButton
            title="Verify"
            onPress={handleVerify}
            disabled={!isOtpComplete || verifyOTPMutation.isPending}
            loading={verifyOTPMutation.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
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
    fontSize: 15,
    color: AUTH_COLORS.TEXT_SECONDARY,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 160,
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shieldIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 52,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AUTH_COLORS.INPUT_BORDER,
    backgroundColor: AUTH_COLORS.INPUT_BACKGROUND,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: AUTH_COLORS.TEXT_PRIMARY,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  otpInputFilled: {
    borderColor: AUTH_COLORS.PRIMARY,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resendContainer: {
    alignSelf: 'center',
    marginBottom: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 15,
    color: AUTH_COLORS.PRIMARY,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: AUTH_COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
});
