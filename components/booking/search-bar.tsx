import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BOOKING_COLORS } from '@/constants/booking';

interface SearchBarProps {
  onPress?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onPress,
  placeholder = 'Search',
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        <Ionicons name="search-outline" size={22} color={BOOKING_COLORS.TEXT_SECONDARY} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </View>
      <TouchableOpacity
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.filterIconContainer}>
        <Ionicons name="options-outline" size={22} color={BOOKING_COLORS.PRIMARY} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderWidth: 1.5,
    borderColor: BOOKING_COLORS.PRIMARY,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: BOOKING_COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  placeholder: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    fontWeight: '400',
  },
  filterIconContainer: {
    padding: 4,
  },
});
