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

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export default function SelectDateScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ roomId: string; imageUrl?: string }>();
  
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange>({ start: null, end: null });

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedRange.start || !selectedRange.end) return false;
    const dateTime = date.getTime();
    const startTime = selectedRange.start.getTime();
    const endTime = selectedRange.end.getTime();
    return dateTime > startTime && dateTime < endTime;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedRange.start && !selectedRange.end) return false;
    if (selectedRange.start && isSameDay(date, selectedRange.start)) return true;
    if (selectedRange.end && isSameDay(date, selectedRange.end)) return true;
    return false;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDatePress = (day: number): void => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (isPastDate(date)) return;

    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null });
    } else if (selectedRange.start && !selectedRange.end) {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: date });
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next'): void => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = (): React.JSX.Element[] => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: React.JSX.Element[] = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const inRange = isDateInRange(date);
      const selected = isDateSelected(date);
      const past = isPastDate(date);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            inRange && styles.calendarDayInRange,
            selected && styles.calendarDaySelected,
            past && styles.calendarDayDisabled,
          ]}
          onPress={() => handleDatePress(day)}
          disabled={past}>
          <Text
            style={[
              styles.calendarDayText,
              selected && styles.calendarDayTextSelected,
              past && styles.calendarDayTextDisabled,
            ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const handleNext = (): void => {
    if (selectedRange.start && selectedRange.end) {
      const checkIn = selectedRange.start.toISOString().split('T')[0];
      const checkOut = selectedRange.end.toISOString().split('T')[0];
      router.push({
        pathname: '/select-guest',
        params: {
          ...params,
          checkInDate: checkIn,
          checkOutDate: checkOut,
        },
      });
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const monthName = MONTHS[currentMonth.getMonth()];
  const year = currentMonth.getFullYear();

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

      {/* Calendar Overlay */}
      <View style={[styles.overlay, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.overlayContent}>
          <Text style={styles.title}>Select Date</Text>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <Text style={styles.monthText}>
              {monthName}, {year}
            </Text>
            <View style={styles.monthButtons}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => navigateMonth('prev')}>
                <Ionicons name="chevron-back" size={20} color={BOOKING_COLORS.BACKGROUND} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => navigateMonth('next')}>
                <Ionicons name="chevron-forward" size={20} color={BOOKING_COLORS.BACKGROUND} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Days of Week */}
          <View style={styles.daysOfWeek}>
            {DAYS_OF_WEEK.map((day) => (
              <Text key={day} style={styles.dayOfWeekText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>

          {/* Selected Dates Display */}
          {selectedRange.start && selectedRange.end && (
            <View style={styles.selectedDatesContainer}>
              <Text style={styles.selectedDatesText}>
                {formatDate(selectedRange.start)} - {formatDate(selectedRange.end)}
              </Text>
            </View>
          )}

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!selectedRange.start || !selectedRange.end) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedRange.start || !selectedRange.end}>
            <Text style={styles.nextButtonText}>Select Guest</Text>
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
    marginBottom: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  monthButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '500',
    color: BOOKING_COLORS.TEXT_SECONDARY,
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  calendarDayInRange: {
    backgroundColor: BOOKING_COLORS.PRIMARY + '30',
  },
  calendarDaySelected: {
    backgroundColor: BOOKING_COLORS.PRIMARY,
    borderRadius: 20,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  calendarDayTextSelected: {
    color: BOOKING_COLORS.BACKGROUND,
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  selectedDatesContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
  },
  selectedDatesText: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  nextButton: {
    width: '100%',
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: BOOKING_COLORS.TEXT_SECONDARY,
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
});

