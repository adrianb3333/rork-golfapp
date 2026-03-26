import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useBag, ALL_CLUB_CATEGORIES } from '@/contexts/BagContext';

const REQUIRED_CLUBS = 13;

export default function MyBagBuildModal() {
  const router = useRouter();
  const { bagClubs, saveBag } = useBag();

  const initialSelected = new Set(bagClubs.filter((c) => c !== 'Pu'));
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(initialSelected);

  const toggleClub = useCallback((club: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(club)) {
        next.delete(club);
      } else {
        if (next.size >= REQUIRED_CLUBS) {
          Alert.alert('Maximum Reached', `You can only select ${REQUIRED_CLUBS} clubs (+ Putter).`);
          return prev;
        }
        next.add(club);
      }
      return next;
    });
  }, []);

  const handleSaveBag = useCallback(async () => {
    if (selectedClubs.size < REQUIRED_CLUBS) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Select All Clubs', `Please select all ${REQUIRED_CLUBS} clubs before saving.`);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const clubs = Array.from(selectedClubs);
    await saveBag(clubs);
    console.log('[MyBagBuild] Bag saved with', clubs.length, 'clubs + Putter');
    router.back();
  }, [selectedClubs, saveBag, router]);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
            testID="bag-build-back"
          >
            <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Build Your Bag!</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.topRow}>
        <View style={styles.topRowLeft}>
          <Text style={styles.counterText}>{selectedClubs.size}/{REQUIRED_CLUBS} selected</Text>
        </View>
        <View style={styles.putterArea}>
          <LinearGradient
            colors={['#4BA35B', '#3D954D', '#2D803D']}
            style={styles.putterCircle}
          >
            <Text style={styles.putterText}>Pu</Text>
          </LinearGradient>
          <Text style={styles.putterLabel}>Putter</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ALL_CLUB_CATEGORIES.map((category) => (
          <View key={category.name} style={styles.categoryBlock}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.clubGrid}>
              {category.clubs.map((club) => {
                const isSelected = selectedClubs.has(club);
                return (
                  <TouchableOpacity
                    key={club}
                    onPress={() => toggleClub(club)}
                    activeOpacity={0.7}
                    style={styles.clubTouchArea}
                    testID={`bag-club-${club}`}
                  >
                    <LinearGradient
                      colors={isSelected ? ['#4BA35B', '#3D954D', '#2D803D'] : ['#4BA35B', '#3D954D', '#2D803D']}
                      style={[
                        styles.clubCircle,
                        isSelected && styles.clubCircleSelected,
                      ]}
                    >
                      <Text style={styles.clubText}>{club}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              selectedClubs.size < REQUIRED_CLUBS && styles.saveBtnDisabled,
            ]}
            onPress={handleSaveBag}
            activeOpacity={0.8}
            testID="save-bag-button"
          >
            <Text style={[
              styles.saveBtnText,
              selectedClubs.size < REQUIRED_CLUBS && styles.saveBtnTextDisabled,
            ]}>
              Save Bag
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeTop: {
    backgroundColor: 'transparent',
  },
  safeBottom: {},
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  topRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  topRowLeft: {
    flex: 1,
    paddingTop: 12,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  putterArea: {
    alignItems: 'center' as const,
  },
  putterCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  putterText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  putterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryBlock: {
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 10,
  },
  clubGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  clubTouchArea: {},
  clubCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clubCircleSelected: {
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  clubText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  saveBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0059B2',
  },
  saveBtnTextDisabled: {
    color: '#999',
  },
});
