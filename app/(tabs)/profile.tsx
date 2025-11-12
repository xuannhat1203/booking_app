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

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, ToastComponent } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
  });

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (__DEV__) {
          console.log('Profile screen - Fetching userId from storage:', {
            id,
            idType: typeof id,
            idLength: id?.length,
            isEmpty: !id || id.trim() === '',
          });
        }
        if (id && id.trim() !== '') {
          setUserId(id.trim());
          if (__DEV__) {
            console.log('Profile screen - userId set successfully:', id.trim());
          }
        } else {
          if (__DEV__) {
            console.warn('Profile screen - No userId found in storage');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Profile screen - Error fetching userId:', error);
        }
      }
    };
    fetchUserId();
  }, []);

  const { data: userProfile, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => {
      if (__DEV__) {
        console.log('Profile screen - useQuery calling getUserProfile:', { userId });
      }
      return getUserProfile(userId);
    },
    enabled: !!userId && userId.trim() !== '',
    retry: 1,
  });

  // Log query state changes
  useEffect(() => {
    if (__DEV__) {
      console.log('Profile screen - Query state:', {
        isLoading,
        isError,
        hasUserProfile: !!userProfile,
        userProfileKeys: userProfile ? Object.keys(userProfile) : [],
        userId,
        queryError: queryError ? {
          message: queryError?.message,
          response: queryError?.response?.data,
          status: queryError?.response?.status,
        } : null,
      });
    }
  }, [isLoading, isError, userProfile, userId, queryError]);

  useEffect(() => {
    // Kiểm tra userProfile có tồn tại và có dữ liệu thực sự không
    if (userProfile && Object.keys(userProfile).length > 0) {
      if (__DEV__) {
        console.log('Processing user profile data:', {
          userId,
          userProfile,
          hasEmail: !!userProfile.email,
          hasFullName: !!userProfile.fullName,
          keys: Object.keys(userProfile),
        });
      }

      // Normalize gender to uppercase for display (MALE/FEMALE)
      let normalizedGender = userProfile.gender || '';
      if (normalizedGender) {
        normalizedGender = normalizedGender.toUpperCase();
      }
      
      // Format dateOfBirth để hiển thị
      // Backend có thể trả về cả DD-MM-YYYY hoặc YYYY-MM-DD
      let formattedDateOfBirth = userProfile.dateOfBirth || '';
      if (formattedDateOfBirth) {
        try {
          // Kiểm tra nếu là format YYYY-MM-DD
          const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
          const yyyymmddMatch = formattedDateOfBirth.match(yyyymmddRegex);
          
          if (yyyymmddMatch) {
            // Convert từ YYYY-MM-DD sang DD-MM-YYYY để hiển thị
            const year = yyyymmddMatch[1];
            const month = yyyymmddMatch[2];
            const day = yyyymmddMatch[3];
            formattedDateOfBirth = `${day}-${month}-${year}`;
          }
          // Nếu đã là DD-MM-YYYY thì giữ nguyên
        } catch (error) {
          if (__DEV__) {
            console.warn('Error formatting dateOfBirth for display:', error);
          }
        }
      }
      
      setFormData({
        email: userProfile.email || '',
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        dateOfBirth: formattedDateOfBirth,
        gender: normalizedGender,
      });
      
      if (__DEV__) {
        console.log('Loaded user profile successfully:', {
          userId,
          userProfile,
          normalizedGender,
          originalDateOfBirth: userProfile.dateOfBirth,
          formattedDateOfBirth,
          formData: {
            email: userProfile.email || '',
            fullName: userProfile.fullName || '',
            phone: userProfile.phone || '',
            address: userProfile.address || '',
            dateOfBirth: formattedDateOfBirth,
            gender: normalizedGender,
          },
        });
      }
    } else if (userProfile && Object.keys(userProfile).length === 0) {
      // Trường hợp userProfile là object rỗng
      if (__DEV__) {
        console.warn('User profile is empty object:', {
          userId,
          userProfile,
        });
      }
    }
  }, [userProfile, userId]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => updateUserProfile(userId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['user-profile', userId], data);
      showSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
    },
    onError: (error: any) => {
      if (__DEV__) {
        console.error('Update profile error:', {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          message: error?.message,
          userMessage: error?.userMessage,
          userId,
        });
      }
      const errorMessage = sanitizeErrorMessage(error);
      showError(errorMessage);
    },
  });

  const handleSave = () => {
    // Kiểm tra userId
    if (!userId) {
      showError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    
    // Chỉ validate và gửi các trường được phép sửa
    if (!formData.fullName?.trim()) {
      showError('Vui lòng điền họ và tên');
      return;
    }
    
    // Chỉ gửi các trường được phép sửa, không gửi empty string
    const updateData: UpdateProfileData = {
      fullName: formData.fullName.trim(),
    };
    
    // Chỉ thêm các trường nếu có giá trị
    if (formData.address?.trim()) {
      updateData.address = formData.address.trim();
    }
    
    // Format dateOfBirth đúng format yyyy-MM-dd cho Java LocalDate
    // Hỗ trợ cả format DD-MM-YYYY và YYYY-MM-DD
    if (formData.dateOfBirth?.trim()) {
      const dateStr = formData.dateOfBirth.trim();
      let year: number;
      let month: number;
      let day: number;
      
      try {
        // Kiểm tra format DD-MM-YYYY (22-12-2005)
        const ddmmyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
        const ddmmyyyyMatch = dateStr.match(ddmmyyyyRegex);
        
        // Kiểm tra format YYYY-MM-DD (2005-12-22)
        const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const yyyymmddMatch = dateStr.match(yyyymmddRegex);
        
        if (ddmmyyyyMatch) {
          // Format DD-MM-YYYY
          day = parseInt(ddmmyyyyMatch[1], 10);
          month = parseInt(ddmmyyyyMatch[2], 10);
          year = parseInt(ddmmyyyyMatch[3], 10);
        } else if (yyyymmddMatch) {
          // Format YYYY-MM-DD
          year = parseInt(yyyymmddMatch[1], 10);
          month = parseInt(yyyymmddMatch[2], 10);
          day = parseInt(yyyymmddMatch[3], 10);
        } else {
          showError('Ngày sinh phải có định dạng DD-MM-YYYY (ví dụ: 22-12-2005) hoặc YYYY-MM-DD');
          return;
        }
        
        // Validate date values
        if (month < 1 || month > 12) {
          showError('Tháng phải từ 01 đến 12');
          return;
        }
        if (day < 1 || day > 31) {
          showError('Ngày không hợp lệ');
          return;
        }
        if (year < 1900 || year > new Date().getFullYear()) {
          showError('Năm không hợp lệ');
          return;
        }
        
        // Validate date bằng cách tạo Date object (để check leap year, etc)
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
          showError('Ngày sinh không hợp lệ (ví dụ: tháng 2 chỉ có 28-29 ngày)');
          return;
        }
        
        // Format lại thành DD-MM-YYYY cho backend Java (theo test Postman)
        // Backend chấp nhận format DD-MM-YYYY, không phải YYYY-MM-DD
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        const yearStr = String(year);
        
        // Tạo string hoàn toàn clean, không có ký tự ẩn
        // Format: DD-MM-YYYY (ví dụ: 22-12-2005)
        const formattedDate = dayStr + '-' + monthStr + '-' + yearStr;
        
        // Clean string: loại bỏ tất cả whitespace và ký tự không in được
        // Chỉ giữ lại digits và dấu gạch ngang
        const cleanedDate = formattedDate.replace(/[^\d-]/g, '');
        
        // Validate lại format sau khi clean (DD-MM-YYYY)
        if (!/^\d{2}-\d{2}-\d{4}$/.test(cleanedDate)) {
          showError('Lỗi format ngày sinh. Vui lòng thử lại.');
          return;
        }
        
        updateData.dateOfBirth = cleanedDate;
        
        if (__DEV__) {
          console.log('Formatted dateOfBirth:', {
            original: dateStr,
            year,
            month,
            day,
            yearStr,
            monthStr,
            dayStr,
            formattedDate,
            cleanedDate,
            final: updateData.dateOfBirth,
            length: updateData.dateOfBirth.length,
            charCodes: Array.from(updateData.dateOfBirth).map(c => c.charCodeAt(0)),
            jsonString: JSON.stringify(updateData.dateOfBirth),
          });
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error formatting dateOfBirth:', error);
        }
        showError('Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng DD-MM-YYYY (ví dụ: 22-12-2005)');
        return;
      }
    }
    
    // Format gender theo backend yêu cầu
    // Backend chấp nhận "Nam", "Nữ", "Khác" (theo test Postman)
    if (formData.gender) {
      const genderUpper = formData.gender.toUpperCase();
      if (genderUpper === 'MALE') {
        updateData.gender = 'Nam';
      } else if (genderUpper === 'FEMALE') {
        updateData.gender = 'Nữ';
      } else if (genderUpper === 'OTHER') {
        updateData.gender = 'Khác';
      } else {
        // Giữ nguyên nếu đã là format đúng (Nam, Nữ, Khác)
        updateData.gender = formData.gender;
      }
    }
    
    if (__DEV__) {
      console.log('Updating profile with data:', {
        userId,
        updateData,
        originalFormData: formData,
      });
    }
    
    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    if (userProfile) {
      // Normalize gender to uppercase for display
      let normalizedGender = userProfile.gender || '';
      if (normalizedGender) {
        normalizedGender = normalizedGender.toUpperCase();
      }
      
      // Format dateOfBirth để hiển thị
      // Backend có thể trả về cả DD-MM-YYYY hoặc YYYY-MM-DD
      let formattedDateOfBirth = userProfile.dateOfBirth || '';
      if (formattedDateOfBirth) {
        try {
          const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
          const yyyymmddMatch = formattedDateOfBirth.match(yyyymmddRegex);
          
          if (yyyymmddMatch) {
            // Convert từ YYYY-MM-DD sang DD-MM-YYYY để hiển thị
            const year = yyyymmddMatch[1];
            const month = yyyymmddMatch[2];
            const day = yyyymmddMatch[3];
            formattedDateOfBirth = `${day}-${month}-${year}`;
          }
          // Nếu đã là DD-MM-YYYY thì giữ nguyên
        } catch (error) {
          // Ignore error, keep original format
        }
      }
      
      setFormData({
        email: userProfile.email || '',
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        dateOfBirth: formattedDateOfBirth,
        gender: normalizedGender,
      });
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userId');
      router.replace('/login');
    } catch (error) {
      if (__DEV__) {
        console.error('Error logging out:', error);
      }
    }
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

  if (isError || !userProfile || (userProfile && Object.keys(userProfile).length === 0)) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color={BOOKING_COLORS.TEXT_SECONDARY} />
        <Text style={styles.errorText}>Không thể tải thông tin tài khoản</Text>
        {isError && __DEV__ && (
          <Text style={[styles.errorText, { fontSize: 12, marginTop: 8 }]}>
            Kiểm tra console để xem chi tiết lỗi
          </Text>
        )}
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            if (__DEV__) {
              console.log('Retrying user profile fetch:', { userId });
            }
            queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
          }}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />
      {ToastComponent}

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userProfile.avatar ? (
              <ExpoImage
                source={{ uri: userProfile.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(userProfile.fullName)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{userProfile.fullName || 'User'}</Text>
          {userProfile.email && (
            <View style={styles.emailRow}>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
              <TouchableOpacity onPress={() => router.push('/edit-profile')}>
                <Ionicons name="create-outline" size={18} color={BOOKING_COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.7}>
            <Ionicons name="create-outline" size={20} color={BOOKING_COLORS.TEXT_PRIMARY} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/enter-new-password')}
            activeOpacity={0.7}>
            <Ionicons name="lock-closed-outline" size={20} color={BOOKING_COLORS.TEXT_PRIMARY} />
            <Text style={styles.menuItemText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/add-card')}
            activeOpacity={0.7}>
            <Ionicons name="card-outline" size={20} color={BOOKING_COLORS.TEXT_PRIMARY} />
            <Text style={styles.menuItemText}>Payment Method</Text>
            <Ionicons name="chevron-forward" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color={BOOKING_COLORS.TEXT_PRIMARY} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={20} color={BOOKING_COLORS.TEXT_PRIMARY} />
            <Text style={styles.menuItemText}>My Bookings</Text>
            <Ionicons name="chevron-forward" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}>
            <Ionicons name="moon-outline" size={20} color={BOOKING_COLORS.TEXT_PRIMARY} />
            <Text style={styles.menuItemText}>Dark Mode</Text>
            <View style={styles.toggleSwitch}>
              <View style={styles.toggleSwitchOff} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/privacy-policy')}
            activeOpacity={0.7}>
            <Ionicons name="shield-checkmark-outline" size={20} color={BOOKING_COLORS.TEXT_PRIMARY} />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/terms-conditions')}
            activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={20} color={BOOKING_COLORS.TEXT_PRIMARY} />
            <Text style={styles.menuItemText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color={BOOKING_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.PRIMARY,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BOOKING_COLORS.PRIMARY,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BOOKING_COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: BOOKING_COLORS.BACKGROUND,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: BOOKING_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  formSection: {
    padding: 16,
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
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
  },
  inputDisabled: {
    backgroundColor: BOOKING_COLORS.BACKGROUND,
    color: BOOKING_COLORS.TEXT_SECONDARY,
  },
  readonlyHint: {
    fontSize: 12,
    color: BOOKING_COLORS.TEXT_SECONDARY,
    marginTop: 4,
    fontStyle: 'italic',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    alignItems: 'center',
  },
  genderOptionActive: {
    borderColor: BOOKING_COLORS.PRIMARY,
    backgroundColor: BOOKING_COLORS.PRIMARY + '20',
  },
  genderOptionDisabled: {
    opacity: 0.6,
  },
  genderText: {
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  genderTextActive: {
    color: BOOKING_COLORS.PRIMARY,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: BOOKING_COLORS.CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BOOKING_COLORS.BORDER,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  saveButton: {
    backgroundColor: BOOKING_COLORS.PRIMARY,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BOOKING_COLORS.BACKGROUND,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutSection: {
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#EF4444' + '10',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  menuSection: {
    padding: 16,
    marginTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BOOKING_COLORS.BORDER,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: BOOKING_COLORS.TEXT_PRIMARY,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: BOOKING_COLORS.BORDER,
    padding: 2,
  },
  toggleSwitchOff: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BOOKING_COLORS.BACKGROUND,
  },
});
