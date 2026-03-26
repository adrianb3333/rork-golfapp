import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { saveClubSelection, getCurrentGpsPosition } from '@/services/clubSelectionService';
import { useBag } from '@/contexts/BagContext';
import { getScreenHeight } from '@/utils/responsive';

const SCREEN_HEIGHT = getScreenHeight();

interface ClubCategory {
  name: string;
  clubs: string[];
}

const DEFAULT_CLUB_CATEGORIES: ClubCategory[] = [
  {
    name: 'Woods',
    clubs: ['Dr', '3w', '5w', '7w'],
  },
  {
    name: 'Hybrids',
    clubs: ['1h', '2h', '3h', '4h', '5h'],
  },
  {
    name: 'Irons',
    clubs: ['4i', '5i', '6i', '7i', '8i', '9i'],
  },
  {
    name: 'Wedges',
    clubs: ['Pw', '52°', '56°', '60°'],
  },
  {
    name: 'Putter',
    clubs: ['Pu'],
  },
];

function categorizeBagClubs(bagClubs: string[]): ClubCategory[] {
  const categories: Record<string, string[]> = {
    Woods: [],
    Hybrids: [],
    Irons: [],
    Wedges: [],
    Putter: [],
  };

  for (const club of bagClubs) {
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

  const order = ['Woods', 'Hybrids', 'Irons', 'Wedges', 'Putter'];
  return order
    .filter((name) => categories[name].length > 0)
    .map((name) => ({ name, clubs: categories[name] }));
}

interface ShotMarker {
  clubId: string;
  latitude: number;
  longitude: number;
  rowId?: string;
}

interface ClubSelectorPopupProps {
  visible: boolean;
  onClose: () => void;
  onClubSelected?: (marker: ShotMarker) => void;
  sessionId?: string;
}

export default function ClubSelectorPopup({ visible, onClose, onClubSelected, sessionId }: ClubSelectorPopupProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [showContent, setShowContent] = useState<boolean>(false);
  const { bagClubs, hasBag, getOrderedBagClubs } = useBag();

  const clubCategories = useMemo(() => {
    if (hasBag && bagClubs.length > 0) {
      const ordered = getOrderedBagClubs();
      console.log('[ClubSelector] Using bag clubs:', ordered.length);
      return categorizeBagClubs(ordered);
    }
    return DEFAULT_CLUB_CATEGORIES;
  }, [hasBag, bagClubs, getOrderedBagClubs]);

  useEffect(() => {
    if (visible) {
      setShowContent(true);
      setSelectedClub(null);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowContent(false);
      });
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClubSelect = useCallback(async (clubId: string) => {
    if (saving) return;

    setSelectedClub(clubId);
    setSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    console.log('[ClubSelector] Club selected:', clubId);

    const position = await getCurrentGpsPosition();

    const lat = position?.latitude ?? 0;
    const lon = position?.longitude ?? 0;

    if (!position) {
      console.warn('[ClubSelector] Could not get GPS position, saving with 0,0');
    }

    const rowId = await saveClubSelection({
      clubId,
      latitude: lat,
      longitude: lon,
      sessionId,
    });

    console.log('[ClubSelector] Saved to DB, rowId:', rowId);

    onClubSelected?.({
      clubId,
      latitude: lat,
      longitude: lon,
      rowId: rowId ?? undefined,
    });

    setSaving(false);
    onClose();
  }, [saving, sessionId, onClose, onClubSelected]);

  if (!showContent) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.5, 0],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[styles.popupCard, { transform: [{ translateY }] }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Select Club</Text>
          <TouchableOpacity
            style={styles.closeCircle}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ChevronDown size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {clubCategories.map((category) => (
            <View key={category.name} style={styles.categoryBlock}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryIconRow}>
                  {category.clubs.length > 1 && (
                    <View style={styles.clubIconPlaceholder} />
                  )}
                </View>
                <View style={styles.clubsRow}>
                  {category.clubs.map((club) => {
                    const isSelected = selectedClub === club;
                    return (
                      <TouchableOpacity
                        key={club}
                        style={[
                          styles.clubCircle,
                          isSelected && styles.clubCircleSelected,
                        ]}
                        onPress={() => handleClubSelect(club)}
                        activeOpacity={0.7}
                        disabled={saving}
                      >
                        <Text style={[styles.clubText, isSelected && styles.clubTextSelected]}>
                          {club}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end' as const,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  popupCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.55,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryBlock: {
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  categoryIconRow: {
    width: 28,
    alignItems: 'center' as const,
    marginRight: 6,
  },
  clubIconPlaceholder: {
    width: 20,
    height: 20,
  },
  clubsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    flex: 1,
  },
  clubCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(30,30,30,0.8)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(60,60,60,0.3)',
  },
  clubCircleSelected: {
    backgroundColor: '#3D954D',
    borderColor: '#2D803D',
    shadowColor: '#3D954D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  clubText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  clubTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
  },
});
