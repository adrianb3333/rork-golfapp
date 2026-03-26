import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Wrench, Plus, Check, ChevronLeft, ChevronRight, Bluetooth } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSensor } from '@/contexts/SensorContext';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();
const REQUIRED_SENSOR_COUNT = 14;

type FlowState =
  | 'view'
  | 'select-unpair'
  | 'unpairing'
  | 'unpair-done'
  | 'select-add'
  | 'adding';

interface ClubCategory {
  name: string;
  clubs: string[];
}

const CLUB_CATEGORIES: ClubCategory[] = [
  { name: 'Woods', clubs: ['Dr', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w', '10w', '11w', '12w', '13w', '14w', '15w'] },
  { name: 'Hybrids', clubs: ['1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h'] },
  { name: 'Irons', clubs: ['1i', '2i', '3i', '4i', '5i', '6i', '7i', '8i', '9i', '10i', '11i', '12i', '13i', '14i', '15i'] },
  { name: 'Wedges', clubs: ['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw', '50°', '51°', '52°', '53°', '54°', '55°', '56°', '57°', '58°', '60°', '62°', '64°'] },
];

function getClubDisplayName(club: string): string {
  if (club === 'Pu') return 'Putter';
  if (club === 'Dr') return 'Driver';
  if (club.endsWith('°')) return `${club} Wedge`;
  if (['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw'].includes(club)) {
    const map: Record<string, string> = { Pw: 'Pitching Wedge', Sw: 'Sand Wedge', Aw: 'Approach Wedge', Gw: 'Gap Wedge', Lw: 'Lob Wedge', Uw: 'Utility Wedge' };
    return map[club] ?? club;
  }
  if (club.endsWith('w')) return `${club.replace('w', '')} Wood`;
  if (club.endsWith('h')) return `${club.replace('h', '')} Hybrid`;
  if (club.endsWith('i')) return `${club.replace('i', '')} Iron`;
  return club;
}

function getClubShortName(club: string): string {
  if (club === 'Pu') return 'Putter';
  if (club === 'Dr') return 'Driver';
  if (club.endsWith('°')) return club;
  if (['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw'].includes(club)) {
    const map: Record<string, string> = { Pw: 'PW', Sw: 'SW', Aw: 'AW', Gw: 'GW', Lw: 'LW', Uw: 'UW' };
    return map[club] ?? club;
  }
  if (club.endsWith('w')) return `${club.replace('w', '')}W`;
  if (club.endsWith('h')) return `${club.replace('h', '')}H`;
  if (club.endsWith('i')) return `${club.replace('i', '')}i`;
  return club;
}

function categorizeClubs(clubs: string[]): { name: string; clubs: string[] }[] {
  const categories: Record<string, string[]> = { Putter: [], Woods: [], Hybrids: [], Irons: [], Wedges: [] };
  for (const club of clubs) {
    if (club === 'Pu') { categories['Putter'].push(club); }
    else if (club === 'Dr' || (club.endsWith('w') && !['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw'].includes(club))) { categories['Woods'].push(club); }
    else if (club.endsWith('h')) { categories['Hybrids'].push(club); }
    else if (club.endsWith('i')) { categories['Irons'].push(club); }
    else if (['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw'].includes(club) || club.endsWith('°')) { categories['Wedges'].push(club); }
  }
  return ['Putter', 'Woods', 'Hybrids', 'Irons', 'Wedges']
    .filter((n) => categories[n].length > 0)
    .map((n) => ({ name: n, clubs: categories[n] }));
}

const PAIR_DURATION = 2000;

export default function SensorBagModal() {
  const router = useRouter();
  const { pairedClubs, unpairClubs, addPairedClubs, isFullyPaired } = useSensor();

  const [flowState, setFlowState] = useState<FlowState>('view');
  const [selectedForUnpair, setSelectedForUnpair] = useState<Set<string>>(new Set());
  const [unpairQueue, setUnpairQueue] = useState<string[]>([]);
  const [unpairIndex, setUnpairIndex] = useState<number>(0);
  const [isUnpairing, setIsUnpairing] = useState<boolean>(true);

  const [selectedForAdd, setSelectedForAdd] = useState<Set<string>>(new Set());
  const [addQueue, setAddQueue] = useState<string[]>([]);
  const [addIndex, setAddIndex] = useState<number>(0);
  const [isAdding, setIsAdding] = useState<boolean>(true);
  const [addAllDone, setAddAllDone] = useState<boolean>(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const arrowLeftAnim = useRef(new Animated.Value(0)).current;
  const arrowRightAnim = useRef(new Animated.Value(0)).current;

  const canUnpair = pairedClubs.length > 0;
  const hasPutter = pairedClubs.includes('Pu');
  const missingSlots = Math.max(0, REQUIRED_SENSOR_COUNT - pairedClubs.length);

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
    return () => { arrowLoop.stop(); arrowRightLoop.stop(); };
  }, [arrowLeftAnim, arrowRightAnim]);

  useEffect(() => {
    if (flowState !== 'unpairing') return;
    if (unpairIndex >= unpairQueue.length) {
      unpairClubs(unpairQueue);
      setFlowState('unpair-done');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(checkScaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
      return;
    }

    setIsUnpairing(true);
    progressAnim.setValue(0);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();

    Animated.timing(progressAnim, { toValue: 1, duration: PAIR_DURATION, useNativeDriver: false }).start();

    const timer = setTimeout(() => {
      pulse.stop();
      pulseAnim.setValue(1);
      setIsUnpairing(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setUnpairIndex((prev) => prev + 1);
      }, 500);
    }, PAIR_DURATION);

    return () => { clearTimeout(timer); pulse.stop(); };
  }, [flowState, unpairIndex, unpairQueue, unpairClubs, pulseAnim, progressAnim, checkScaleAnim]);

  useEffect(() => {
    if (flowState !== 'adding') return;
    if (addIndex >= addQueue.length) {
      addPairedClubs(addQueue);
      setAddAllDone(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkScaleAnim.setValue(0);
      Animated.spring(checkScaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
      return;
    }

    setIsAdding(true);
    progressAnim.setValue(0);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();

    Animated.timing(progressAnim, { toValue: 1, duration: PAIR_DURATION, useNativeDriver: false }).start();

    const timer = setTimeout(() => {
      pulse.stop();
      pulseAnim.setValue(1);
      setIsAdding(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setAddIndex((prev) => prev + 1);
      }, 500);
    }, PAIR_DURATION);

    return () => { clearTimeout(timer); pulse.stop(); };
  }, [flowState, addIndex, addQueue, addPairedClubs, pulseAnim, progressAnim, checkScaleAnim]);

  const handleClose = useCallback(() => {
    if (!hasPutter && pairedClubs.length > 0) {
      Alert.alert(
        'Putter Required',
        'You must have a Putter paired to complete your Sensor Bag. Please add a Putter before closing.',
        [{ text: 'OK' }]
      );
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)/profile' as any);
  }, [router, hasPutter, pairedClubs.length]);

  const handleStartUnpairSelect = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedForUnpair(new Set());
    setFlowState('select-unpair');
  }, []);

  const toggleUnpairClub = useCallback((club: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedForUnpair((prev) => {
      const next = new Set(prev);
      if (next.has(club)) { next.delete(club); } else { next.add(club); }
      return next;
    });
  }, []);

  const handleConfirmUnpair = useCallback(() => {
    if (selectedForUnpair.size === 0) return;
    Alert.alert(
      'Unpair Sensors',
      `Are you sure you want to unpair ${selectedForUnpair.size} sensor${selectedForUnpair.size > 1 ? 's' : ''}?`,
      [
        { text: 'No', style: 'cancel', onPress: () => { setFlowState('view'); } },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const queue = Array.from(selectedForUnpair);
            setUnpairQueue(queue);
            setUnpairIndex(0);
            setIsUnpairing(true);
            checkScaleAnim.setValue(0);
            setFlowState('unpairing');
          },
        },
      ]
    );
  }, [selectedForUnpair, checkScaleAnim]);

  const handleUnpairDone = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFlowState('view');
    setSelectedForUnpair(new Set());
    setUnpairQueue([]);
    setUnpairIndex(0);
  }, []);

  const handleStartAdd = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedForAdd(new Set());
    setFlowState('select-add');
  }, []);

  const toggleAddClub = useCallback((club: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedForAdd((prev) => {
      const next = new Set(prev);
      if (next.has(club)) { next.delete(club); } else {
        if (next.size >= missingSlots) {
          Alert.alert('Maximum Reached', `You can only add ${missingSlots} more club${missingSlots > 1 ? 's' : ''}.`);
          return prev;
        }
        next.add(club);
      }
      return next;
    });
  }, [missingSlots]);

  const handleStartPairingAdd = useCallback(() => {
    if (selectedForAdd.size === 0) return;
    const willHavePutter = pairedClubs.includes('Pu') || selectedForAdd.has('Pu');
    if (!willHavePutter) {
      Alert.alert('Putter Required', 'You must include a Putter in your Sensor Bag. Please select a Putter before pairing.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const queue = getOrderedNewClubs(selectedForAdd);
    setAddQueue(queue);
    setAddIndex(0);
    setIsAdding(true);
    setAddAllDone(false);
    checkScaleAnim.setValue(0);
    setFlowState('adding');
  }, [selectedForAdd, checkScaleAnim, pairedClubs]);

  const handleAddDone = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFlowState('view');
    setSelectedForAdd(new Set());
    setAddQueue([]);
    setAddIndex(0);
    setAddAllDone(false);
  }, []);

  if (flowState === 'unpairing') {
    const currentClub = unpairQueue[unpairIndex] ?? '';
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    if (unpairIndex >= unpairQueue.length) {
      return (
        <LinearGradient colors={['#B22D2D', '#D94040', '#E85555']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.flex1}>
            <View style={styles.doneCenter}>
              <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScaleAnim }] }]}>
                <Check size={64} color="#fff" strokeWidth={3} />
              </Animated.View>
              <Text style={styles.doneTitle}>Sensors Unpaired!</Text>
              <Text style={styles.doneSubtitle}>{unpairQueue.length} club{unpairQueue.length > 1 ? 's' : ''} unpaired</Text>
            </View>
            <View style={styles.doneFooterPad}>
              <TouchableOpacity style={styles.whiteBtnGreen} onPress={handleUnpairDone} activeOpacity={0.8}>
                <Text style={styles.whiteBtnGreenText}>Done Unpairing</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={['#B22D2D', '#D94040', '#E85555']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerCounter}>{unpairIndex + 1} / {unpairQueue.length}</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
        <View style={styles.mainArea}>
          <Animated.View style={[styles.arrowLeftPos, { transform: [{ translateX: arrowLeftAnim }] }]}>
            <ChevronLeft size={40} color="rgba(255,255,255,0.35)" />
          </Animated.View>
          <View style={styles.centerContent}>
            <Text style={styles.pairingLabel}>{isUnpairing ? 'Unpairing...' : 'Unpaired!'}</Text>
            <Animated.View style={[styles.clubCircleLg, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.clubCircleLgInner}>
                <Text style={styles.clubCircleLgText}>{currentClub}</Text>
              </View>
            </Animated.View>
            <Text style={styles.clubNameLg}>{getClubDisplayName(currentClub)}</Text>
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
          </View>
          <Animated.View style={[styles.arrowRightPos, { transform: [{ translateX: arrowRightAnim }] }]}>
            <ChevronRight size={40} color="rgba(255,255,255,0.35)" />
          </Animated.View>
        </View>
        <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
          <View style={styles.footerCenter}>
            <Text style={styles.footerHint}>Removing sensor pairing...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (flowState === 'unpair-done') {
    return (
      <LinearGradient colors={['#B22D2D', '#D94040', '#E85555']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.flex1}>
          <View style={styles.doneCenter}>
            <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScaleAnim }] }]}>
              <Check size={64} color="#fff" strokeWidth={3} />
            </Animated.View>
            <Text style={styles.doneTitle}>Sensors Unpaired!</Text>
            <Text style={styles.doneSubtitle}>{unpairQueue.length} club{unpairQueue.length > 1 ? 's' : ''} unpaired</Text>
          </View>
          <View style={styles.doneFooterPad}>
            <TouchableOpacity style={styles.whiteBtnGreen} onPress={handleUnpairDone} activeOpacity={0.8}>
              <Text style={styles.whiteBtnGreenText}>Done Unpairing</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (flowState === 'select-unpair') {
    return (
      <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setFlowState('view')} style={styles.headerBackBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select to Unpair</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.selectHint}>Tap clubs to select for unpairing</Text>
          <View style={styles.clubGrid}>
            {pairedClubs.map((club) => {
              const selected = selectedForUnpair.has(club);
              return (
                <TouchableOpacity key={club} onPress={() => toggleUnpairClub(club)} activeOpacity={0.7} style={styles.clubGridItem}>
                  <View style={[styles.clubGridCircle, selected && styles.clubGridCircleSelected]}>
                    <Text style={styles.clubGridText}>{club}</Text>
                    {selected && (
                      <View style={styles.clubCheckBadge}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.clubGridLabel}>{getClubShortName(club)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
          <View style={styles.footerPad}>
            <TouchableOpacity
              style={[styles.unpairBtn, selectedForUnpair.size === 0 && styles.unpairBtnDisabled]}
              onPress={handleConfirmUnpair}
              activeOpacity={0.8}
              disabled={selectedForUnpair.size === 0}
            >
              <Text style={[styles.unpairBtnText, selectedForUnpair.size === 0 && styles.unpairBtnTextDisabled]}>
                Unpair ({selectedForUnpair.size})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (flowState === 'select-add') {
    const alreadyPaired = new Set(pairedClubs);
    const needsPutter = !alreadyPaired.has('Pu');
    return (
      <LinearGradient colors={['#0059B2', '#1075E3', '#1C8CFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setFlowState('view')} style={styles.headerBackBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Sensors</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.selectHint}>Select {missingSlots} club{missingSlots > 1 ? 's' : ''} to pair ({selectedForAdd.size}/{missingSlots}){needsPutter ? ' — Putter required' : ''}</Text>
          {needsPutter && (
            <View style={styles.catBlock}>
              <Text style={styles.catName}>Putter</Text>
              <View style={styles.clubGrid}>
                <TouchableOpacity onPress={() => toggleAddClub('Pu')} activeOpacity={0.7} style={styles.clubGridItem}>
                  <LinearGradient
                    colors={selectedForAdd.has('Pu') ? ['#4BA35B', '#3D954D', '#2D803D'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
                    style={[styles.clubGridCircle, selectedForAdd.has('Pu') && styles.clubGridCircleSelectedBlue]}
                  >
                    <Text style={styles.clubGridText}>Pu</Text>
                  </LinearGradient>
                  <Text style={styles.clubGridLabel}>Putter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {CLUB_CATEGORIES.map((category) => {
            const availableClubs = category.clubs.filter((c) => !alreadyPaired.has(c));
            if (availableClubs.length === 0) return null;
            return (
              <View key={category.name} style={styles.catBlock}>
                <Text style={styles.catName}>{category.name}</Text>
                <View style={styles.clubGrid}>
                  {availableClubs.map((club) => {
                    const selected = selectedForAdd.has(club);
                    return (
                      <TouchableOpacity key={club} onPress={() => toggleAddClub(club)} activeOpacity={0.7} style={styles.clubGridItem}>
                        <LinearGradient
                          colors={selected ? ['#4BA35B', '#3D954D', '#2D803D'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
                          style={[styles.clubGridCircle, selected && styles.clubGridCircleSelectedBlue]}
                        >
                          <Text style={styles.clubGridText}>{club}</Text>
                        </LinearGradient>
                        <Text style={styles.clubGridLabel}>{getClubShortName(club)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
          <View style={styles.footerPad}>
            <TouchableOpacity
              style={[styles.whiteBtnBlue, selectedForAdd.size === 0 && styles.whiteBtnDisabled]}
              onPress={handleStartPairingAdd}
              activeOpacity={0.8}
              disabled={selectedForAdd.size === 0}
            >
              <Bluetooth size={20} color={selectedForAdd.size > 0 ? '#0059B2' : '#999'} />
              <Text style={[styles.whiteBtnBlueText, selectedForAdd.size === 0 && { color: '#999' }]}>
                Start Pairing ({selectedForAdd.size})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (flowState === 'adding') {
    const currentClub = addQueue[addIndex] ?? '';
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    if (addAllDone) {
      return (
        <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.flex1}>
            <View style={styles.doneCenter}>
              <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScaleAnim }] }]}>
                <Check size={64} color="#fff" strokeWidth={3} />
              </Animated.View>
              <Text style={styles.doneTitle}>Sensors Paired!</Text>
              <Text style={styles.doneSubtitle}>{addQueue.length} new club{addQueue.length > 1 ? 's' : ''} paired</Text>
            </View>
            <View style={styles.doneFooterPad}>
              <TouchableOpacity style={styles.whiteBtnGreen} onPress={handleAddDone} activeOpacity={0.8}>
                <Text style={styles.whiteBtnGreenText}>Done</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerCounter}>{addIndex + 1} / {addQueue.length}</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
        <View style={styles.mainArea}>
          <Animated.View style={[styles.arrowLeftPos, { transform: [{ translateX: arrowLeftAnim }] }]}>
            <ChevronLeft size={40} color="rgba(255,255,255,0.35)" />
          </Animated.View>
          <View style={styles.centerContent}>
            <Text style={styles.pairingLabel}>{isAdding ? 'Pairing...' : 'Paired!'}</Text>
            <Animated.View style={[styles.clubCircleLg, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.clubCircleLgInner}>
                <Text style={styles.clubCircleLgText}>{currentClub}</Text>
              </View>
            </Animated.View>
            <Text style={styles.clubNameLg}>{getClubDisplayName(currentClub)}</Text>
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
          </View>
          <Animated.View style={[styles.arrowRightPos, { transform: [{ translateX: arrowRightAnim }] }]}>
            <ChevronRight size={40} color="rgba(255,255,255,0.35)" />
          </Animated.View>
        </View>
        <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
          <View style={styles.footerCenter}>
            <Text style={styles.footerHint}>Keep your sensor close to your device</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const categorized = categorizeClubs(pairedClubs);

  return (
    <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftActions}>
            {canUnpair && (
              <TouchableOpacity onPress={handleStartUnpairSelect} style={styles.wrenchBtn} activeOpacity={0.7} testID="sensor-bag-wrench">
                <Wrench size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {missingSlots > 0 && (
              <TouchableOpacity onPress={handleStartAdd} style={styles.addBtn} activeOpacity={0.7} testID="sensor-bag-add">
                <Plus size={20} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerTitle}>Sensor Bag</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {!isFullyPaired && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              {missingSlots} sensor{missingSlots > 1 ? 's' : ''} missing — sensor features locked until all 14 are paired
            </Text>
          </View>
        )}
        {!hasPutter && pairedClubs.length > 0 && (
          <View style={[styles.warningCard, { borderColor: 'rgba(255,100,100,0.4)' }]}>
            <Text style={styles.warningText}>
              Putter is required — tap + to add it back
            </Text>
          </View>
        )}
        {categorized.length > 0 ? (
          categorized.map((category) => (
            <View key={category.name} style={styles.catBlock}>
              <Text style={styles.catName}>{category.name}</Text>
              <View style={styles.clubsRow}>
                {category.clubs.map((club) => (
                  <View key={club} style={styles.clubCard}>
                    <LinearGradient colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']} style={styles.clubCircleSm}>
                      <Text style={styles.clubCircleSmText}>{club}</Text>
                    </LinearGradient>
                    <Text style={styles.clubLabelSm}>{getClubShortName(club)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sensors paired</Text>
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.footerPad}>
          <TouchableOpacity style={styles.whiteBtnGreen} onPress={handleClose} activeOpacity={0.8} testID="sensor-bag-close">
            <Text style={styles.whiteBtnGreenText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getOrderedNewClubs(selected: Set<string>): string[] {
  const ordered: string[] = [];
  if (selected.has('Pu')) ordered.push('Pu');
  const categoryOrder = ['Woods', 'Hybrids', 'Irons', 'Wedges'];
  for (const catName of categoryOrder) {
    const cat = CLUB_CATEGORIES.find((c) => c.name === catName);
    if (cat) {
      for (const club of cat.clubs) {
        if (selected.has(club)) ordered.push(club);
      }
    }
  }
  return ordered;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  safeTop: { backgroundColor: 'transparent' },
  safeBottom: {},
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeftActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    minWidth: 70,
  },
  wrenchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSpacer: { width: 70 },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
  scrollPad: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  warningCard: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center' as const,
    lineHeight: 19,
  },
  catBlock: { marginBottom: 24 },
  catName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  clubsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 14,
  },
  clubCard: {
    alignItems: 'center' as const,
    width: (SCREEN_WIDTH - 40 - 56) / 5,
    minWidth: 58,
  },
  clubCircleSm: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  clubCircleSmText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  clubLabelSm: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.8)',
  },
  footerPad: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  whiteBtnGreen: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  whiteBtnGreenText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#3D954D',
  },
  whiteBtnBlue: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  whiteBtnBlueText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0059B2',
  },
  whiteBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  selectHint: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  clubGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  clubGridItem: {
    alignItems: 'center' as const,
    width: (SCREEN_WIDTH - 40 - 48) / 5,
    minWidth: 56,
  },
  clubGridCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  clubGridCircleSelected: {
    borderColor: '#FF4444',
    backgroundColor: 'rgba(255,68,68,0.3)',
  },
  clubGridCircleSelectedBlue: {
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  clubGridText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  clubGridLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  clubCheckBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4444',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  unpairBtn: {
    backgroundColor: '#FF4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  unpairBtnDisabled: {
    backgroundColor: 'rgba(255,68,68,0.4)',
  },
  unpairBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  unpairBtnTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  arrowLeftPos: { position: 'absolute' as const, left: 12 },
  arrowRightPos: { position: 'absolute' as const, right: 12 },
  centerContent: { alignItems: 'center' as const },
  pairingLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  clubCircleLg: {
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
  clubCircleLgInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clubCircleLgText: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#fff',
  },
  clubNameLg: {
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
  footerCenter: {
    alignItems: 'center' as const,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  footerHint: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
  },
  doneCenter: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
  doneFooterPad: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
