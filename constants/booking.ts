import { RoomType } from "./RoomType";

export const BOOKING_COLORS = {
  PRIMARY: '#6C7CE7',
  BACKGROUND: '#FFFFFF',
  TEXT_PRIMARY: '#1A1A1A',
  TEXT_SECONDARY: '#6B7280',
  BORDER: '#E5E7EB',
  CARD_BACKGROUND: '#F9FAFB',
  RATING: '#FFB800',
  PRICE: '#6C7CE7',
  HEART: '#EF4444',
} as const;

export interface Hotel {
  id: number;
  roomNumber: string;
  type: RoomType;
  pricePerNight: number;
  available: boolean;
  capacity: number;
  hotelId: number;
  hotelName: string;
  imageUrl: string;
  rating: number;
  address: string;
}
export interface City {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  type: string;
  pricePerNight: number;
  available: boolean;
  capacity: number;
  hotelId: string;
  hotelName: string;
  imageUrl: string;
}

export const CITIES: City[] = [
  { id: '1', name: 'Mumbai', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200' },
  { id: '2', name: 'Goa', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200' },
  { id: '3', name: 'Chennai', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200' },
  { id: '4', name: 'Jaipur', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200' },
  { id: '5', name: 'Pune', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200' },
] as const;

