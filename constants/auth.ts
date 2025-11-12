export const AUTH_COLORS = {
  PRIMARY: '#6C7CE7',
  TEXT_PRIMARY: '#1A1A1A',
  TEXT_SECONDARY: '#6B7280',
  BACKGROUND: '#FFFFFF',
  INPUT_BACKGROUND: '#F9FAFB',
  INPUT_BORDER: '#E5E7EB',
  INPUT_BORDER_FOCUS: '#6C7CE7',
  BUTTON_DISABLED: '#E5E7EB',
  BUTTON_DISABLED_TEXT: '#9CA3AF',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  SOCIAL_BUTTON_BG: '#F3F4F6',
} as const;

export const AUTH_STORAGE_KEYS = {
  USER_TOKEN: '@user_token',
  USER_DATA: '@user_data',
} as const;

export interface GenderOption {
  label: string;
  value: 'male' | 'female';
}

export const GENDER_OPTIONS: GenderOption[] = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
] as const;
