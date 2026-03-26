import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Trash2, X, Search, MapPin, Star, ChevronRight, Navigation } from 'lucide-react-native';
import { CircleCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useProfile, CrewDrill, CrewRound, CrewTournament } from '@/contexts/ProfileContext';
import TabCourse, { CourseTab } from '@/components/PlaSta/TabCourse';
import {
  searchGolfCourses,
  getGolfCourseDetail,
  searchNearbyCourses,
  getDistanceKm,
} from '@/services/golfCourseApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScreenWidth } from '@/utils/responsive';

const STORAGE_KEY_FAVORITES = 'play_setup_favorite_courses';

interface DisplayCourse {
  id: string;
  apiId: number;
  name: string;
  clubName: string;
  city: string;
  country: string;
  holes: number;
  par: number;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

const SCREEN_WIDTH = getScreenWidth();

const SEGMENT_KEYS = ['Drill', 'Round', 'Tournament'] as const;
type _CreateSegment = typeof SEGMENT_KEYS[number];

const CATEGORIES = [
  { label: 'Putting', color: '#2D6A4F' },
  { label: 'Wedges', color: '#E76F51' },
  { label: 'Irons', color: '#7B2CBF' },
  { label: 'Woods', color: '#40916C' },
];

const ROUNDS_OPTIONS = [1, 2, 3, 4, 5];
const SHOTS_OPTIONS = [5, 7, 10, 12, 15, 20];

interface CrewCreateScreenProps {
  onClose: () => void;
}

type HoleOption = '18' | '9_first' | '9_back';

const HOLE_OPTIONS: { key: HoleOption; title: string; subtitle: string }[] = [
  { key: '18', title: '18 holes', subtitle: 'Full round' },
  { key: '9_first', title: 'First 9', subtitle: 'Holes 1-9' },
  { key: '9_back', title: 'Back 9', subtitle: 'Holes 10-18' },
];

export default function CrewCreateScreen({ onClose }: CrewCreateScreenProps) {
  const insets = useSafeAreaInsets();
  const { crewColor, saveCrewDrill, saveCrewRound, saveCrewTournament, crewPlayers, crewManagers, allUsers } = useProfile();
  const bgColor = crewColor || '#FFFFFF';
  const isDark = bgColor !== '#FFFFFF';
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const [drillName, setDrillName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Putting');
  const [selectedRounds, setSelectedRounds] = useState<number>(3);
  const [selectedShots, setSelectedShots] = useState<number>(10);
  const [acceptedDistances, setAcceptedDistances] = useState<string[]>(['', '', '']);
  const [drillInfo, setDrillInfo] = useState<string>('');

  const [roundName, setRoundName] = useState<string>('');
  const [roundGroups, setRoundGroups] = useState<{ id: string; players: (string | null)[] }[]>([
    { id: '1', players: [null, null, null, null] },
  ]);
  const [roundCourseName, setRoundCourseName] = useState<string>('');
  const [roundCourseClubName, setRoundCourseClubName] = useState<string>('');
  const [roundCourseCity, setRoundCourseCity] = useState<string>('');
  const [roundCourseCountry, setRoundCourseCountry] = useState<string>('');
  const [roundHoleOption, setRoundHoleOption] = useState<HoleOption>('18');
  const [roundInfo, setRoundInfo] = useState<string>('');
  const [deleteGroupMode, setDeleteGroupMode] = useState<boolean>(false);
  const [selectedGroupsToDelete, setSelectedGroupsToDelete] = useState<string[]>([]);
  const [playerPickerVisible, setPlayerPickerVisible] = useState<boolean>(false);
  const [playerPickerTarget, setPlayerPickerTarget] = useState<{ groupId: string; slotIndex: number } | null>(null);
  const [playerPickerSource, setPlayerPickerSource] = useState<'round' | 'tournament'>('round');

  const [tournamentName, setTournamentName] = useState<string>('');
  const [tournamentInfo, setTournamentInfo] = useState<string>('');
  const [tournamentCourseName, setTournamentCourseName] = useState<string>('');
  const [tournamentCourseClubName, setTournamentCourseClubName] = useState<string>('');
  const [tournamentCourseCity, setTournamentCourseCity] = useState<string>('');
  const [tournamentCourseCountry, setTournamentCourseCountry] = useState<string>('');
  const [tournamentHoleOption, setTournamentHoleOption] = useState<HoleOption>('18');
  const [tournamentFormat, setTournamentFormat] = useState<string>('');
  const [tournamentTotalRounds, setTournamentTotalRounds] = useState<number>(1);
  const [tournamentGroups, setTournamentGroups] = useState<{ id: string; players: (string | null)[] }[]>([
    { id: '1', players: [null, null, null, null] },
  ]);
  const [tournamentDeleteGroupMode, setTournamentDeleteGroupMode] = useState<boolean>(false);
  const [tournamentSelectedGroupsToDelete, setTournamentSelectedGroupsToDelete] = useState<string[]>([]);
  const [formatPickerVisible, setFormatPickerVisible] = useState<boolean>(false);

  const [courseModalVisible, setCourseModalVisible] = useState<boolean>(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('');
  const [courseActiveTab, setCourseActiveTab] = useState<CourseTab>('nearby');
  const [courseFavorites, setCourseFavorites] = useState<string[]>([]);
  const [courseNearbyCourses, setCourseNearbyCourses] = useState<DisplayCourse[]>([]);
  const [courseSearchResults, setCourseSearchResults] = useState<DisplayCourse[]>([]);
  const [courseIsSearching, setCourseIsSearching] = useState<boolean>(false);
  const [courseIsSelecting, setCourseIsSelecting] = useState<boolean>(false);
  const [courseHasSearched, setCourseHasSearched] = useState<boolean>(false);
  const [courseNearbyLoading, setCourseNearbyLoading] = useState<boolean>(true);
  const [courseUserLocation, setCourseUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [courseNearbyLoaded, setCourseNearbyLoaded] = useState<boolean>(false);
  const [courseShowMap, setCourseShowMap] = useState<boolean>(false);
  const courseMapRef = useRef<any>(null);

  const segmentWidth = (SCREEN_WIDTH - 40 - 48) / SEGMENT_KEYS.length;
  const underlineWidth = 40;

  const underlineTranslateX = underlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      48 + (segmentWidth - underlineWidth) / 2,
      48 + segmentWidth + (segmentWidth - underlineWidth) / 2,
      48 + segmentWidth * 2 + (segmentWidth - underlineWidth) / 2,
    ],
  });

  const handleSegmentChange = useCallback((index: number) => {
    setActiveSegment(index);
    Animated.spring(underlineAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [underlineAnim]);

  const handleRoundsChange = useCallback((rounds: number) => {
    setSelectedRounds(rounds);
    setAcceptedDistances((prev) => {
      const updated = [...prev];
      while (updated.length < rounds) updated.push('');
      return updated.slice(0, rounds);
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDistanceChange = useCallback((index: number, value: string) => {
    setAcceptedDistances((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const totalShots = selectedRounds * selectedShots;

  const crewMemberIds = [...crewPlayers, ...crewManagers];
  const crewMemberProfiles = allUsers.filter((u) => crewMemberIds.includes(u.id));

  const handleAddGroup = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newId = (roundGroups.length + 1).toString() + '_' + Date.now();
    setRoundGroups((prev) => [...prev, { id: newId, players: [null, null, null, null] }]);
  }, [roundGroups.length]);

  const handleAddTournamentGroup = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newId = (tournamentGroups.length + 1).toString() + '_' + Date.now();
    setTournamentGroups((prev) => [...prev, { id: newId, players: [null, null, null, null] }]);
  }, [tournamentGroups.length]);

  const handleToggleDeleteGroup = useCallback((groupId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGroupsToDelete((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  const handleConfirmDeleteGroups = useCallback(() => {
    if (selectedGroupsToDelete.length === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRoundGroups((prev) => {
      const filtered = prev.filter((g) => !selectedGroupsToDelete.includes(g.id));
      return filtered.length === 0 ? [{ id: '1', players: [null, null, null, null] }] : filtered;
    });
    setSelectedGroupsToDelete([]);
    setDeleteGroupMode(false);
  }, [selectedGroupsToDelete]);

  const handleToggleTournamentDeleteGroup = useCallback((groupId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTournamentSelectedGroupsToDelete((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  const handleConfirmTournamentDeleteGroups = useCallback(() => {
    if (tournamentSelectedGroupsToDelete.length === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTournamentGroups((prev) => {
      const filtered = prev.filter((g) => !tournamentSelectedGroupsToDelete.includes(g.id));
      return filtered.length === 0 ? [{ id: '1', players: [null, null, null, null] }] : filtered;
    });
    setTournamentSelectedGroupsToDelete([]);
    setTournamentDeleteGroupMode(false);
  }, [tournamentSelectedGroupsToDelete]);

  const handleOpenPlayerPicker = useCallback((groupId: string, slotIndex: number, source: 'round' | 'tournament' = 'round') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerPickerTarget({ groupId, slotIndex });
    setPlayerPickerSource(source);
    setPlayerPickerVisible(true);
  }, []);

  const handleSelectPlayer = useCallback((playerId: string) => {
    if (!playerPickerTarget) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (playerPickerSource === 'tournament') {
      setTournamentGroups((prev) =>
        prev.map((g) => {
          if (g.id !== playerPickerTarget.groupId) return g;
          const updated = [...g.players];
          updated[playerPickerTarget.slotIndex] = playerId;
          return { ...g, players: updated };
        })
      );
    } else {
      setRoundGroups((prev) =>
        prev.map((g) => {
          if (g.id !== playerPickerTarget.groupId) return g;
          const updated = [...g.players];
          updated[playerPickerTarget.slotIndex] = playerId;
          return { ...g, players: updated };
        })
      );
    }
    setPlayerPickerVisible(false);
    setPlayerPickerTarget(null);
  }, [playerPickerTarget, playerPickerSource]);

  const handleRemovePlayerFromSlot = useCallback((groupId: string, slotIndex: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoundGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const updated = [...g.players];
        updated[slotIndex] = null;
        return { ...g, players: updated };
      })
    );
  }, []);

  const handleRemoveTournamentPlayerFromSlot = useCallback((groupId: string, slotIndex: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTournamentGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const updated = [...g.players];
        updated[slotIndex] = null;
        return { ...g, players: updated };
      })
    );
  }, []);

  const handleSaveRound = useCallback(async () => {
    if (!roundName.trim()) {
      Alert.alert('Missing Name', 'Please enter a round name.');
      return;
    }
    if (!roundCourseName.trim()) {
      Alert.alert('Select a Course', 'Please select a course before saving the round.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const round: CrewRound = {
      id: Date.now().toString(),
      name: roundName.trim(),
      groups: roundGroups.map((g, idx) => ({
        id: (idx + 1).toString(),
        players: g.players.filter((p): p is string => p !== null),
      })),
      courseName: roundCourseName.trim(),
      courseClubName: roundCourseClubName.trim(),
      courseCity: roundCourseCity.trim(),
      courseCountry: roundCourseCountry.trim(),
      holeOption: roundHoleOption,
      info: roundInfo.trim(),
      createdAt: Date.now(),
    };
    try {
      await saveCrewRound(round);
      console.log('[CrewCreate] Round saved:', round.name);
      onClose();
    } catch (err: any) {
      console.log('[CrewCreate] Save round error:', err.message);
      Alert.alert('Error', 'Failed to save round.');
    }
  }, [roundName, roundGroups, roundCourseName, roundCourseClubName, roundCourseCity, roundCourseCountry, roundHoleOption, roundInfo, saveCrewRound, onClose]);

  const getPlayerName = useCallback((playerId: string) => {
    const user = allUsers.find((u) => u.id === playerId);
    return user?.display_name || user?.username || 'Unknown';
  }, [allUsers]);

  const getPlayerAvatar = useCallback((playerId: string) => {
    const user = allUsers.find((u) => u.id === playerId);
    return user?.avatar_url || null;
  }, [allUsers]);

  const allAssignedPlayers = playerPickerSource === 'tournament'
    ? tournamentGroups.flatMap((g) => g.players.filter((p): p is string => p !== null))
    : roundGroups.flatMap((g) => g.players.filter((p): p is string => p !== null));

  const loadCourseFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
      if (stored) setCourseFavorites(JSON.parse(stored));
    } catch (e) {
      console.log('[CrewCreate] Error loading favorites:', e);
    }
  }, []);

  const loadNearbyCourses = useCallback(async () => {
    setCourseNearbyLoading(true);
    try {
      let lat = 0;
      let lon = 0;
      if (Platform.OS !== 'web') {
        const Loc = require('expo-location');
        const { status } = await Loc.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Loc.getCurrentPositionAsync({ accuracy: Loc.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      }
      if (lat !== 0 && lon !== 0) {
        console.log('[CrewCreate] User location:', lat, lon);
        setCourseUserLocation({ lat, lon });
        const results = await searchNearbyCourses(lat, lon);
        const mapped: DisplayCourse[] = results.map((r) => {
          const distKm = getDistanceKm(lat, lon, r.location?.latitude ?? 0, r.location?.longitude ?? 0);
          return {
            id: `api-${r.id}`,
            apiId: r.id,
            name: r.course_name,
            clubName: r.club_name,
            city: r.location?.city ?? '',
            country: r.location?.country ?? '',
            holes: 18,
            par: 72,
            latitude: r.location?.latitude,
            longitude: r.location?.longitude,
            distanceKm: distKm,
          };
        });
        setCourseNearbyCourses(mapped);
        console.log('[CrewCreate] Nearby courses loaded:', mapped.length);
      }
    } catch (e) {
      console.log('[CrewCreate] Error loading nearby:', e);
    } finally {
      setCourseNearbyLoading(false);
    }
  }, []);

  const handleOpenCourseModal = useCallback((target: 'round' | 'tournament' = 'round') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCourseSelectTarget(target);
    setCourseModalVisible(true);
    if (!courseNearbyLoaded) {
      void loadCourseFavorites();
      void loadNearbyCourses();
      setCourseNearbyLoaded(true);
    }
  }, [courseNearbyLoaded, loadCourseFavorites, loadNearbyCourses]);

  const handleCourseSearch = useCallback(async () => {
    if (!courseSearchQuery.trim()) return;
    setCourseIsSearching(true);
    setCourseHasSearched(true);
    try {
      const results = await searchGolfCourses(courseSearchQuery.trim());
      const mapped: DisplayCourse[] = results.map((r) => {
        const distKm = courseUserLocation
          ? getDistanceKm(courseUserLocation.lat, courseUserLocation.lon, r.location?.latitude ?? 0, r.location?.longitude ?? 0)
          : undefined;
        return {
          id: `api-${r.id}`,
          apiId: r.id,
          name: r.course_name,
          clubName: r.club_name,
          city: r.location?.city ?? '',
          country: r.location?.country ?? '',
          holes: 18,
          par: 72,
          latitude: r.location?.latitude,
          longitude: r.location?.longitude,
          distanceKm: distKm,
        };
      });
      setCourseSearchResults(mapped);
      console.log('[CrewCreate] Course search found:', mapped.length);
    } catch (e) {
      console.log('[CrewCreate] Course search error:', e);
    } finally {
      setCourseIsSearching(false);
    }
  }, [courseSearchQuery, courseUserLocation]);

  const [courseSelectTarget, setCourseSelectTarget] = useState<'round' | 'tournament'>('round');

  const handleSelectCourse = useCallback(async (course: DisplayCourse) => {
    setCourseIsSelecting(true);
    try {
      const detail = await getGolfCourseDetail(course.apiId);
      const cName = detail ? detail.course_name : course.name;
      const cClub = detail ? detail.club_name : course.clubName;
      const cCity = detail ? (detail.location?.city ?? '') : course.city;
      const cCountry = detail ? (detail.location?.country ?? '') : course.country;
      if (courseSelectTarget === 'tournament') {
        setTournamentCourseName(cName);
        setTournamentCourseClubName(cClub);
        setTournamentCourseCity(cCity);
        setTournamentCourseCountry(cCountry);
      } else {
        setRoundCourseName(cName);
        setRoundCourseClubName(cClub);
        setRoundCourseCity(cCity);
        setRoundCourseCountry(cCountry);
      }
      console.log('[CrewCreate] Selected course:', cName);
    } catch (e) {
      console.log('[CrewCreate] Course select error:', e);
      if (courseSelectTarget === 'tournament') {
        setTournamentCourseName(course.name);
        setTournamentCourseClubName(course.clubName);
        setTournamentCourseCity(course.city);
        setTournamentCourseCountry(course.country);
      } else {
        setRoundCourseName(course.name);
        setRoundCourseClubName(course.clubName);
        setRoundCourseCity(course.city);
        setRoundCourseCountry(course.country);
      }
    } finally {
      setCourseIsSelecting(false);
      setCourseModalVisible(false);
    }
  }, [courseSelectTarget]);

  const toggleCourseFavorite = useCallback(async (courseId: string) => {
    setCourseFavorites((prev) => {
      const updated = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const displayCourses = useMemo(() => {
    if (courseActiveTab === 'favorite') {
      const allCourses = [...courseNearbyCourses, ...courseSearchResults];
      const unique = allCourses.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
      return unique.filter((c) => courseFavorites.includes(c.id));
    }
    if (courseHasSearched && courseSearchResults.length > 0) {
      return courseSearchResults;
    }
    return courseNearbyCourses;
  }, [courseActiveTab, courseNearbyCourses, courseSearchResults, courseFavorites, courseHasSearched]);

  const handleSaveDrill = useCallback(async () => {
    if (!drillName.trim()) {
      Alert.alert('Missing Name', 'Please enter a drill name.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const drill: CrewDrill = {
      id: Date.now().toString(),
      name: drillName.trim(),
      category: selectedCategory,
      rounds: selectedRounds,
      shotsPerRound: selectedShots,
      totalShots,
      acceptedDistances: acceptedDistances.map((d) => parseFloat(d) || 0),
      info: drillInfo.trim(),
      createdAt: Date.now(),
    };
    try {
      await saveCrewDrill(drill);
      console.log('[CrewCreate] Drill saved:', drill.name);
      onClose();
    } catch (err: any) {
      console.log('[CrewCreate] Save drill error:', err.message);
      Alert.alert('Error', 'Failed to save drill.');
    }
  }, [drillName, selectedCategory, selectedRounds, selectedShots, totalShots, acceptedDistances, drillInfo, saveCrewDrill, onClose]);

  const renderDrillContent = () => {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>DRILL NAME</Text>
          <View style={[styles.inputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.textInput, isDark && { color: '#FFFFFF' }]}
              placeholder="e.g. Long Putts"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              value={drillName}
              onChangeText={setDrillName}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.chip,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.15)' },
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.label);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.chipText, isDark && { color: 'rgba(255,255,255,0.8)' }, isSelected && styles.chipTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>ROUNDS</Text>
          <View style={styles.optionRow}>
            {ROUNDS_OPTIONS.map((val) => {
              const isSelected = selectedRounds === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.optionChip,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.15)' },
                    isSelected && styles.optionChipSelected,
                  ]}
                  onPress={() => handleRoundsChange(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isDark && { color: 'rgba(255,255,255,0.8)' }, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SHOTS PER ROUND</Text>
          <View style={styles.optionRow}>
            {SHOTS_OPTIONS.map((val) => {
              const isSelected = selectedShots === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.optionChip,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.15)' },
                    isSelected && styles.optionChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedShots(val);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isDark && { color: 'rgba(255,255,255,0.8)' }, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>ACCEPTED DISTANCE</Text>
          {acceptedDistances.map((dist, idx) => (
            <View key={idx} style={styles.distanceRow}>
              <Text style={[styles.distanceLabel, isDark && { color: 'rgba(255,255,255,0.6)' }]}>Round {idx + 1}</Text>
              <View style={[styles.distanceInputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <TextInput
                  style={[styles.distanceInput, isDark && { color: '#FFFFFF' }]}
                  placeholder="0"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}
                  value={dist}
                  onChangeText={(val) => handleDistanceChange(idx, val)}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
                <Text style={[styles.distanceUnit, isDark && { color: 'rgba(255,255,255,0.4)' }]}>m</Text>
              </View>
            </View>
          ))}

          <View style={[styles.previewCard, isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}>
            <Text style={[styles.previewLabel, isDark && { color: 'rgba(255,255,255,0.5)' }]}>PREVIEW</Text>
            <Text style={[styles.previewText, isDark && { color: '#FFFFFF' }]}>
              {selectedRounds} rounds × {selectedShots} shots = {totalShots} total shots
            </Text>
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>INFO</Text>
          <View style={[styles.infoInputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.infoInput, isDark && { color: '#FFFFFF' }]}
              placeholder="Add description or instructions for this drill..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
              value={drillInfo}
              onChangeText={setDrillInfo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            onPress={handleSaveDrill}
            activeOpacity={0.8}
            disabled={!drillName.trim()}
            style={[styles.saveDrillBtnOuter, { opacity: drillName.trim() ? 1 : 0.5 }]}
          >
            <View style={[styles.saveDrillBtn, isDark && { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
              <Text style={styles.saveDrillBtnText}>Save Drill</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderRoundContent = () => {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }, { marginTop: 4 }]}>NAME</Text>
          <View style={[styles.inputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.textInput, isDark && { color: '#FFFFFF' }]}
              placeholder="e.g. Saturday Round"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              value={roundName}
              onChangeText={setRoundName}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT PLAYERS</Text>

          {roundGroups.map((group, groupIdx) => {
            const isSelectedForDelete = selectedGroupsToDelete.includes(group.id);
            return (
              <View
                key={group.id}
                style={[
                  styles.groupCard,
                  isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
                  deleteGroupMode && isSelectedForDelete && { borderColor: '#FF3B30', borderWidth: 2 },
                ]}
              >
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupHeaderText, isDark && { color: '#FFFFFF' }]}>Group {groupIdx + 1}</Text>
                  {deleteGroupMode && roundGroups.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleToggleDeleteGroup(group.id)}
                      style={[styles.groupDeleteCheck, isSelectedForDelete && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}
                    >
                      {isSelectedForDelete && <CircleCheck size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.groupSlots}>
                  {group.players.map((playerId, slotIdx) => (
                    <View key={slotIdx} style={styles.roundSlot}>
                      {playerId ? (
                        <View style={[styles.roundPlayerSlot, isDark && { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                          {getPlayerAvatar(playerId) ? (
                            <Image source={{ uri: getPlayerAvatar(playerId)! }} style={styles.roundAvatar} />
                          ) : (
                            <View style={styles.roundAvatarPlaceholder}>
                              <Text style={styles.roundAvatarInitial}>
                                {getPlayerName(playerId).charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={[styles.roundPlayerName, isDark && { color: '#FFFFFF' }]} numberOfLines={1}>
                            {getPlayerName(playerId)}
                          </Text>
                          <TouchableOpacity
                            style={styles.roundRemoveBtn}
                            onPress={() => handleRemovePlayerFromSlot(group.id, slotIdx)}
                          >
                            <X size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.roundAddSlot, isDark && { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)' }]}
                          onPress={() => handleOpenPlayerPicker(group.id, slotIdx)}
                          activeOpacity={0.7}
                        >
                          <Plus size={18} color={isDark ? '#FFFFFF' : '#999'} />
                          <Text style={[styles.roundAddSlotText, isDark && { color: 'rgba(255,255,255,0.6)' }]}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={styles.groupActions}>
            <TouchableOpacity
              style={[styles.groupActionBtn, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}
              onPress={handleAddGroup}
              activeOpacity={0.7}
            >
              <Plus size={20} color={isDark ? '#FFFFFF' : '#333'} />
            </TouchableOpacity>
            {roundGroups.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.groupActionBtn,
                  isDark && { backgroundColor: 'rgba(255,255,255,0.12)' },
                  deleteGroupMode && { backgroundColor: '#FF3B30' },
                ]}
                onPress={() => {
                  if (deleteGroupMode) {
                    handleConfirmDeleteGroups();
                  } else {
                    setDeleteGroupMode(true);
                    setSelectedGroupsToDelete([]);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                }}
                activeOpacity={0.7}
              >
                {deleteGroupMode ? (
                  <CircleCheck size={20} color="#FFFFFF" />
                ) : (
                  <Trash2 size={20} color={isDark ? '#FFFFFF' : '#333'} />
                )}
              </TouchableOpacity>
            )}
            {deleteGroupMode && (
              <TouchableOpacity
                style={[styles.groupActionBtn, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
                onPress={() => {
                  setDeleteGroupMode(false);
                  setSelectedGroupsToDelete([]);
                }}
                activeOpacity={0.7}
              >
                <X size={20} color={isDark ? '#FFFFFF' : '#333'} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT COURSE</Text>
          <TouchableOpacity
            style={[styles.roundCourseBanner, isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}
            onPress={roundCourseName ? undefined : () => handleOpenCourseModal('round')}
            activeOpacity={roundCourseName ? 1 : 0.8}
          >
            <View style={styles.roundCourseInner}>
              {roundCourseName ? (
                <View style={styles.roundCourseSelected}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roundCourseName, isDark && { color: '#FFFFFF' }]}>{roundCourseName}</Text>
                    {roundCourseClubName ? (
                      <Text style={[styles.roundCourseClub, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{roundCourseClubName}</Text>
                    ) : null}
                    {(roundCourseCity || roundCourseCountry) ? (
                      <Text style={[styles.roundCourseLocation, isDark && { color: 'rgba(255,255,255,0.4)' }]}>
                        {[roundCourseCity, roundCourseCountry].filter(Boolean).join(', ')}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => {
                    setRoundCourseName('');
                    setRoundCourseClubName('');
                    setRoundCourseCity('');
                    setRoundCourseCountry('');
                  }}>
                    <X size={18} color={isDark ? 'rgba(255,255,255,0.5)' : '#999'} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.roundCourseSearchRow}>
                  <Search size={18} color={isDark ? 'rgba(255,255,255,0.5)' : '#999'} />
                  <Text style={[styles.roundCourseSearchText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>Sök banor</Text>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.roundCourseArrow, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                    <ChevronRight size={18} color={isDark ? '#FFFFFF' : '#999'} />
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT HOLES</Text>
          <View style={styles.holeOptionsContainer}>
            {HOLE_OPTIONS.map((opt) => {
              const isActive = roundHoleOption === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.holeOptionCard,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
                    isActive && styles.holeOptionCardActive,
                    isActive && isDark && { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)' },
                  ]}
                  onPress={() => {
                    setRoundHoleOption(opt.key);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.holeOptionContent}>
                    <Text style={[
                      styles.holeOptionTitle,
                      isDark && { color: '#FFFFFF' },
                    ]}>
                      {opt.title}
                    </Text>
                    <Text style={[
                      styles.holeOptionSubtitle,
                      isDark && { color: 'rgba(255,255,255,0.5)' },
                    ]}>
                      {opt.subtitle}
                    </Text>
                  </View>
                  {isActive && <CircleCheck size={22} color={isDark ? '#FFFFFF' : '#2E7D32'} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>INFO</Text>
          <View style={[styles.infoInputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.infoInput, isDark && { color: '#FFFFFF' }]}
              placeholder="Add details about this round..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
              value={roundInfo}
              onChangeText={setRoundInfo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            onPress={handleSaveRound}
            activeOpacity={0.8}
            disabled={!roundName.trim()}
            style={[styles.saveDrillBtnOuter, { opacity: roundName.trim() ? 1 : 0.5 }]}
          >
            <View style={[styles.saveDrillBtn, isDark && { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
              <Text style={styles.saveDrillBtnText}>Save Round</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={playerPickerVisible && playerPickerSource === 'round'}
          transparent
          animationType="slide"
          onRequestClose={() => setPlayerPickerVisible(false)}
        >
          <View style={styles.playerPickerOverlay}>
            <View style={[styles.playerPickerCard, { backgroundColor: isDark ? bgColor : '#FFFFFF' }]}>
              <View style={styles.playerPickerHeader}>
                <Text style={[styles.playerPickerTitle, isDark && { color: '#FFFFFF' }]}>Select Player</Text>
                <TouchableOpacity onPress={() => setPlayerPickerVisible(false)}>
                  <X size={22} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.playerPickerList} showsVerticalScrollIndicator={false}>
                {crewMemberProfiles.length === 0 ? (
                  <View style={styles.playerPickerEmpty}>
                    <Text style={[styles.playerPickerEmptyText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                      No crew members added yet. Add players in Crew Settings.
                    </Text>
                  </View>
                ) : (
                  crewMemberProfiles.map((user) => {
                    const isAlreadyAssigned = allAssignedPlayers.includes(user.id);
                    return (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.playerPickerItem,
                          isDark && { backgroundColor: 'rgba(255,255,255,0.08)' },
                          isAlreadyAssigned && { opacity: 0.4 },
                        ]}
                        onPress={() => !isAlreadyAssigned && handleSelectPlayer(user.id)}
                        activeOpacity={isAlreadyAssigned ? 1 : 0.7}
                        disabled={isAlreadyAssigned}
                      >
                        {user.avatar_url ? (
                          <Image source={{ uri: user.avatar_url }} style={styles.playerPickerAvatar} />
                        ) : (
                          <View style={styles.playerPickerAvatarPlaceholder}>
                            <Text style={styles.playerPickerAvatarInitial}>
                              {(user.display_name || user.username).charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.playerPickerName, isDark && { color: '#FFFFFF' }]}>
                          {user.display_name || user.username}
                        </Text>
                        {isAlreadyAssigned && (
                          <Text style={[styles.playerPickerAssigned, isDark && { color: 'rgba(255,255,255,0.3)' }]}>Assigned</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  };

  const PLAYING_FORMATS = [
    { key: 'stroke_play', label: 'Stroke Play', desc: 'Lowest total strokes wins' },
    { key: 'match_play', label: 'Match Play', desc: 'Win individual holes' },
    { key: 'stableford', label: 'Stableford', desc: 'Points based on score per hole' },
    { key: 'best_ball', label: 'Best Ball / Four Ball', desc: 'Best score in team counts' },
    { key: 'scramble', label: 'Scramble', desc: 'All play from best shot' },
    { key: 'chapman', label: 'Chapman / Pinehurst', desc: 'Alternate shot format' },
    { key: 'greensome', label: 'Greensome', desc: 'Both drive, choose best, alternate' },
    { key: 'skins', label: 'Skins', desc: 'Win value for each hole' },
  ];

  const tournamentAllAssignedPlayers = tournamentGroups.flatMap((g) => g.players.filter((p): p is string => p !== null));

  const handleSaveTournament = useCallback(async () => {
    if (!tournamentName.trim()) {
      Alert.alert('Missing Name', 'Please enter a tournament name.');
      return;
    }
    if (!tournamentCourseName.trim()) {
      Alert.alert('Select a Course', 'Please select a course before saving the tournament.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const tournament: CrewTournament = {
      id: Date.now().toString(),
      name: tournamentName.trim(),
      info: tournamentInfo.trim(),
      courseName: tournamentCourseName.trim(),
      courseClubName: tournamentCourseClubName.trim(),
      courseCity: tournamentCourseCity.trim(),
      courseCountry: tournamentCourseCountry.trim(),
      holeOption: tournamentHoleOption,
      format: tournamentFormat,
      totalRounds: tournamentTotalRounds,
      groups: tournamentGroups.map((g, idx) => ({
        id: (idx + 1).toString(),
        players: g.players.filter((p): p is string => p !== null),
      })),
      createdAt: Date.now(),
    };
    try {
      await saveCrewTournament(tournament);
      console.log('[CrewCreate] Tournament saved:', tournament.name);
      onClose();
    } catch (err: any) {
      console.log('[CrewCreate] Save tournament error:', err.message);
      Alert.alert('Error', 'Failed to save tournament.');
    }
  }, [tournamentName, tournamentInfo, tournamentCourseName, tournamentCourseClubName, tournamentCourseCity, tournamentCourseCountry, tournamentHoleOption, tournamentFormat, tournamentTotalRounds, tournamentGroups, saveCrewTournament, onClose]);

  const renderTournamentContent = () => {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }, { marginTop: 4 }]}>NAME</Text>
          <View style={[styles.inputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.textInput, isDark && { color: '#FFFFFF' }]}
              placeholder="e.g. Summer Championship"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              value={tournamentName}
              onChangeText={setTournamentName}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>INFORMATION</Text>
          <View style={[styles.infoInputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.infoInput, isDark && { color: '#FFFFFF' }]}
              placeholder="Add details about this tournament..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
              value={tournamentInfo}
              onChangeText={setTournamentInfo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>TOTAL ROUNDS</Text>
          <View style={styles.totalRoundsRow}>
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const isSelected = num <= tournamentTotalRounds;
              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.totalRoundCircle,
                    isSelected && styles.totalRoundCircleSelected,
                  ]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (num === tournamentTotalRounds) {
                      setTournamentTotalRounds(Math.max(1, num - 1));
                    } else {
                      setTournamentTotalRounds(num);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.totalRoundText,
                    isSelected && styles.totalRoundTextSelected,
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT COURSE</Text>
          <TouchableOpacity
            style={[styles.roundCourseBanner, isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}
            onPress={tournamentCourseName ? undefined : () => handleOpenCourseModal('tournament')}
            activeOpacity={tournamentCourseName ? 1 : 0.8}
          >
            <View style={styles.roundCourseInner}>
              {tournamentCourseName ? (
                <View style={styles.roundCourseSelected}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roundCourseName, isDark && { color: '#FFFFFF' }]}>{tournamentCourseName}</Text>
                    {tournamentCourseClubName ? (
                      <Text style={[styles.roundCourseClub, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{tournamentCourseClubName}</Text>
                    ) : null}
                    {(tournamentCourseCity || tournamentCourseCountry) ? (
                      <Text style={[styles.roundCourseLocation, isDark && { color: 'rgba(255,255,255,0.4)' }]}>
                        {[tournamentCourseCity, tournamentCourseCountry].filter(Boolean).join(', ')}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => {
                    setTournamentCourseName('');
                    setTournamentCourseClubName('');
                    setTournamentCourseCity('');
                    setTournamentCourseCountry('');
                  }}>
                    <X size={18} color={isDark ? 'rgba(255,255,255,0.5)' : '#999'} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.roundCourseSearchRow}>
                  <Search size={18} color={isDark ? 'rgba(255,255,255,0.5)' : '#999'} />
                  <Text style={[styles.roundCourseSearchText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>Sök banor</Text>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.roundCourseArrow, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                    <ChevronRight size={18} color={isDark ? '#FFFFFF' : '#999'} />
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT HOLES</Text>
          <View style={styles.holeOptionsContainer}>
            {HOLE_OPTIONS.map((opt) => {
              const isActive = tournamentHoleOption === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.holeOptionCard,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
                    isActive && styles.holeOptionCardActive,
                    isActive && isDark && { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)' },
                  ]}
                  onPress={() => {
                    setTournamentHoleOption(opt.key);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.holeOptionContent}>
                    <Text style={[styles.holeOptionTitle, isDark && { color: '#FFFFFF' }]}>{opt.title}</Text>
                    <Text style={[styles.holeOptionSubtitle, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{opt.subtitle}</Text>
                  </View>
                  {isActive && <CircleCheck size={22} color={isDark ? '#FFFFFF' : '#2E7D32'} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>FORMAT</Text>
          <TouchableOpacity
            style={[styles.roundCourseBanner, isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFormatPickerVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.roundCourseInner}>
              {tournamentFormat ? (
                <View style={styles.roundCourseSelected}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roundCourseName, isDark && { color: '#FFFFFF' }]}>{tournamentFormat}</Text>
                    <Text style={[styles.roundCourseClub, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                      {PLAYING_FORMATS.find((f) => f.label === tournamentFormat)?.desc ?? ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setTournamentFormat('')}>
                    <X size={18} color={isDark ? 'rgba(255,255,255,0.5)' : '#999'} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.roundCourseSearchRow}>
                  <Text style={{ fontSize: 18 }}>🏆</Text>
                  <Text style={[styles.roundCourseSearchText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>Select Playing Format</Text>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.roundCourseArrow, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                    <ChevronRight size={18} color={isDark ? '#FFFFFF' : '#999'} />
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT GROUPS AND PLAYERS</Text>

          {tournamentGroups.map((group, groupIdx) => {
            const isSelectedForDelete = tournamentSelectedGroupsToDelete.includes(group.id);
            return (
              <View
                key={group.id}
                style={[
                  styles.groupCard,
                  isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
                  tournamentDeleteGroupMode && isSelectedForDelete && { borderColor: '#FF3B30', borderWidth: 2 },
                ]}
              >
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupHeaderText, isDark && { color: '#FFFFFF' }]}>Group {groupIdx + 1}</Text>
                  {tournamentDeleteGroupMode && tournamentGroups.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleToggleTournamentDeleteGroup(group.id)}
                      style={[styles.groupDeleteCheck, isSelectedForDelete && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}
                    >
                      {isSelectedForDelete && <CircleCheck size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.groupSlots}>
                  {group.players.map((playerId, slotIdx) => (
                    <View key={slotIdx} style={styles.roundSlot}>
                      {playerId ? (
                        <View style={[styles.roundPlayerSlot, isDark && { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                          {getPlayerAvatar(playerId) ? (
                            <Image source={{ uri: getPlayerAvatar(playerId)! }} style={styles.roundAvatar} />
                          ) : (
                            <View style={styles.roundAvatarPlaceholder}>
                              <Text style={styles.roundAvatarInitial}>
                                {getPlayerName(playerId).charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={[styles.roundPlayerName, isDark && { color: '#FFFFFF' }]} numberOfLines={1}>
                            {getPlayerName(playerId)}
                          </Text>
                          <TouchableOpacity
                            style={styles.roundRemoveBtn}
                            onPress={() => handleRemoveTournamentPlayerFromSlot(group.id, slotIdx)}
                          >
                            <X size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.roundAddSlot, isDark && { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)' }]}
                          onPress={() => handleOpenPlayerPicker(group.id, slotIdx, 'tournament')}
                          activeOpacity={0.7}
                        >
                          <Plus size={18} color={isDark ? '#FFFFFF' : '#999'} />
                          <Text style={[styles.roundAddSlotText, isDark && { color: 'rgba(255,255,255,0.6)' }]}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={styles.groupActions}>
            <TouchableOpacity
              style={[styles.groupActionBtn, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}
              onPress={handleAddTournamentGroup}
              activeOpacity={0.7}
            >
              <Plus size={20} color={isDark ? '#FFFFFF' : '#333'} />
            </TouchableOpacity>
            {tournamentGroups.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.groupActionBtn,
                  isDark && { backgroundColor: 'rgba(255,255,255,0.12)' },
                  tournamentDeleteGroupMode && { backgroundColor: '#FF3B30' },
                ]}
                onPress={() => {
                  if (tournamentDeleteGroupMode) {
                    handleConfirmTournamentDeleteGroups();
                  } else {
                    setTournamentDeleteGroupMode(true);
                    setTournamentSelectedGroupsToDelete([]);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                }}
                activeOpacity={0.7}
              >
                {tournamentDeleteGroupMode ? (
                  <CircleCheck size={20} color="#FFFFFF" />
                ) : (
                  <Trash2 size={20} color={isDark ? '#FFFFFF' : '#333'} />
                )}
              </TouchableOpacity>
            )}
            {tournamentDeleteGroupMode && (
              <TouchableOpacity
                style={[styles.groupActionBtn, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
                onPress={() => {
                  setTournamentDeleteGroupMode(false);
                  setTournamentSelectedGroupsToDelete([]);
                }}
                activeOpacity={0.7}
              >
                <X size={20} color={isDark ? '#FFFFFF' : '#333'} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSaveTournament}
            activeOpacity={0.8}
            disabled={!tournamentName.trim()}
            style={[styles.saveDrillBtnOuter, { opacity: tournamentName.trim() ? 1 : 0.5 }]}
          >
            <View style={[styles.saveDrillBtn, isDark && { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
              <Text style={styles.saveDrillBtnText}>Save Tournament</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={formatPickerVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setFormatPickerVisible(false)}
        >
          <View style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={[styles.headerArea, { paddingTop: insets.top + 10, backgroundColor: bgColor }]}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFormatPickerVisible(false);
                  }}
                  style={styles.glassBackBtn}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={[styles.formatPickerTitle, isDark && { color: '#FFFFFF' }]}>Playing Format</Text>
                <View style={{ width: 40 }} />
              </View>
              <View style={[styles.segmentDivider, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            </View>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {PLAYING_FORMATS.map((fmt) => {
                const isActive = tournamentFormat === fmt.label;
                return (
                  <TouchableOpacity
                    key={fmt.key}
                    style={[
                      styles.formatCard,
                      isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
                      isActive && styles.formatCardActive,
                      isActive && isDark && { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)' },
                    ]}
                    onPress={() => {
                      setTournamentFormat(fmt.label);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setTimeout(() => setFormatPickerVisible(false), 200);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.holeOptionContent}>
                      <Text style={[styles.holeOptionTitle, isDark && { color: '#FFFFFF' }]}>{fmt.label}</Text>
                      <Text style={[styles.holeOptionSubtitle, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{fmt.desc}</Text>
                    </View>
                    {isActive && <CircleCheck size={22} color={isDark ? '#FFFFFF' : '#2E7D32'} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>

        <Modal
          visible={playerPickerVisible && playerPickerSource === 'tournament'}
          transparent
          animationType="slide"
          onRequestClose={() => setPlayerPickerVisible(false)}
        >
          <View style={styles.playerPickerOverlay}>
            <View style={[styles.playerPickerCard, { backgroundColor: isDark ? bgColor : '#FFFFFF' }]}>
              <View style={styles.playerPickerHeader}>
                <Text style={[styles.playerPickerTitle, isDark && { color: '#FFFFFF' }]}>Select Player</Text>
                <TouchableOpacity onPress={() => setPlayerPickerVisible(false)}>
                  <X size={22} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.playerPickerList} showsVerticalScrollIndicator={false}>
                {crewMemberProfiles.length === 0 ? (
                  <View style={styles.playerPickerEmpty}>
                    <Text style={[styles.playerPickerEmptyText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                      No crew members added yet. Add players in Crew Settings.
                    </Text>
                  </View>
                ) : (
                  crewMemberProfiles.map((user) => {
                    const isAlreadyAssigned = tournamentAllAssignedPlayers.includes(user.id);
                    return (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.playerPickerItem,
                          isDark && { backgroundColor: 'rgba(255,255,255,0.08)' },
                          isAlreadyAssigned && { opacity: 0.4 },
                        ]}
                        onPress={() => !isAlreadyAssigned && handleSelectPlayer(user.id)}
                        activeOpacity={isAlreadyAssigned ? 1 : 0.7}
                        disabled={isAlreadyAssigned}
                      >
                        {user.avatar_url ? (
                          <Image source={{ uri: user.avatar_url }} style={styles.playerPickerAvatar} />
                        ) : (
                          <View style={styles.playerPickerAvatarPlaceholder}>
                            <Text style={styles.playerPickerAvatarInitial}>
                              {(user.display_name || user.username).charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.playerPickerName, isDark && { color: '#FFFFFF' }]}>
                          {user.display_name || user.username}
                        </Text>
                        {isAlreadyAssigned && (
                          <Text style={[styles.playerPickerAssigned, isDark && { color: 'rgba(255,255,255,0.3)' }]}>Assigned</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  };



  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.headerArea, { paddingTop: insets.top + 10, backgroundColor: bgColor }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={styles.glassBackBtn}
            activeOpacity={0.7}
            testID="crew-create-back"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.segmentRow}>
            {SEGMENT_KEYS.map((seg, idx) => (
              <TouchableOpacity
                key={seg}
                style={[styles.segmentBtn, { width: segmentWidth }]}
                onPress={() => handleSegmentChange(idx)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.segmentText,
                  isDark && { color: 'rgba(255,255,255,0.5)' },
                  activeSegment === idx && styles.segmentTextActive,
                  activeSegment === idx && isDark && { color: '#FFFFFF' },
                ]}>
                  {seg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.underlineContainer}>
          <Animated.View
            style={[
              styles.segmentUnderline,
              isDark && { backgroundColor: '#FFFFFF' },
              {
                width: underlineWidth,
                transform: [{ translateX: underlineTranslateX }],
              },
            ]}
          />
        </View>
        <View style={[styles.segmentDivider, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
      </View>

      {activeSegment === 0 && renderDrillContent()}
      {activeSegment === 1 && renderRoundContent()}
      {activeSegment === 2 && renderTournamentContent()}

      <Modal
        visible={courseModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => { setCourseModalVisible(false); setCourseShowMap(false); }}
      >
        <View style={[styles.courseModalContainer, { backgroundColor: courseSelectTarget === 'tournament' ? bgColor : '#3D954D' }]}>
          <LinearGradient
            colors={courseSelectTarget === 'tournament' && isDark
              ? [bgColor, bgColor, bgColor]
              : ['#4BA35B', '#3D954D', '#2D803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.courseModalContainer}
          >
            <View style={[styles.courseModalHeader, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCourseModalVisible(false);
                  setCourseShowMap(false);
                }}
                style={styles.courseModalBackBtn}
                activeOpacity={0.7}
              >
                <ChevronLeft size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.courseModalTitle}>BANOR</Text>
              <TouchableOpacity
                style={styles.courseModalMapBtn}
                onPress={() => {
                  if (courseUserLocation) {
                    setCourseShowMap(true);
                  }
                }}
                activeOpacity={0.7}
                disabled={!courseUserLocation}
              >
                <MapPin
                  size={22}
                  color={courseUserLocation ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.courseModalSearchSection}>
              <View style={styles.courseModalSearchBar}>
                <Search size={18} color="rgba(255,255,255,0.6)" />
                <TextInput
                  style={styles.courseModalSearchInput}
                  placeholder="Search golf courses..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={courseSearchQuery}
                  onChangeText={setCourseSearchQuery}
                  onSubmitEditing={handleCourseSearch}
                  returnKeyType="search"
                />
                {courseSearchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setCourseSearchQuery('');
                      setCourseSearchResults([]);
                      setCourseHasSearched(false);
                    }}
                  >
                    <X size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.courseModalSearchBtn}
                  onPress={handleCourseSearch}
                  activeOpacity={0.7}
                  disabled={courseIsSearching}
                >
                  {courseIsSearching ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.courseModalSearchBtnText}>Sök</Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.courseModalTabRow}>
                <TabCourse
                  activeTab={courseActiveTab}
                  onTabChange={setCourseActiveTab}
                  playedCount={0}
                />
              </View>
            </View>

            {courseIsSelecting && (
              <View style={styles.courseModalSelectingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.courseModalSelectingText}>Loading course data...</Text>
              </View>
            )}

            <FlatList
              data={displayCourses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: DisplayCourse }) => {
                const isFav = courseFavorites.includes(item.id);
                return (
                  <TouchableOpacity
                    style={styles.courseModalRow}
                    onPress={() => handleSelectCourse(item)}
                    activeOpacity={0.6}
                    disabled={courseIsSelecting}
                  >
                    <View style={styles.courseModalInfo}>
                      <Text style={styles.courseModalName}>{item.name}</Text>
                      <View style={styles.courseModalSubRow}>
                        <Text style={styles.courseModalClub}>{item.clubName}</Text>
                        <MapPin size={12} color="rgba(255,255,255,0.5)" />
                      </View>
                      <View style={styles.courseModalMetaRow}>
                        {(item.city || item.country) ? (
                          <Text style={styles.courseModalCity}>
                            {[item.city, item.country].filter(Boolean).join(', ')}
                          </Text>
                        ) : null}
                        {item.distanceKm !== undefined && (
                          <Text style={styles.courseModalDistance}>
                            {item.distanceKm < 1
                              ? `${Math.round(item.distanceKm * 1000)} m`
                              : `${item.distanceKm.toFixed(1)} km`}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.courseModalFavBtn}
                      onPress={() => toggleCourseFavorite(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Star
                        size={20}
                        color={isFav ? '#FFB74D' : 'rgba(255,255,255,0.4)'}
                        fill={isFav ? '#FFB74D' : 'transparent'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.courseModalListContent}
              ListEmptyComponent={
                <View style={styles.courseModalEmpty}>
                  {(courseNearbyLoading && !courseHasSearched) || courseIsSearching ? (
                    <>
                      <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
                      <Text style={styles.courseModalEmptyText}>
                        {courseNearbyLoading && !courseHasSearched ? 'Finding nearby courses...' : 'Searching...'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.courseModalEmptyText}>
                      {courseActiveTab === 'favorite'
                        ? 'No favorite courses yet'
                        : courseHasSearched
                        ? 'No courses found. Try a different search.'
                        : 'No nearby courses found. Try searching by name.'}
                    </Text>
                  )}
                </View>
              }
            />

            {courseShowMap && courseUserLocation && Platform.OS !== 'web' && (() => {
              const MapView = require('react-native-maps').default;
              const { Marker, Callout } = require('react-native-maps');
              const allCoursesForMap = [...courseNearbyCourses, ...courseSearchResults].filter(
                (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
              );
              const markersWithCoords = allCoursesForMap.filter((c) => c.latitude && c.longitude);
              return (
                <View style={styles.courseMapOverlay}>
                  <MapView
                    ref={courseMapRef}
                    style={StyleSheet.absoluteFillObject}
                    initialRegion={{
                      latitude: courseUserLocation.lat,
                      longitude: courseUserLocation.lon,
                      latitudeDelta: 0.5,
                      longitudeDelta: 0.5,
                    }}
                    showsUserLocation
                    showsMyLocationButton={false}
                    mapType="standard"
                  >
                    {markersWithCoords.map((course) => (
                      <Marker
                        key={course.id}
                        coordinate={{
                          latitude: course.latitude!,
                          longitude: course.longitude!,
                        }}
                        title={course.name}
                        description={`${course.clubName} • ${course.city}`}
                        pinColor="#3D954D"
                        onCalloutPress={() => handleSelectCourse(course)}
                      >
                        <View style={styles.courseMapPinContainer}>
                          <View style={styles.courseMapPinDot} />
                        </View>
                        <Callout tooltip>
                          <View style={styles.courseMapCallout}>
                            <Text style={styles.courseMapCalloutTitle} numberOfLines={1}>{course.name}</Text>
                            <Text style={styles.courseMapCalloutSub} numberOfLines={1}>{course.clubName}</Text>
                            {course.distanceKm !== undefined && (
                              <Text style={styles.courseMapCalloutDist}>
                                {course.distanceKm < 1
                                  ? `${Math.round(course.distanceKm * 1000)} m`
                                  : `${course.distanceKm.toFixed(1)} km`}
                              </Text>
                            )}
                            <Text style={styles.courseMapCalloutTap}>Tap to select</Text>
                          </View>
                        </Callout>
                      </Marker>
                    ))}
                  </MapView>
                  <View style={styles.courseMapHeaderSafe}>
                    <View style={[styles.courseMapHeader, { paddingTop: insets.top + 10 }]}>
                      <TouchableOpacity
                        style={styles.courseMapCloseBtn}
                        onPress={() => setCourseShowMap(false)}
                        activeOpacity={0.7}
                      >
                        <X size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.courseMapHeaderTitle}>Banor på kartan</Text>
                      <View style={{ width: 36 }} />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.courseMapMyLocationBtn}
                    onPress={() => {
                      courseMapRef.current?.animateToRegion({
                        latitude: courseUserLocation.lat,
                        longitude: courseUserLocation.lon,
                        latitudeDelta: 0.15,
                        longitudeDelta: 0.15,
                      }, 600);
                    }}
                    activeOpacity={0.7}
                  >
                    <Navigation size={18} color="#3D954D" />
                  </TouchableOpacity>
                </View>
              );
            })()}
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 4,
  },
  glassBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  segmentRow: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  segmentBtn: {
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  segmentTextActive: {
    color: '#1A1A1A',
    fontWeight: '700' as const,
  },
  underlineContainer: {
    paddingHorizontal: 0,
  },
  segmentUnderline: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 1.5,
  },
  segmentDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 20,
  },
  inputWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  optionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    minWidth: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionChipSelected: {
    backgroundColor: '#2E7D32',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  distanceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
    gap: 12,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    width: 70,
  },
  distanceInputWrapper: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  distanceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    paddingVertical: 12,
  },
  distanceUnit: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  previewCard: {
    marginTop: 24,
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  previewText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  infoInputWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  infoInput: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
  },
  saveDrillBtnOuter: {
    marginTop: 24,
  },
  saveDrillBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  saveDrillBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  groupCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  groupHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupHeaderText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  groupDeleteCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  groupSlots: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: 10,
    gap: 8,
  },
  roundSlot: {
    width: '47%' as any,
    minHeight: 70,
  },
  roundPlayerSlot: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 10,
    minHeight: 70,
    position: 'relative' as const,
  },
  roundAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  roundAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roundAvatarInitial: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  roundPlayerName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  roundRemoveBtn: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e53935',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roundAddSlot: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 70,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  roundAddSlotText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600' as const,
  },
  groupActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 8,
  },
  groupActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roundCourseBanner: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    overflow: 'hidden' as const,
  },
  roundCourseInner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roundCourseSelected: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  roundCourseName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  roundCourseClub: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
    marginTop: 2,
  },
  roundCourseLocation: {
    fontSize: 12,
    color: '#BBB',
    marginTop: 1,
  },
  roundCourseSearchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  roundCourseSearchText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#999',
  },
  roundCourseArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  courseModalContainer: {
    flex: 1,
  },
  courseModalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  courseModalBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  courseModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  courseModalSearchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  courseModalSearchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 8,
  },
  courseModalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  courseModalSearchBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  courseModalSearchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  courseModalTabRow: {
    marginBottom: 8,
  },
  courseModalRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  courseModalInfo: {
    flex: 1,
  },
  courseModalName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  courseModalSubRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 2,
  },
  courseModalClub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  courseModalMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 2,
  },
  courseModalCity: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  courseModalDistance: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  courseModalFavBtn: {
    padding: 8,
  },
  courseModalListContent: {
    paddingBottom: 40,
  },
  courseModalEmpty: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 60,
    gap: 12,
  },
  courseModalEmptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  courseModalSelectingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  courseModalSelectingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  holeOptionsContainer: {
    gap: 10,
  },
  holeOptionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
  },
  holeOptionCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(46,125,50,0.06)',
  },
  holeOptionContent: {
    flex: 1,
  },
  holeOptionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  holeOptionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  playerPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' as const,
  },
  playerPickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%' as any,
    paddingBottom: 40,
  },
  playerPickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  playerPickerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  playerPickerList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  playerPickerEmpty: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  playerPickerEmptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
  },
  playerPickerItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  playerPickerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playerPickerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  playerPickerAvatarInitial: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  playerPickerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  playerPickerAssigned: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#BBB',
  },
  formatPickerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  formatCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    marginBottom: 10,
  },
  formatCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(46,125,50,0.06)',
  },
  totalRoundsRow: {
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'flex-start' as const,
  },
  totalRoundCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  totalRoundCircleSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  totalRoundText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  totalRoundTextSelected: {
    color: '#FFFFFF',
  },
  courseModalMapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  courseMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: '#000',
  },
  courseMapPinContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  courseMapPinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3D954D',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  courseMapCallout: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 10,
    padding: 10,
    minWidth: 160,
    maxWidth: 240,
  },
  courseMapCalloutTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  courseMapCalloutSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  courseMapCalloutDist: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 3,
  },
  courseMapCalloutTap: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  courseMapHeaderSafe: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
  },
  courseMapHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  courseMapCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  courseMapHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  courseMapMyLocationBtn: {
    position: 'absolute' as const,
    bottom: 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
