import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { AUTH_COLORS } from '@/constants/auth';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}) => {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.button,
    isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
    isDisabled && styles.buttonDisabled,
  ];

  const textStyle = [
    styles.buttonText,
    isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary,
    isDisabled && styles.buttonTextDisabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? AUTH_COLORS.BACKGROUND : AUTH_COLORS.PRIMARY}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: Platform.select({
      ios: 16,
      android: 14,
    }),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  buttonPrimary: {
    backgroundColor: AUTH_COLORS.PRIMARY,
  },
  buttonSecondary: {
    backgroundColor: AUTH_COLORS.SOCIAL_BUTTON_BG,
  },
  buttonDisabled: {
    backgroundColor: AUTH_COLORS.BUTTON_DISABLED,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: AUTH_COLORS.BACKGROUND,
  },
  buttonTextSecondary: {
    color: AUTH_COLORS.TEXT_PRIMARY,
  },
  buttonTextDisabled: {
    color: AUTH_COLORS.BUTTON_DISABLED_TEXT,
  },
});
