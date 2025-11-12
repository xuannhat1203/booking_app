import React, { useState, useCallback, useRef } from 'react';
import { Toast, ToastType } from '@/components/ui/toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info'): void => {
    // Hide previous toast before showing new one
    setToast((prev) => ({ ...prev, visible: false }));
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Show new toast after a brief delay to ensure previous one is hidden
    setTimeout(() => {
      setToast({
        visible: true,
        message,
        type,
      });
    }, 100);
  }, []);

  const hideToast = useCallback((): void => {
    setToast((prev) => ({ ...prev, visible: false }));
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showSuccess = useCallback((message: string): void => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string): void => {
    showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message: string): void => {
    showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message: string): void => {
    showToast(message, 'info');
  }, [showToast]);

  const ToastComponent = (
    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  );

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastComponent,
  };
};
