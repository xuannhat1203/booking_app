import { filterRooms } from '@/apis/roomApi';
import { HotelCard } from '@/components/booking/hotel-card';
import { BOOKING_COLORS } from '@/constants/booking';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onApply?: () => void;
  onClearAll?: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  title,
  children,
  onApply,
  onClearAll,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>{children}</ScrollView>
          {(onApply || onClearAll) && (
            <View style={styles.modalFooter}>
              {onClearAll && (
                <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
                  <Text style={styles.clearButtonText}>Xóa tất cả</Text>
                </TouchableOpacity>
              )}
              {onApply && (
                <TouchableOpacity style={styles.applyButton} onPress={onApply}>
                  <Text style={styles.applyButtonText}>Áp dụng</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function FilterScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sortModalVisible, setSortModalVisible] = useState<boolean>(false);
  const [localityModalVisible, setLocalityModalVisible] = useState<boolean>(false);
  const [priceModalVisible, setPriceModalVisible] = useState<boolean>(false);
  const [selectedSort, setSelectedSort] = useState<string>('rating');
  const [selectedLocalities, setSelectedLocalities] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [listRoom, setListRoom] = useState<any[]>([]); 
  
  const sortOptions = [
    { id: 'rating', label: 'Đánh giá khách hàng', icon: 'star-outline' },
    { id: 'price-low', label: 'Giá - thấp đến cao', icon: 'arrow-up-outline' },
    { id: 'price-high', label: 'Giá - cao đến thấp', icon: 'arrow-down-outline' },
  ];

  const formatVND = (amount: number): string => {
    return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
  };

  const priceRanges = [
    { min: 100000, max: 500000 },
    { min: 500000, max: 1000000 },
    { min: 1000000, max: 2500000 },
  ];

  const mapSortByToApiFormat = (sortId: string): string => {
    switch (sortId) {
      case 'rating':
        return 'rating_desc';
      case 'price-low':
        return 'price_asc';
      case 'price-high':
        return 'price_desc';
      default:
        return 'rating_desc';
    }
  };
  
const { data:roomsData, isLoading } = useQuery({
  queryKey: ['filterRooms', selectedSort, minPrice, maxPrice, selectedLocalities],
  queryFn: () => filterRooms(
    mapSortByToApiFormat(selectedSort), 
    minPrice, 
    maxPrice, 
    selectedLocalities || undefined
  ),
  enabled: true,
});
  useEffect(() => {
    if (roomsData && Array.isArray(roomsData)) {
      setListRoom(roomsData);
    } else if (roomsData === undefined || roomsData === null) {
      // Chưa có dữ liệu, giữ nguyên listRoom rỗng
      setListRoom([]);
    } else {
      setListRoom([]);
    }
  }, [roomsData]);

  const handlePriceRangeSelect = (range: { min: number; max: number } | null): void => {
    if (!range) {
      setSelectedPriceRange('');
      setMinPrice(undefined);
      setMaxPrice(undefined);
      setPriceModalVisible(false);
      return;
    }
    setMinPrice(range.min);
    setMaxPrice(range.max);
    setSelectedPriceRange(`${formatVND(range.min)} - ${formatVND(range.max)}`);
    setPriceModalVisible(false);
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BOOKING_COLORS.BACKGROUND} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mumbai</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setSortModalVisible(true)}>
          <Ionicons name="swap-vertical-outline" size={16} color={BOOKING_COLORS.PRIMARY} />
          <Text style={styles.filterButtonText}>Sắp xếp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setPriceModalVisible(true)}>
          <Text style={styles.filterButtonText}>Giá</Text>
          <Ionicons name="chevron-down-outline" size={16} color={BOOKING_COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Room List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.hotelsList}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : listRoom && Array.isArray(listRoom) && listRoom.length > 0 ? (
            listRoom.map((room: any) => {
              return (
                <HotelCard
                  key={room.id}
                  hotel={room}
                  variant="vertical"
                  onPress={() => router.push(`/hotel-detail/${room.hotelId || room.id}`)}
                />
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy phòng nào</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sort Modal */}
      <FilterModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        title="Sắp xếp theo">
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionItem}
            onPress={() => {
              setSelectedSort(option.id);
              setSortModalVisible(false);
            }}>
            <Ionicons
              name={option.icon as any}
              size={20}
              color={selectedSort === option.id ? BOOKING_COLORS.PRIMARY : BOOKING_COLORS.TEXT_SECONDARY}
            />
            <Text
              style={[
                styles.optionText,
                selectedSort === option.id && styles.optionTextSelected,
              ]}>
              {option.label}
            </Text>
            {selectedSort === option.id && (
              <Ionicons name="checkmark" size={20} color={BOOKING_COLORS.PRIMARY} />
            )}
          </TouchableOpacity>
        ))}
      </FilterModal>
      {/* Price Modal */}
      <FilterModal
        visible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        title="Giá"
        onApply={() => setPriceModalVisible(false)}
        onClearAll={() => {
          setSelectedPriceRange('');
          setMinPrice(undefined);
          setMaxPrice(undefined);
        }}>
        <TouchableOpacity
          style={styles.radioItem}
          onPress={() => handlePriceRangeSelect(null)}>
          <View style={styles.radioButton}>
            {selectedPriceRange === '' && <View style={styles.radioButtonInner} />}
          </View>
          <Text style={[styles.radioText, selectedPriceRange === '' && styles.radioTextSelected]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        {priceRanges.map((range, index) => {
          const rangeText = `${formatVND(range.min)} - ${formatVND(range.max)}`;
          const isSelected = selectedPriceRange === rangeText;
          return (
            <TouchableOpacity
              key={`${range.min}-${range.max}-${index}`}
              style={styles.radioItem}
              onPress={() => handlePriceRangeSelect(range)}>
              <View style={styles.radioButton}>
                {isSelected && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={[styles.radioText, isSelected && styles.radioTextSelected]}>
                {rangeText}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.priceRangeSection}>
          <Text style={styles.priceRangeTitle}>Khoảng giá</Text>
          <View style={styles.priceRangeContainer}>
            <Text style={styles.priceRangeValue}>{formatVND(100000)} - {formatVND(2500000)}</Text>
            <View style={styles.priceSliderPlaceholder}>
              <Text style={styles.priceSliderText}>Thanh trượt giá</Text>
            </View>
          </View>
        </View>
      </FilterModal>
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: BOOKING_COLORS.PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  hotelsList: {
    padding: 16,
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BOOKING_COLORS.BORDER,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.BACKGROUND,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BOOKING_COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: BOOKING_COLORS.PRIMARY,
    borderColor: BOOKING_COLORS.PRIMARY,
  },
  checkboxText: {
    flex: 1,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  checkboxTextSelected: {
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  showMore: {
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BOOKING_COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BOOKING_COLORS.PRIMARY,
  },
  radioText: {
    flex: 1,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  radioTextSelected: {
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  priceRangeSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: BOOKING_COLORS.BORDER,
  },
  priceRangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  priceRangeContainer: {
    gap: 12,
  },
  priceRangeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.PRIMARY,
  },
  priceSliderPlaceholder: {
    height: 60,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  priceSliderText: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
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

