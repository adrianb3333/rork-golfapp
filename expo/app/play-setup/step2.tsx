import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import HorizontalPager from '@/components/HorizontalPager';
import Step2Page1 from './screens/Step2Page1';

export default function PlayStep2Screen() {
  const insets = useSafeAreaInsets();
  const pages = [<Step2Page1 key="1" />];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [hasCourse, setHasCourse] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      void AsyncStorage.getItem('play_setup_selected_course').then((val) => {
        setHasCourse(val !== null && val !== '');
      });
    }, [])
  );

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(1200),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (!hasCourse) {
      Alert.alert('Select a Course', 'Please select a course before continuing.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/play-setup/step3');
  };

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <GlassBackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>Setup Round</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>2/3</Text>
        </View>
      </View>

      <View style={styles.content}>
        <HorizontalPager pages={pages} hideDots />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.nextButton, !hasCourse && styles.nextButtonDisabled]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextButtonText, !hasCourse && styles.nextButtonTextDisabled]}>{hasCourse ? 'Next' : 'Select a Course'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  stepIndicator: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
  },
  nextButton: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  nextButtonTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});
