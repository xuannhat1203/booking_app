import { BOOKING_COLORS } from '@/constants/booking';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
}

const MIN_ADULTS = 1;
const MAX_ADULTS = 10;
const MIN_CHILDREN = 0;
const MAX_CHILDREN = 10;
const MIN_INFANTS = 0;
const MAX_INFANTS = 5;

export default function SelectGuestScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
    imageUrl?: string;
  }>();

  const [guests, setGuests] = useState<GuestCounts>({
    adults: 2,
    children: 0,
    infants: 0,
  });

  const updateGuestCount = (
    type: keyof GuestCounts,
    delta: number
  ): void => {
    setGuests((prev) => {
      const newValue = prev[type] + delta;
      const min = type === 'adults' ? MIN_ADULTS : type === 'children' ? MIN_CHILDREN : MIN_INFANTS;
      const max = type === 'adults' ? MAX_ADULTS : type === 'children' ? MAX_CHILDREN : MAX_INFANTS;
      
      if (newValue < min || newValue > max) {
        return prev;
      }
      
      return {
        ...prev,
        [type]: newValue,
      };
    });
  };

  const handleNext = (): void => {
    router.push({
      pathname: '/confirm-pay',
      params: {
        ...params,
        adults: guests.adults.toString(),
        children: guests.children.toString(),
        infants: guests.infants.toString(),
      },
    });
  };

  const GuestCounter = ({
    label,
    description,
    count,
    onDecrease,
    onIncrease,
    min,
    max,
  }: {
    label: string;
    description: string;
    count: number;
    onDecrease: () => void;
    onIncrease: () => void;
    min: number;
    max: number;
  }): React.JSX.Element => (
    <View style={styles.guestRow}>
      <View style={styles.guestInfo}>
        <Text style={styles.guestLabel}>{label}</Text>
        <Text style={styles.guestDescription}>{description}</Text>
      </View>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[styles.counterButton, count <= min && styles.counterButtonDisabled]}
          onPress={onDecrease}
          disabled={count <= min}>
          <Ionicons
            name="remove"
            size={20}
            color={count <= min ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
          />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{count}</Text>
        <TouchableOpacity
          style={[styles.counterButton, count >= max && styles.counterButtonDisabled]}
          onPress={onIncrease}
          disabled={count >= max}>
          <Ionicons
            name="add"
            size={20}
            color={count >= max ? BOOKING_COLORS.TEXT_SECONDARY : BOOKING_COLORS.PRIMARY}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Blurred Background Image */}
      <ExpoImage
        source={{ uri: params.imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400' }}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <View style={styles.blurOverlay} />

      {/* Guest Selection Overlay */}
      <View style={[styles.overlay, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.overlayContent}>
          <Text style={styles.title}>Select Guest</Text>

          <GuestCounter
            label="Adults"
            description="Age 13 or above"
            count={guests.adults}
            onDecrease={() => updateGuestCount('adults', -1)}
            onIncrease={() => updateGuestCount('adults', 1)}
            min={MIN_ADULTS}
            max={MAX_ADULTS}
          />

          <GuestCounter
            label="Children"
            description="Age 2-12"
            count={guests.children}
            onDecrease={() => updateGuestCount('children', -1)}
            onIncrease={() => updateGuestCount('children', 1)}
            min={MIN_CHILDREN}
            max={MAX_CHILDREN}
          />

          <GuestCounter
            label="Infants"
            description="Under 2"
            count={guests.infants}
            onDecrease={() => updateGuestCount('infants', -1)}
            onIncrease={() => updateGuestCount('infants', 1)}
            min={MIN_INFANTS}
            max={MAX_INFANTS}
          />

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  overlayContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  guestInfo: {
    flex: 1,
  },
  guestLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  guestDescription: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  counterButtonDisabled: {
    borderColor: BOOKING_COLORS.BORDER,
    opacity: 0.5,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    minWidth: 30,
    textAlign: 'center',
  },
  nextButton: {
    width: '100%',
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
});

