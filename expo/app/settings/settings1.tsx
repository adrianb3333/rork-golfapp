import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, User, ChevronRight, LogOut, ImageIcon, X, Shield } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/contexts/ProfileContext';

type CoachPopupStep = 'none' | 'confirm' | 'warning';

interface ProfileData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  sex: string;
  home_course: string;
  country: string;
}

export default function Settings1Screen() {
  const router = useRouter();
  const { profile, uploadAvatar, updateProfile, refetchAll, backgroundImageUri, setBackgroundImage, isCoachMode, activateCoachMode } = useProfile();
  const [coachPopupStep, setCoachPopupStep] = useState<CoachPopupStep>('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    sex: '',
    home_course: '',
    country: '',
  });

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Error loading profile:', error);
      }

      if (data) {
        setFormData({
          username: data.username || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
          date_of_birth: data.date_of_birth || '',
          sex: data.sex || '',
          home_course: data.home_course || '',
          country: data.country || '',
        });
      } else {
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
        }));
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save settings');
        return;
      }

      await updateProfile({
        username: formData.username.trim(),
      });

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: formData.username.trim(),
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          date_of_birth: formData.date_of_birth,
          sex: formData.sex,
          home_course: formData.home_course,
          country: formData.country,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.log('Save error:', error);
        Alert.alert('Error', 'Failed to save settings');
      } else {
        refetchAll();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
          router.back();
        } catch (e) {
          console.log('[Settings] Nav error after save:', e);
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = useCallback(async () => {
    console.log('[Settings] Picking avatar');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photo library.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploadingAvatar(true);
      try {
        await uploadAvatar(result.assets[0].uri);
        console.log('[Settings] Avatar uploaded successfully');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        console.error('[Settings] Avatar upload error:', err.message);
        Alert.alert('Error', 'Could not upload image. Try again.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  }, [uploadAvatar]);

  const handlePickBackgroundImage = useCallback(async () => {
    console.log('[Settings] Picking background image');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photo library.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        await setBackgroundImage(result.assets[0].uri);
        console.log('[Settings] Background image set successfully');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        console.error('[Settings] Background image error:', err.message);
        Alert.alert('Error', 'Could not set background image.');
      }
    }
  }, [setBackgroundImage]);

  const handleClearBackgroundImage = useCallback(async () => {
    console.log('[Settings] Clearing background image');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await setBackgroundImage(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('[Settings] Clear bg error:', err.message);
    }
  }, [setBackgroundImage]);

  const handleGoBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      router.back();
    } catch (e) {
      console.log('[Settings] Navigation error, forcing replace:', e);
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleSignOut = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              console.log('User signed out successfully');
            }
          },
        },
      ]
    );
  }, []);

  const updateField = (field: keyof ProfileData, value: string) => {
    const truncated = value.slice(0, 200);
    setFormData(prev => ({ ...prev, [field]: truncated }));
  };

  const fields: { key: keyof ProfileData; label: string; placeholder: string; keyboardType?: 'default' | 'email-address' }[] = [
    { key: 'username', label: 'Username', placeholder: 'Enter username' },
    { key: 'first_name', label: 'First Name', placeholder: 'Enter first name' },
    { key: 'last_name', label: 'Last Name', placeholder: 'Enter last name' },
    { key: 'email', label: 'Email', placeholder: 'Enter email', keyboardType: 'email-address' },
    { key: 'date_of_birth', label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
    { key: 'sex', label: 'Sex', placeholder: 'Enter sex' },
    { key: 'home_course', label: 'Home Course', placeholder: 'Enter home course' },
    { key: 'country', label: 'Country', placeholder: 'Enter country' },
  ];

  if (loading) {
    return (
      <LinearGradient
        colors={['#D6E4F0', '#C8DCF0', '#BDD4EB', '#D6E4F0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.root}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#D6E4F0', '#C8DCF0', '#BDD4EB', '#D6E4F0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <GlassBackButton onPress={handleGoBack} />
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePickAvatar}
                style={styles.avatarTouchable}
                activeOpacity={0.8}
                testID="settings-avatar-button"
              >
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={36} color="rgba(0,0,0,0.3)" />
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Camera size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </View>

            <Text style={styles.sectionLabel}>PROFILE</Text>
            <View style={styles.glassCard}>
              {fields.map((field, index) => (
                <View key={field.key}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={formData[field.key]}
                      onChangeText={(value) => updateField(field.key, value)}
                      placeholder={field.placeholder}
                      placeholderTextColor="rgba(0,0,0,0.25)"
                      keyboardType={field.keyboardType || 'default'}
                      autoCapitalize={field.key === 'username' ? 'none' : 'sentences'}
                      autoCorrect={field.key === 'username' ? false : true}
                      maxLength={200}
                      selectionColor="#1A1A1A"
                    />
                  </View>
                  {index < fields.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>APPEARANCE</Text>
            <TouchableOpacity
              style={styles.glassCard}
              onPress={handlePickBackgroundImage}
              activeOpacity={0.7}
              testID="background-image-button"
            >
              <View style={styles.bgImageRow}>
                <View style={styles.bgImageLeft}>
                  <View style={styles.bgImageIconWrap}>
                    <ImageIcon size={20} color="#1A1A1A" />
                  </View>
                  <View>
                    <Text style={styles.bgImageTitle}>Background Image</Text>
                    <Text style={styles.bgImageSubtitle}>
                      {backgroundImageUri ? 'Tap to change' : 'Choose a photo for your profile'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="rgba(0,0,0,0.3)" />
              </View>
              {backgroundImageUri ? (
                <View style={styles.bgImagePreviewRow}>
                  <Image source={{ uri: backgroundImageUri }} style={styles.bgImagePreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.bgImageClearBtn}
                    onPress={handleClearBackgroundImage}
                    activeOpacity={0.7}
                  >
                    <X size={14} color="#FFFFFF" />
                    <Text style={styles.bgImageClearText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.glassCard}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCoachPopupStep('confirm');
              }}
              activeOpacity={0.7}
              testID="coach-activation-button"
            >
              <View style={styles.bgImageRow}>
                <View style={styles.bgImageLeft}>
                  <View style={[styles.bgImageIconWrap, { backgroundColor: isCoachMode ? 'rgba(61,149,77,0.15)' : 'rgba(0,0,0,0.08)' }]}>
                    <Shield size={20} color={isCoachMode ? '#3D954D' : '#1A1A1A'} />
                  </View>
                  <View>
                    <Text style={styles.bgImageTitle}>Coach Activation</Text>
                    <Text style={styles.bgImageSubtitle}>
                      {isCoachMode ? 'Coach mode is active' : 'Activate coach features'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="rgba(0,0,0,0.3)" />
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <TouchableOpacity
              style={styles.glassCard}
              onPress={handleSignOut}
              activeOpacity={0.6}
            >
              <View style={styles.signOutRow}>
                <View style={styles.signOutLeft}>
                  <LogOut size={18} color="#FF5252" />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </View>
                <ChevronRight size={18} color="rgba(0,0,0,0.3)" />
              </View>
            </TouchableOpacity>

            <Text style={styles.versionText}>Version 1.0.0</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={coachPopupStep === 'confirm'}
        transparent
        animationType="fade"
        onRequestClose={() => setCoachPopupStep('none')}
      >
        <View style={coachStyles.overlay}>
          <LinearGradient
            colors={['#D6E4F0', '#C8DCF0', '#BDD4EB', '#D6E4F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={coachStyles.popupCard}
          >
            <Text style={coachStyles.popupTitle}>Coach Activation</Text>
            <Text style={coachStyles.popupText}>Do you want to activate Coach Mode?</Text>
            <View style={coachStyles.popupBtnRow}>
              <TouchableOpacity
                style={coachStyles.noBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCoachPopupStep('none');
                }}
                activeOpacity={0.7}
              >
                <Text style={coachStyles.noBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setCoachPopupStep('warning');
                }}
                activeOpacity={0.7}
                style={coachStyles.yesBtn}
              >
                <LinearGradient
                  colors={['#FF1C1C', '#E31010', '#B20000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={coachStyles.yesBtnGradient}
                >
                  <Text style={coachStyles.yesBtnText}>Yes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <Modal
        visible={coachPopupStep === 'warning'}
        transparent
        animationType="fade"
        onRequestClose={() => setCoachPopupStep('none')}
      >
        <View style={coachStyles.overlay}>
          <LinearGradient
            colors={['#D6E4F0', '#C8DCF0', '#BDD4EB', '#D6E4F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={coachStyles.popupCard}
          >
            <Text style={coachStyles.warningTitle}>Warning</Text>
            <Text style={coachStyles.warningMainText}>If player don't!</Text>
            <Text style={coachStyles.warningSmallText}>will change functionality of app!</Text>
            <View style={coachStyles.popupBtnRow}>
              <TouchableOpacity
                style={coachStyles.noBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCoachPopupStep('none');
                }}
                activeOpacity={0.7}
              >
                <Text style={coachStyles.noBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  await activateCoachMode();
                  setCoachPopupStep('none');
                  try {
                    router.back();
                  } catch (e) {
                    console.log('[Settings] Nav error after coach activation:', e);
                    router.replace('/(tabs)');
                  }
                }}
                activeOpacity={0.7}
                style={coachStyles.coachBtn}
              >
                <LinearGradient
                  colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={coachStyles.coachBtnGradient}
                >
                  <Text style={coachStyles.coachBtnText}>I am Coach!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const coachStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 28,
  },
  popupCard: {
    width: '100%' as const,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  popupText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  popupBtnRow: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%' as const,
  },
  noBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  noBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  yesBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  yesBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 14,
  },
  yesBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#FF3B30',
    marginBottom: 12,
  },
  warningMainText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
    marginBottom: 6,
  },
  warningSmallText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  coachBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  coachBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 14,
  },
  coachBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 70,
    alignItems: 'center' as const,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: 'center' as const,
    paddingVertical: 28,
  },
  avatarTouchable: {
    position: 'relative' as const,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cameraBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 1,
    marginLeft: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  glassCard: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    flex: 0.45,
  },
  fieldInput: {
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'right' as const,
    flex: 0.55,
    paddingVertical: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginLeft: 16,
  },
  bgImageRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bgImageLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  bgImageIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  bgImageTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  bgImageSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 2,
  },
  bgImagePreviewRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  bgImagePreview: {
    width: 120,
    height: 68,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bgImageClearBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(255,50,50,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  bgImageClearText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  signOutRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  signOutLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#FF5252',
  },
  versionText: {
    textAlign: 'center' as const,
    color: 'rgba(0,0,0,0.3)',
    fontSize: 12,
    marginTop: 32,
  },
});
