import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS } from '@/constants/auth';

interface InputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  editable?: boolean;
  onPress?: () => void;
}

export const AuthInput: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  editable = true,
  onPress,
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(!secureTextEntry);

  const handlePasswordToggle = (): void => {
    if (onRightIconPress) {
      onRightIconPress();
    } else {
      setShowPassword(!showPassword);
    }
  };

  const inputStyle = [
    styles.input,
    isFocused && styles.inputFocused,
    error && styles.inputError,
    !editable && styles.inputDisabled,
  ];

  const InputComponent = onPress ? (
    <TouchableOpacity
      style={inputStyle}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.inputContent}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={AUTH_COLORS.TEXT_SECONDARY}
            style={styles.leftIcon}
          />
        )}
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={20}
            color={AUTH_COLORS.TEXT_SECONDARY}
            style={styles.rightIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  ) : (
    <View style={inputStyle}>
      {leftIcon && (
        <Ionicons
          name={leftIcon}
          size={20}
          color={isFocused ? AUTH_COLORS.INPUT_BORDER_FOCUS : AUTH_COLORS.TEXT_SECONDARY}
          style={styles.leftIcon}
        />
      )}
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={AUTH_COLORS.TEXT_SECONDARY}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        editable={editable}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={handlePasswordToggle} style={styles.rightIcon}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={AUTH_COLORS.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      )}
      {rightIcon && !secureTextEntry && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
          <Ionicons name={rightIcon} size={20} color={AUTH_COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {InputComponent}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: AUTH_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.INPUT_BACKGROUND,
    borderWidth: 1,
    borderColor: AUTH_COLORS.INPUT_BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.select({
      ios: 14,
      android: 12,
    }),
    minHeight: 52,
  },
  inputFocused: {
    borderColor: AUTH_COLORS.INPUT_BORDER_FOCUS,
  },
  inputError: {
    borderColor: AUTH_COLORS.ERROR,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: AUTH_COLORS.TEXT_PRIMARY,
    padding: 0,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: AUTH_COLORS.TEXT_PRIMARY,
  },
  placeholderText: {
    color: AUTH_COLORS.TEXT_SECONDARY,
  },
  rightIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: AUTH_COLORS.ERROR,
    marginTop: 4,
    marginLeft: 4,
  },
});
