import { login } from '@/apis/authApi';
import { AuthButton } from '@/components/auth/button';
import { AuthInput } from '@/components/auth/input';
import { LogoHeader } from '@/components/auth/logo-header';
import { AUTH_COLORS } from '@/constants/auth';
import { useToast } from '@/hooks/use-toast';
import { setAccessToken } from '@/utils/axiosInstance';
import { sanitizeErrorMessage } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, ToastComponent } = useToast();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Field-level error states
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  React.useEffect(() => {
    const saveEmail = async (): Promise<void> => {
      if (username.trim().length > 0) {
        try {
          await AsyncStorage.setItem('email', username.trim());
        } catch (error) {
        }
      }
    };
    const timer = setTimeout(() => {
      saveEmail();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username]);

  const isFormValid = username.length > 0 && password.length > 0;

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      login(credentials.username, credentials.password),
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
              console.warn('UserId not found in login response:', JSON.stringify(data, null, 2));
            }
          }
          
          showSuccess('Đăng nhập thành công!');
          console.log("accessToken", trimmedToken);
          
          await AsyncStorage.setItem("email", username);
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1000);
        } else {
          showError('Không tìm thấy token. Vui lòng thử lại.');
        }
      } catch (storageError) {
        if (__DEV__) {
          console.error('Error saving token:', storageError);
        }
        showError('Không thể lưu thông tin đăng nhập. Vui lòng thử lại.');
      }
    },
    onError: (error: any) => {
      const errorMessage = sanitizeErrorMessage(error);
      showError(errorMessage);
    },
  });

  const handleLogin = (): void => {
    const newErrors: typeof errors = {};
    let hasError = false;

    // Validate email (bắt buộc phải là email hợp lệ)
    if (!username.trim()) {
      newErrors.username = 'Vui lòng nhập email';
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username.trim())) {
        newErrors.username = 'Email không hợp lệ';
        hasError = true;
      }
    }

    // Validate password
    if (!password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
      hasError = true;
    }

    // Set errors and return if validation fails
    setErrors(newErrors);
    if (hasError) {
      return;
    }

    // Clear all errors before submitting
    setErrors({});

    loginMutation.mutate({ username, password });
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
          <Text style={styles.title}>Đăng nhập ngay!</Text>
          <Text style={styles.subtitle}>Nhập thông tin của bạn bên dưới</Text>

          <AuthInput
            label="Email"
            placeholder="Nhập email"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) {
                setErrors({ ...errors, username: undefined });
              }
            }}
            keyboardType="email-address"
            leftIcon="mail-outline"
            autoCapitalize="none"
            error={errors.username}
          />

          <AuthInput
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors({ ...errors, password: undefined });
              }
            }}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <AuthButton
            title="Đăng nhập"
            onPress={handleLogin}
            disabled={!isFormValid || loginMutation.isPending}
            loading={loginMutation.isPending}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: AUTH_COLORS.PRIMARY,
    fontWeight: '500',
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
});
