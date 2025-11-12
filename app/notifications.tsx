import { BOOKING_COLORS } from '@/constants/booking';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';

interface Notification {
  id: string;
  type: 'message' | 'saved' | 'promotion' | 'password' | 'booking';
  title: string;
  message: string;
  time: string;
  imageUrl?: string;
  icon?: string;
}

const MOCK_NOTIFICATIONS: { section: string; data: Notification[] }[] = [
  {
    section: 'Today',
    data: [
      {
        id: '1',
        type: 'message',
        title: 'You have 4 new message',
        message: 'Jaylen agent shared a message',
        time: '2 hours ago',
        icon: 'mail',
      },
      {
        id: '2',
        type: 'saved',
        title: 'You Saved "Malon Greens"',
        message: 'Your post bookmarked',
        time: '5 hours ago',
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
      },
    ],
  },
  {
    section: 'Yesterday',
    data: [
      {
        id: '3',
        type: 'promotion',
        title: 'Get 30% OFF on first booking',
        message: 'Special promotion only valid today',
        time: 'Yesterday',
        icon: 'pricetag',
      },
      {
        id: '4',
        type: 'password',
        title: 'Password Update Successful',
        message: 'Your password updated successfully',
        time: 'Yesterday',
        icon: 'lock-closed',
      },
      {
        id: '5',
        type: 'saved',
        title: 'You Saved "Paradise Mint"',
        message: 'Your post bookmarked',
        time: 'Yesterday',
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
      },
    ],
  },
];

export default function NotificationsScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderNotification = ({ item }: { item: Notification }): React.JSX.Element => (
    <View style={styles.notificationCard}>
      {item.imageUrl ? (
        <ExpoImage
          source={{ uri: item.imageUrl }}
          style={styles.notificationImage}
          contentFit="cover"
        />
      ) : item.icon ? (
        <View style={styles.notificationIconContainer}>
          <Ionicons
            name={item.icon as any}
            size={24}
            color={BOOKING_COLORS.PRIMARY}
          />
        </View>
      ) : (
        <View style={styles.notificationIconContainer}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={BOOKING_COLORS.PRIMARY}
          />
        </View>
      )}
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </View>
  );

  const renderSection = ({ item }: { item: { section: string; data: Notification[] } }): React.JSX.Element => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{item.section}</Text>
      {item.data.map((notification) => (
        <View key={notification.id}>
          {renderNotification({ item: notification })}
        </View>
      ))}
    </View>
  );

  const allNotifications = MOCK_NOTIFICATIONS.flatMap((section) =>
    section.data.map((notif) => ({ ...notif, section: section.section }))
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        renderItem={renderSection}
        keyExtractor={(item) => item.section}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={BOOKING_COLORS.TEXT_SECONDARY} />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  listContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  notificationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  notificationIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: BOOKING_COLORS.PRIMARY + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginTop: 16,
  },
});

