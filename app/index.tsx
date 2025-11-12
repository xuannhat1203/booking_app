import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

const SPLASH_DURATION = 2000;

export default function SplashScreen(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const navigateToOnboarding = (): void => {
      setTimeout(() => {
        if (!isMounted) return;
        router.replace('/onboarding');
      }, SPLASH_DURATION);
    };
    const timer = setTimeout(() => {
      navigateToOnboarding();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={Platform.OS === 'android'}
      />
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: '#6C7CE7',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  logoText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6C7CE7',
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