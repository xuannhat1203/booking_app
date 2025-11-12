import { ONBOARDING_COLORS, ONBOARDING_DATA, STORAGE_KEYS } from '@/constants/onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingItemProps {
  item: typeof ONBOARDING_DATA[0];
  index: number;
}

interface OnboardingItemPropsWithIndex extends OnboardingItemProps {
  isActive: boolean;
}

const OnboardingItem: React.FC<OnboardingItemPropsWithIndex> = ({ item, isActive }) => {
  return (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </View>
      <View style={styles.contentCard}>
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </View>
  );
};

export default function OnboardingScreen(): React.JSX.Element {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  
  const isAndroid = Platform.OS === 'android';
  const bottomPadding = isAndroid ? Math.max(insets.bottom, 20) : insets.bottom;

  const handleNext = (): void => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = (): void => {
    handleGetStarted();
  };

  const handleGetStarted = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      router.replace('/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/login');
    }
  };

  const handleScroll = (event: any): void => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const renderPagination = (): React.JSX.Element => {
    return (
      <View style={styles.paginationContainer}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex ? styles.paginationDotActive : styles.paginationDotInactive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderButtons = (): React.JSX.Element => {
    const isLastScreen = currentIndex === ONBOARDING_DATA.length - 1;

    return (
      <View
        style={[
          styles.buttonContainer,
          isLastScreen && styles.buttonContainerCenter,
          { paddingBottom: bottomPadding },
        ]}>
        {!isLastScreen && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={isLastScreen ? handleGetStarted : handleNext}
          style={styles.nextButton}
          activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {isLastScreen ? 'Get Started' : 'Next'}
          </Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={isAndroid}
      />
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={({ item, index }) => (
          <OnboardingItem item={item} index={index} isActive={index === currentIndex} />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          });
        }}
      />
      {renderPagination()}
      {renderButtons()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ONBOARDING_COLORS.BACKGROUND,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: Platform.select({
      ios: 32,
      android: 28,
      default: 32,
    }),
    paddingHorizontal: 24,
    paddingBottom: Platform.select({
      ios: 50,
      android: 40,
      default: 50,
    }),
    minHeight: Platform.select({
      ios: SCREEN_HEIGHT * 0.45,
      android: SCREEN_HEIGHT * 0.42,
      default: SCREEN_HEIGHT * 0.45,
    }),
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  paginationContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.58,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: Platform.select({
      ios: 8,
      android: 10,
      default: 8,
    }),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    backgroundColor: ONBOARDING_COLORS.PAGINATION_ACTIVE,
    width: Platform.select({
      ios: 32,
      android: 30,
      default: 32,
    }),
    height: 6,
    borderRadius: 3,
    ...Platform.select({
      ios: {
        shadowColor: ONBOARDING_COLORS.PAGINATION_ACTIVE,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  paginationDotInactive: {
    backgroundColor: ONBOARDING_COLORS.PAGINATION_INACTIVE,
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  title: {
    fontSize: Platform.select({
      ios: 28,
      android: 26,
      default: 28,
    }),
    fontWeight: '700',
    color: ONBOARDING_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    lineHeight: Platform.select({
      ios: 36,
      android: 34,
      default: 36,
    }),
  },
  description: {
    fontSize: Platform.select({
      ios: 16,
      android: 15,
      default: 16,
    }),
    color: ONBOARDING_COLORS.TEXT_SECONDARY,
    lineHeight: Platform.select({
      ios: 24,
      android: 22,
      default: 24,
    }),
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.select({
      ios: 40,
      android: 32,
      default: 40,
    }),
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainerCenter: {
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: ONBOARDING_COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ONBOARDING_COLORS.PRIMARY,
    paddingVertical: Platform.select({
      ios: 14,
      android: 16,
      default: 14,
    }),
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  nextButtonText: {
    fontSize: 16,
    color: ONBOARDING_COLORS.BACKGROUND,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 18,
    color: ONBOARDING_COLORS.BACKGROUND,
    fontWeight: '600',
  },
});
