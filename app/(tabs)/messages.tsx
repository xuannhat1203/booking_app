import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BOOKING_COLORS } from '@/constants/booking';

export default function MessagesScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tin nhắn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
});
