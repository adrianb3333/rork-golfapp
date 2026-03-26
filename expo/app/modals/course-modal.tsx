import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Search, Star, X, Navigation } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabCourse, { CourseTab } from '@/components/PlaSta/TabCourse';
import {
  searchGolfCourses,
  getGolfCourseDetail,
  getDefaultMaleTee,
  searchNearbyCourses,
  getDistanceKm,
} from '@/services/golfCourseApi';

const STORAGE_KEY_COURSE = 'play_setup_selected_course';
const STORAGE_KEY_COURSE_HOLES = 'play_setup_course_holes';
const STORAGE_KEY_COURSE_LOCATION = 'play_setup_course_location';
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

function NativeMapOverlay({
  courses,
  userLat,
  userLon,
  onSelectCourse,
  onClose,
}: {
  courses: DisplayCourse[];
  userLat: number;
  userLon: number;
  onSelectCourse: (course: DisplayCourse) => void;
  onClose: () => void;
}) {
  const MapView = require('react-native-maps').default;
  const { Marker, Callout } = require('react-native-maps');
  const mapRef = useRef<any>(null);

  const markersWithCoords = useMemo(() => {
    return courses.filter((c) => c.latitude && c.longitude);
  }, [courses]);

  const initialRegion = {
    latitude: userLat,
    longitude: userLon,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <View style={mapStyles.container}>
      <MapView
        ref={mapRef}
        style={mapStyles.map}
        initialRegion={initialRegion}
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
            onCalloutPress={() => onSelectCourse(course)}
          >
            <View style={mapStyles.pinContainer}>
              <View style={mapStyles.pinDot} />
            </View>
            <Callout tooltip>
              <View style={mapStyles.callout}>
                <Text style={mapStyles.calloutTitle} numberOfLines={1}>{course.name}</Text>
                <Text style={mapStyles.calloutSub} numberOfLines={1}>{course.clubName}</Text>
                {course.distanceKm !== undefined && (
                  <Text style={mapStyles.calloutDist}>
                    {course.distanceKm < 1
                      ? `${Math.round(course.distanceKm * 1000)} m`
                      : `${course.distanceKm.toFixed(1)} km`}
                  </Text>
                )}
                <Text style={mapStyles.calloutTap}>Tap to select</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={mapStyles.headerSafe}>
        <View style={mapStyles.header}>
          <TouchableOpacity style={mapStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={mapStyles.headerTitle}>Banor på kartan</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <TouchableOpacity
        style={mapStyles.myLocationBtn}
        onPress={() => {
          mapRef.current?.animateToRegion({
            latitude: userLat,
            longitude: userLon,
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
}

const mapStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  headerSafe: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  myLocationBtn: {
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
  pinContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3D954D',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  callout: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 10,
    padding: 10,
    minWidth: 160,
    maxWidth: 240,
  },
  calloutTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  calloutSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  calloutDist: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 3,
  },
  calloutTap: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
});

export default function CourseModal() {
  const [activeTab, setActiveTab] = useState<CourseTab>('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [nearbyCourses, setNearbyCourses] = useState<DisplayCourse[]>([]);
  const [searchResults, setSearchResults] = useState<DisplayCourse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    void loadFavorites();
    void loadNearby();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) {
      console.log('[CourseModal] Error loading favorites:', e);
    }
  };

  const loadNearby = async () => {
    setNearbyLoading(true);
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
        console.log('[CourseModal] User location:', lat, lon);
        setUserLocation({ lat, lon });
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
        setNearbyCourses(mapped);
        console.log('[CourseModal] Nearby courses loaded:', mapped.length);
      } else {
        console.log('[CourseModal] Could not get user location');
      }
    } catch (e) {
      console.log('[CourseModal] Error loading nearby:', e);
    } finally {
      setNearbyLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (courseId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchGolfCourses(searchQuery.trim());
      const mapped: DisplayCourse[] = results.map((r) => {
        const distKm = userLocation
          ? getDistanceKm(userLocation.lat, userLocation.lon, r.location?.latitude ?? 0, r.location?.longitude ?? 0)
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
      setSearchResults(mapped);
      console.log('[CourseModal] Search found:', mapped.length, 'courses');
    } catch (e) {
      console.log('[CourseModal] Search error:', e);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, userLocation]);

  const handleSelectCourse = useCallback(async (course: DisplayCourse) => {
    setIsSelecting(true);
    setShowMap(false);
    try {
      const detail = await getGolfCourseDetail(course.apiId);
      if (detail) {
        const tee = getDefaultMaleTee(detail);
        const holeData = tee?.holes ?? [];
        const parTotal = tee?.par_total ?? 72;
        const numHoles = tee?.number_of_holes ?? 18;

        const toStore = {
          id: course.id,
          apiId: course.apiId,
          name: detail.course_name,
          clubName: detail.club_name,
          holes: numHoles,
          par: parTotal,
          city: detail.location?.city ?? '',
          country: detail.location?.country ?? '',
        };
        await AsyncStorage.setItem(STORAGE_KEY_COURSE, JSON.stringify(toStore));

        const holesArray = holeData.map((h, idx) => ({
          number: idx + 1,
          par: h.par,
          yardage: h.yardage,
          handicap: h.handicap,
        }));
        await AsyncStorage.setItem(STORAGE_KEY_COURSE_HOLES, JSON.stringify(holesArray));

        const locationData = {
          latitude: detail.location?.latitude ?? null,
          longitude: detail.location?.longitude ?? null,
          address: detail.location?.address ?? '',
        };
        await AsyncStorage.setItem(STORAGE_KEY_COURSE_LOCATION, JSON.stringify(locationData));

        console.log('[CourseModal] Selected course:', detail.course_name, 'with', holesArray.length, 'holes');
      } else {
        const toStore = {
          id: course.id,
          apiId: course.apiId,
          name: course.name,
          clubName: course.clubName,
          holes: course.holes,
          par: course.par,
          city: course.city,
          country: course.country,
        };
        await AsyncStorage.setItem(STORAGE_KEY_COURSE, JSON.stringify(toStore));
      }
    } catch (e) {
      console.log('[CourseModal] Error saving course:', e);
    } finally {
      setIsSelecting(false);
    }
    router.back();
  }, []);

  const displayCourses = useMemo(() => {
    if (activeTab === 'favorite') {
      const allCourses = [...nearbyCourses, ...searchResults];
      const unique = allCourses.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
      return unique.filter((c) => favorites.includes(c.id));
    }
    if (hasSearched && searchResults.length > 0) {
      return searchResults;
    }
    return nearbyCourses;
  }, [activeTab, nearbyCourses, searchResults, favorites, hasSearched]);

  const allCoursesForMap = useMemo(() => {
    const all = [...nearbyCourses, ...searchResults];
    return all.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
  }, [nearbyCourses, searchResults]);

  const renderCourseItem = useCallback(({ item }: { item: DisplayCourse }) => {
    const isFav = favorites.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.courseRow}
        onPress={() => handleSelectCourse(item)}
        activeOpacity={0.6}
        disabled={isSelecting}
      >
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{item.name}</Text>
          <View style={styles.courseSubRow}>
            <Text style={styles.courseClub}>{item.clubName}</Text>
            <MapPin size={12} color="rgba(255,255,255,0.5)" />
          </View>
          <View style={styles.courseMetaRow}>
            {(item.city || item.country) ? (
              <Text style={styles.courseCity}>
                {[item.city, item.country].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {item.distanceKm !== undefined && (
              <Text style={styles.courseDistance}>
                {item.distanceKm < 1
                  ? `${Math.round(item.distanceKm * 1000)} m`
                  : `${item.distanceKm.toFixed(1)} km`}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => toggleFavorite(item.id)}
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
  }, [favorites, isSelecting, handleSelectCourse, toggleFavorite]);

  const isNearbyTab = activeTab === 'nearby';
  const showNearbyLoading = isNearbyTab && nearbyLoading && !hasSearched;

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <GlassBackButton onPress={() => router.back()} />
          <Text style={styles.headerTitle}>BANOR</Text>
          <TouchableOpacity
            style={styles.mapIconBtn}
            onPress={() => {
              if (userLocation) {
                setShowMap(true);
              }
            }}
            activeOpacity={0.7}
            disabled={!userLocation}
          >
            <MapPin
              size={22}
              color={userLocation ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search golf courses..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
              >
                <X size={16} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearch}
              activeOpacity={0.7}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.searchBtnText}>Sök</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            <TabCourse
              activeTab={activeTab}
              onTabChange={setActiveTab}
              playedCount={0}
            />
          </View>
        </View>

        {isSelecting && (
          <View style={styles.selectingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.selectingText}>Loading course data...</Text>
          </View>
        )}

        <FlatList
          data={displayCourses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourseItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {showNearbyLoading || isSearching ? (
                <>
                  <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
                  <Text style={styles.emptyText}>
                    {showNearbyLoading ? 'Finding nearby courses...' : 'Searching...'}
                  </Text>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  {activeTab === 'favorite'
                    ? 'No favorite courses yet'
                    : hasSearched
                    ? 'No courses found. Try a different search.'
                    : 'No nearby courses found. Try searching by name.'}
                </Text>
              )}
            </View>
          }
        />

        {showMap && userLocation && Platform.OS !== 'web' && (
          <NativeMapOverlay
            courses={allCoursesForMap}
            userLat={userLocation.lat}
            userLon={userLocation.lon}
            onSelectCourse={handleSelectCourse}
            onClose={() => setShowMap(false)}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mapIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  searchBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  tabRow: {
    marginBottom: 8,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  courseSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  courseClub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  courseMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 2,
  },
  courseCity: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  courseDistance: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  favBtn: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  selectingOverlay: {
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
  selectingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
