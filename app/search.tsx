import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HotelCard } from '@/components/booking/hotel-card';
import { BOOKING_COLORS, Hotel, Room } from '@/constants/booking';
import { RoomType } from '@/constants/RoomType';
import { getAllRooms } from '@/apis/roomApi';
import { useQuery } from '@tanstack/react-query';

// Helper function để convert string type sang RoomType enum
const convertStringToRoomType = (typeString: string): RoomType => {
  const upperType = typeString.toUpperCase();
  switch (upperType) {
    case 'SINGLE':
      return RoomType.SINGLE;
    case 'DOUBLE':
      return RoomType.DOUBLE;
    case 'SUITE':
      return RoomType.SUITE;
    case 'DELUXE':
      return RoomType.DELUXE;
    case 'FAMILY':
      return RoomType.FAMILY;
    default:
      return RoomType.DOUBLE; // Default fallback
  }
};

// Helper function để map Room sang Hotel format (theo interface Hotel trong constants/booking.ts)
const mapRoomToHotel = (room: Room, apiRoomData?: any): Hotel => {
  // Lấy address từ API response nếu có, hoặc fallback về hotelName
  const address = apiRoomData?.address || 
                  apiRoomData?.city || 
                  (apiRoomData?.city && apiRoomData?.country 
                    ? `${apiRoomData.city}, ${apiRoomData.country}` 
                    : room.hotelName || 'Unknown location');
  
  // Lấy rating từ API response nếu có
  const rating = apiRoomData?.rating 
    ? Number(apiRoomData.rating) 
    : apiRoomData?.hotelRating 
      ? Number(apiRoomData.hotelRating) 
      : 0;

  return {
    id: Number(room.id) || 0,
    roomNumber: room.roomNumber || '',
    type: convertStringToRoomType(room.type || 'DOUBLE'),
    pricePerNight: room.pricePerNight || 0,
    available: room.available ?? true,
    capacity: room.capacity || 0,
    hotelId: Number(room.hotelId) || 0,
    hotelName: room.hotelName || 'Unknown Hotel',
    imageUrl: room.imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
    rating: rating,
    address: address,
  };
};

export default function SearchScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState<string>('');
  
  // Fetch rooms từ API
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['search-rooms'],
    queryFn: getAllRooms,
  });

  // Map rooms sang Hotel format
  const hotels: Hotel[] = roomsData && Array.isArray(roomsData)
    ? roomsData.map((room: any) => {
        const roomData: Room = {
          id: String(room.id || ''),
          roomNumber: room.roomNumber || '',
          type: room.type || '',
          pricePerNight: room.pricePerNight
            ? (typeof room.pricePerNight === 'number'
                ? room.pricePerNight
                : parseFloat(String(room.pricePerNight)))
            : 0,
          available: Boolean(room.available ?? true),
          capacity: room.capacity || 0,
          hotelId: String(room.hotelId || ''),
          hotelName: room.hotelName || '',
          imageUrl: room.imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
        };
        // Truyền cả room data từ API để lấy thêm thông tin như address, rating
        return mapRoomToHotel(roomData, room);
      })
    : [];

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const toggleFavorite = (hotelId: number): void => {
    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hotelId)) {
        newSet.delete(hotelId);
      } else {
        newSet.add(hotelId);
      }
      return newSet;
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BOOKING_COLORS.BACKGROUND} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
        </View>

        {/* Location Option */}
        <TouchableOpacity style={styles.locationOption}>
          <View style={styles.locationIconContainer}>
            <Ionicons name="locate-outline" size={24} color={BOOKING_COLORS.PRIMARY} />
          </View>
          <Text style={styles.locationText}>or use my current location</Text>
        </TouchableOpacity>

        {/* Recent Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Search</Text>
          {/* Recent search items would go here */}
        </View>

        {/* Search Results / Nearby Rooms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchText ? 'Kết quả tìm kiếm' : 'Phòng gần bạn'}
          </Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : hotels.length > 0 ? (
            <View style={styles.hotelsList}>
              {hotels
                .filter((hotel) =>
                  searchText
                    ? hotel.hotelName.toLowerCase().includes(searchText.toLowerCase()) ||
                      hotel.address.toLowerCase().includes(searchText.toLowerCase()) ||
                      hotel.roomNumber.toLowerCase().includes(searchText.toLowerCase())
                    : true
                )
                .map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    variant="vertical"
                    onPress={() => {
                      router.push(`/hotel-detail/${hotel.hotelId}`);
                    }}
                    onFavoritePress={() => toggleFavorite(hotel.id)}
                  />
                ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchText ? 'Không tìm thấy phòng nào' : 'Không có phòng nào'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BOOKING_COLORS.PRIMARY}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  hotelsList: {
    gap: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
});
