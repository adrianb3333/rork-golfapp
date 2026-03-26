import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, ChevronRight, Search, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CourseBuild, { HoleOption } from '@/components/PlaSta/CourseBuild';
import { useProfile } from '@/contexts/ProfileContext';

export interface SelectedPlayer {
  id: string;
  name: string;
  avatar_url: string | null;
  club?: string;
  hcp?: number;
  tee?: number;
}

export interface SelectedCourse {
  id: string;
  name: string;
  clubName: string;
  holes: number;
  par: number;
  city: string;
  country: string;
  imageUrl?: string;
}

const STORAGE_KEY_PLAYERS = 'play_setup_selected_players';
const STORAGE_KEY_COURSE = 'play_setup_selected_course';
const STORAGE_KEY_HOLE_OPTION = 'play_setup_hole_option';

export default function Step2Page1() {
  const { profile } = useProfile();
  const [players, setPlayers] = useState<SelectedPlayer[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [holeOption, setHoleOptionState] = useState<HoleOption>('18');

  useFocusEffect(
    useCallback(() => {
      void loadSelections();
    }, [])
  );

  const handleHoleOptionChange = async (option: HoleOption) => {
    setHoleOptionState(option);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_HOLE_OPTION, option);
      console.log('[Step2Page1] Saved hole option:', option);
    } catch (e) {
      console.log('[Step2Page1] Error saving hole option:', e);
    }
  };

  const loadSelections = async () => {
    try {
      const storedPlayers = await AsyncStorage.getItem(STORAGE_KEY_PLAYERS);
      if (storedPlayers) {
        setPlayers(JSON.parse(storedPlayers));
      } else {
        setPlayers([]);
      }
      const storedCourse = await AsyncStorage.getItem(STORAGE_KEY_COURSE);
      if (storedCourse) {
        setSelectedCourse(JSON.parse(storedCourse));
      } else {
        setSelectedCourse(null);
      }
      const storedHoleOption = await AsyncStorage.getItem(STORAGE_KEY_HOLE_OPTION);
      if (storedHoleOption) {
        setHoleOptionState(storedHoleOption as HoleOption);
      } else {
        setHoleOptionState('18');
      }
    } catch (e) {
      console.log('[Step2Page1] Error loading selections:', e);
    }
  };

  const currentUser: SelectedPlayer | null = profile
    ? {
        id: profile.id,
        name: profile.display_name || profile.username,
        avatar_url: profile.avatar_url,
      }
    : null;

  const allSlots: (SelectedPlayer | null)[] = [
    currentUser,
    ...players.slice(0, 3),
    ...Array(Math.max(0, 3 - players.length)).fill(null),
  ].slice(0, 4);

  const handleOpenFriendsModal = () => {
    router.push('/modals/friends-modal');
  };

  const handleOpenCourseModal = () => {
    router.push('/modals/course-modal');
  };

  const handleRemovePlayer = async (playerId: string) => {
    const updated = players.filter((p) => p.id !== playerId);
    setPlayers(updated);
    await AsyncStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(updated));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.friendsSection}>
        <View style={styles.friendsHeader}>
          <Text style={styles.friendsHeaderText}>Grupp 1</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerRightText}>Starthål: 1</Text>
            <Text style={styles.headerRightText}>Starttid 12:40</Text>
          </View>
        </View>

        <View style={styles.slotsContainer}>
          {allSlots.map((player, index) => (
            <TouchableOpacity
              key={index}
              style={styles.slot}
              onPress={!player || index === 0 ? undefined : () => handleRemovePlayer(player.id)}
              activeOpacity={player ? 0.7 : 1}
              disabled={index === 0}
            >
              {player ? (
                <View style={styles.playerSlot}>
                  {player.avatar_url ? (
                    <Image source={{ uri: player.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {player.name}
                    </Text>
                    {player.hcp !== undefined && (
                      <Text style={styles.playerDetail}>PHCP: {player.hcp}</Text>
                    )}
                    {player.tee !== undefined && (
                      <Text style={styles.playerDetail}>Tee: {player.tee}</Text>
                    )}
                  </View>
                  {index !== 0 && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemovePlayer(player.id)}
                    >
                      <X size={14} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addSlot}
                  onPress={handleOpenFriendsModal}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addSlotText}>Lägg till spelare</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.courseSection}>
        <TouchableOpacity
          style={styles.courseBanner}
          onPress={handleOpenCourseModal}
          activeOpacity={0.8}
        >
          <View style={styles.courseBannerOverlay}>
            {selectedCourse ? (
              <Text style={styles.courseBannerName}>{selectedCourse.name}</Text>
            ) : (
              <View style={styles.courseSearchRow}>
                <Search size={18} color="#FFFFFF" />
                <Text style={styles.courseSearchText}>Sök banor</Text>
              </View>
            )}
            <View style={styles.courseArrowCircle}>
              <ChevronRight size={22} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.holeSelector}>
          <CourseBuild selected={holeOption} onSelect={handleHoleOptionChange} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  friendsSection: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  friendsHeader: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  friendsHeaderText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerRightText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as const,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  slot: {
    width: '47%' as any,
    minHeight: 80,
  },
  playerSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minHeight: 80,
    position: 'relative' as const,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  playerInfo: {
    marginLeft: 8,
    flex: 1,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  playerDetail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500' as const,
  },
  removeBtn: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlot: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  addSlotText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  courseSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  courseBanner: {
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  courseBannerOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  courseBannerName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  courseSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    flex: 1,
    marginRight: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  courseSearchText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  courseArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holeSelector: {
    marginTop: 0,
  },
});
