import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSensor } from '@/contexts/SensorContext';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();

const PAIR_DURATION = 2000;

export default function PairingProcessModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clubs: string }>();
  const clubs: string[] = useMemo(() => params.clubs ? JSON.parse(params.clubs) : [], [params.clubs]);
  const { markPaired } = useSensor();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPairing, setIsPairing] = useState<boolean>(true);
  const [allDone, setAllDone] = useState<boolean>(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrowLeftAnim = useRef(new Animated.Value(0)).current;
  const arrowRightAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowLeftAnim, { toValue: -8, duration: 600, useNativeDriver: true }),
        Animated.timing(arrowLeftAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    const arrowRightLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowRightAnim, { toValue: 8, duration: 600, useNativeDriver: true }),
        Animated.timing(arrowRightAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    arrowLoop.start();
    arrowRightLoop.start();
    return () => {
      arrowLoop.stop();
      arrowRightLoop.stop();
    };
  }, [arrowLeftAnim, arrowRightAnim]);

  useEffect(() => {
    if (allDone) return;
    if (currentIndex >= clubs.length) {
      setAllDone(true);
      return;
    }

    setIsPairing(true);
    progressAnim.setValue(0);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: PAIR_DURATION,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      pulse.stop();
      pulseAnim.setValue(1);
      setIsPairing(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        if (currentIndex + 1 >= clubs.length) {
          setAllDone(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 500);
    }, PAIR_DURATION);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, [currentIndex, clubs.length, allDone, pulseAnim, progressAnim]);

  useEffect(() => {
    if (allDone) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      markPaired(clubs);
      Animated.spring(checkScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [allDone, checkScaleAnim, markPaired, clubs]);

  const handleDone = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/modals/sensor-bag-modal' as any);
  }, [router]);

  const getClubDisplayName = useCallback((club: string): string => {
    if (club === 'Pu') return 'Putter';
    if (club === 'Dr') return 'Driver';
    if (club.endsWith('w')) return `${club.replace('w', '')} Wood`;
    if (club.endsWith('h')) return `${club.replace('h', '')} Hybrid`;
    if (club.endsWith('i')) return `${club.replace('i', '')} Iron`;
    if (club === 'Pw') return 'Pitching Wedge';
    if (club === 'Sw') return 'Sand Wedge';
    if (club === 'Aw') return 'Approach Wedge';
    if (club === 'Gw') return 'Gap Wedge';
    if (club === 'Lw') return 'Lob Wedge';
    if (club === 'Uw') return 'Utility Wedge';
    if (club.endsWith('°')) return `${club} Wedge`;
    return club;
  }, []);

  const currentClub = clubs[currentIndex] ?? '';

  if (allDone) {
    return (
      <LinearGradient
        colors={['#4BA35B', '#3D954D', '#2D803D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.doneContainer}>
          <View style={styles.doneContentCenter}>
            <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScaleAnim }] }]}>
              <Check size={64} color="#fff" strokeWidth={3} />
            </Animated.View>
            <Text style={styles.doneTitle}>All Clubs Paired!</Text>
            <Text style={styles.doneSubtitle}>
              {clubs.length} clubs successfully paired
            </Text>
          </View>
          <View style={styles.doneFooter}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleDone}
              activeOpacity={0.8}
              testID="pairing-done-button"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Cancel Pairing',
                'Are you sure you want to cancel?',
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes', style: 'destructive', onPress: () => router.back() },
                ]
              );
            }}
            style={styles.cancelBtn}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerCounter}>
            {currentIndex + 1} / {clubs.length}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.mainArea}>
        <Animated.View style={[styles.arrowLeft, { transform: [{ translateX: arrowLeftAnim }] }]}>
          <ChevronLeft size={40} color="rgba(255,255,255,0.35)" />
        </Animated.View>

        <View style={styles.centerContent}>
          <Text style={styles.pairingLabel}>
            {isPairing ? 'Pairing...' : 'Paired!'}
          </Text>

          <Animated.View style={[styles.clubCircle, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.clubCircleInner}>
              <Text style={styles.clubCircleText}>{currentClub}</Text>
            </View>
          </Animated.View>

          <Text style={styles.clubName}>{getClubDisplayName(currentClub)}</Text>

          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
        </View>

        <Animated.View style={[styles.arrowRight, { transform: [{ translateX: arrowRightAnim }] }]}>
          <ChevronRight size={40} color="rgba(255,255,255,0.35)" />
        </Animated.View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Keep your sensor close to your device
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeTop: {},
  safeBottom: {},
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerSpacer: {
    width: 40,
  },
  headerCounter: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  arrowLeft: {
    position: 'absolute' as const,
    left: 12,
  },
  arrowRight: {
    position: 'absolute' as const,
    right: 12,
  },
  centerContent: {
    alignItems: 'center' as const,
  },
  pairingLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  clubCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  clubCircleInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clubCircleText: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#fff',
  },
  clubName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 32,
    letterSpacing: -0.3,
  },
  progressBarContainer: {
    width: SCREEN_WIDTH * 0.6,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  footer: {
    alignItems: 'center' as const,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
  },
  doneContainer: {
    flex: 1,
  },
  doneContentCenter: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  doneFooter: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  doneBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#3D954D',
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 8,
  },
  doneSubtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.75)',
  },
});
