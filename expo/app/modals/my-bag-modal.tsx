import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useBag } from '@/contexts/BagContext';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();

interface ClubCategory {
  name: string;
  clubs: string[];
}

const CATEGORY_ORDER = ['Putter', 'Woods', 'Hybrids', 'Irons', 'Wedges'];

function categorizeClubs(clubs: string[]): ClubCategory[] {
  const categories: Record<string, string[]> = {
    Putter: [],
    Woods: [],
    Hybrids: [],
    Irons: [],
    Wedges: [],
  };

  for (const club of clubs) {
    if (club === 'Pu') {
      categories['Putter'].push(club);
    } else if (club === 'Dr' || club.endsWith('w')) {
      if (['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw'].includes(club) || club.endsWith('°')) {
        categories['Wedges'].push(club);
      } else {
        categories['Woods'].push(club);
      }
    } else if (club.endsWith('h')) {
      categories['Hybrids'].push(club);
    } else if (club.endsWith('i')) {
      categories['Irons'].push(club);
    } else if (club.endsWith('°')) {
      categories['Wedges'].push(club);
    }
  }

  return CATEGORY_ORDER
    .filter((name) => categories[name].length > 0)
    .map((name) => ({ name, clubs: categories[name] }));
}

function getClubDisplayName(club: string): string {
  if (club === 'Pu') return 'Putter';
  if (club === 'Dr') return 'Driver';
  if (club.endsWith('°')) return club;
  if (['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw'].includes(club)) {
    const map: Record<string, string> = {
      Pw: 'PW',
      Sw: 'SW',
      Aw: 'AW',
      Gw: 'GW',
      Lw: 'LW',
      Uw: 'UW',
    };
    return map[club] ?? club;
  }
  if (club.endsWith('w')) return `${club.replace('w', '')}W`;
  if (club.endsWith('h')) return `${club.replace('h', '')}H`;
  if (club.endsWith('i')) return `${club.replace('i', '')}i`;
  return club;
}

export default function MyBagModal() {
  const router = useRouter();
  const { getOrderedBagClubs } = useBag();
  const clubs = getOrderedBagClubs();
  const categorized = categorizeClubs(clubs);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)/profile' as any);
  }, [router]);

  const handleEditBag = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[MyBag] Opening edit bag');
    router.push('/modals/my-bag-build-modal' as any);
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
            testID="my-bag-back"
          >
            <Text style={styles.backBtnText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Bag</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categorized.length > 0 ? (
          categorized.map((category) => (
            <View key={category.name} style={styles.categoryBlock}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <View style={styles.clubsRow}>
                {category.clubs.map((club) => (
                  <View key={club} style={styles.clubCard}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']}
                      style={styles.clubCircle}
                    >
                      <Text style={styles.clubCircleText}>{club}</Text>
                    </LinearGradient>
                    <Text style={styles.clubLabel}>{getClubDisplayName(club)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No clubs in your bag yet</Text>
            <Text style={styles.emptySubtext}>Tap Edit Bag to build your bag</Text>
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.editBagBtn}
            onPress={handleEditBag}
            activeOpacity={0.8}
            testID="edit-bag-button"
          >
            <Plus size={20} color="#0059B2" strokeWidth={2.5} />
            <Text style={styles.editBagBtnText}>Edit Bag</Text>
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  categoryBlock: {
    marginBottom: 28,
  },
  categoryName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 14,
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
  clubCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  clubCircleText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  clubLabel: {
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  editBagBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  editBagBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0059B2',
  },
});
