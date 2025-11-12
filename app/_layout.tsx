import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isTokenValid } from '@/components/auth/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeAxiosToken } from '@/utils/axiosInstance';
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';

export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient();

function NavigationContent() {
  const colorScheme = useColorScheme();
  
  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="enter-otp" />
          <Stack.Screen name="enter-new-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="filter" />
          <Stack.Screen name="search" />
          <Stack.Screen name="hotel-detail/[id]" />
          <Stack.Screen name="select-date" />
          <Stack.Screen name="select-guest" />
          <Stack.Screen name="confirm-pay" />
          <Stack.Screen name="payment-success" />
          <Stack.Screen name="add-card" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="terms-conditions" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    initializeAxiosToken().catch((error) => {
      if (__DEV__) {
        console.warn('Lỗi khi khởi tạo mã thông báo axios:', error);
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContent />
    </QueryClientProvider>
  );
}
