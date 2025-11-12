export const ONBOARDING_COLORS = {
  PRIMARY: '#6C7CE7',
  TEXT_PRIMARY: '#1A1A1A',
  TEXT_SECONDARY: '#6B7280',
  BACKGROUND: '#FFFFFF',
  PAGINATION_ACTIVE: '#6C7CE7',
  PAGINATION_INACTIVE: '#E5E7EB',
} as const;

export interface OnboardingData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

export const ONBOARDING_DATA: OnboardingData[] = [
  {
    id: 1,
    title: 'Easy way to book hotels with us',
    description: 'It is a long established fact that a reader will be distracted by the readable content.',
    imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
  },
  {
    id: 2,
    title: 'Discover and find your perfect healing place',
    description: 'It is a long established fact that a reader will be distracted by the readable content.',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
  },
  {
    id: 3,
    title: 'Giving the best deal just for you',
    description: 'It is a long established fact that a reader will be distracted by the readable content.',
    imageUrl: 'https://images.unsplash.com/photo-1559314809-2b3d0e48c3d7?w=800',
  },
] as const;

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@onboarding_completed',
} as const;
