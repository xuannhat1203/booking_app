import { getUserProfile, UpdateProfileData, updateUserProfile } from '@/apis/authApi';
import { BOOKING_COLORS } from '@/constants/booking';
import { useToast } from '@/hooks/use-toast';
import { sanitizeErrorMessage } from '@/utils/errorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, ToastComponent } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string>('');
  const [formData, setFormData] = useState<UpdateProfileData & { phone?: string }>({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
  });
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id && id.trim() !== '') {
          setUserId(id.trim());
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error fetching userId:', error);
        }
      }
    };
    fetchUserId();
  }, []);

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId && userId.trim() !== '',
  });

  useEffect(() => {
    if (userProfile && Object.keys(userProfile).length > 0) {
      let formattedDateOfBirth = userProfile.dateOfBirth || '';
      if (formattedDateOfBirth) {
        try {
          const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
          const yyyymmddMatch = formattedDateOfBirth.match(yyyymmddRegex);
          
          if (yyyymmddMatch) {
            const year = parseInt(yyyymmddMatch[1], 10);
            const month = parseInt(yyyymmddMatch[2], 10) - 1;
            const day = parseInt(yyyymmddMatch[3], 10);
            setDateOfBirth(new Date(year, month, day));
          }
        } catch (error) {
          // Ignore
        }
      }

      setFormData({
        email: userProfile.email || '',
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        dateOfBirth: formattedDateOfBirth,
        gender: userProfile.gender?.toUpperCase() || '',
      });
    }
  }, [userProfile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => updateUserProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      showSuccess('Cập nhật thông tin thành công!');
      router.back();
    },
    onError: (error: any) => {
      const errorMessage = sanitizeErrorMessage(error);
      showError(errorMessage);
    },
  });

  const handleDateChange = (event: any, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      const formatted = selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      setFormData({ ...formData, dateOfBirth: formatted });
    }
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSave = (): void => {
    if (!formData.fullName?.trim()) {
      showError('Vui lòng điền họ và tên');
      return;
    }

    const updateData: UpdateProfileData = {
      fullName: formData.fullName.trim(),
    };

    if (formData.address?.trim()) {
      updateData.address = formData.address.trim();
    }

    if (formData.dateOfBirth?.trim()) {
      const dateStr = dateOfBirth.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-');
      updateData.dateOfBirth = `${day}-${month}-${year}`;
    }

    if (formData.gender) {
      const genderUpper = formData.gender.toUpperCase();
      if (genderUpper === 'MALE') {
        updateData.gender = 'Nam';
      } else if (genderUpper === 'FEMALE') {
        updateData.gender = 'Nữ';
      } else {
        updateData.gender = formData.gender;
      }
    }

    updateMutation.mutate(updateData);
  };

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={BOOKING_COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />
      {ToastComponent}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={BOOKING_COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.content}>
          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            {userProfile?.avatar ? (
              <ExpoImage
                source={{ uri: userProfile.avatar }}
                style={styles.profilePicture}
                contentFit="cover"
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePictureText}>
                  {getInitials(userProfile?.fullName)}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editPictureButton}>
              <Ionicons name="camera" size={16} color={BOOKING_COLORS.BACKGROUND} />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="Curtis Weaver"
              placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.email}
              placeholder="curtis.weaver@example.com"
              placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.phone}
              placeholder="(209) 555-0104"
              placeholderTextColor={BOOKING_COLORS.TEXT_SECONDARY}
              keyboardType="phone-pad"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateInputText}>
                {formatDateForDisplay(dateOfBirth)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === 'MALE' && styles.genderOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: 'MALE' })}>
                <View style={styles.radioButton}>
                  {formData.gender === 'MALE' && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={styles.genderText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === 'FEMALE' && styles.genderOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: 'FEMALE' })}>
                <View style={styles.radioButton}>
                  {formData.gender === 'FEMALE' && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={styles.genderText}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.updateButton, updateMutation.isPending && styles.updateButtonDisabled]}
            onPress={handleSave}
            disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color={BOOKING_COLORS.BACKGROUND} />
            ) : (
              <Text style={styles.updateButtonText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePictureText: {
    fontSize: 36,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
  editPictureButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: BOOKING_COLORS.BACKGROUND,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputDisabled: {
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  dateInputText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
  genderOptionActive: {
    borderColor: BOOKING_COLORS.PRIMARY,
    backgroundColor: BOOKING_COLORS.PRIMARY + '20',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BOOKING_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BOOKING_COLORS.PRIMARY,
  },
  genderText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  updateButton: {
    width: '100%',
    backgroundColor: BOOKING_COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
});

