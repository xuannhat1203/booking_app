import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { City } from '@/constants/booking';
import { BOOKING_COLORS } from '@/constants/booking';

interface CityButtonProps {
  city: City;
  onPress?: () => void;
}

export const CityButton: React.FC<CityButtonProps> = ({ city, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <ExpoImage
          source={{ uri: city.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </View>
      <Text style={styles.cityName}>{city.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 20,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: BOOKING_COLORS.PRIMARY,
    shadowColor: BOOKING_COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    letterSpacing: -0.2,
  },
});
