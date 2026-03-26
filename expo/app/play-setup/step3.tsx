import React, { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import HorizontalPager from '@/components/HorizontalPager';
import Step3Page1 from './screens/Step3Page1';
import { useSession } from '@/contexts/SessionContext';

export default function PlayStep3Screen() {
  const { startSession } = useSession();
  const insets = useSafeAreaInsets();
  const [roundName, setRoundName] = useState<string>('');  
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [advancedData, setAdvancedData] = useState<boolean>(false);
  const today = new Date().toISOString().split('T')[0];
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const handleNameChange = useCallback((name: string) => {
    setRoundName(name);
  }, []);

  const handlePrivateChange = useCallback((val: boolean) => {
    setIsPrivate(val);
  }, []);

  const handleAdvancedDataChange = useCallback((val: boolean) => {
    setAdvancedData(val);
  }, []);

  const pages = [<Step3Page1 key="1" onRoundNameChange={handleNameChange} roundDate={today} onPrivateChange={handlePrivateChange} onAdvancedDataChange={handleAdvancedDataChange} />];

  const handleBack = () => {
    router.back();
  };

  const handleStart = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('play_round_private', JSON.stringify(isPrivate));
    await AsyncStorage.setItem('play_setup_advanced_data', JSON.stringify(advancedData));
    startSession(roundName, today);
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
          <Text style={styles.stepText}>3/3</Text>
        </View>
      </View>

      <View style={styles.content}>
        <HorizontalPager pages={pages} hideDots />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start</Text>
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
  startButton: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
