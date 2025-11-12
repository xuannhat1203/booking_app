import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AUTH_COLORS } from '@/constants/auth';

export const LogoHeader: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.arcContainer}>
          <View style={styles.arc} />
        </View>
        <Text style={styles.logoText}>
          <Text style={styles.logoTextLower}>live</Text>
          <Text style={styles.logoTextUpper}> Green</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 200,
    height: 100,
  },
  arcContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    top: -25,
    left: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arc: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: AUTH_COLORS.PRIMARY,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  logoText: {
    fontSize: 32,
    fontWeight: '600',
    color: AUTH_COLORS.PRIMARY,
    letterSpacing: 0.5,
  },
  logoTextLower: {
    fontSize: 32,
    fontWeight: '600',
  },
  logoTextUpper: {
    fontSize: 32,
    fontWeight: '600',
  },
});
