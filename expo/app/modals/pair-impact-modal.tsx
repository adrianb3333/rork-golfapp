import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bluetooth, ChevronRight, Wifi, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();

interface InfoPage {
  id: number;
  type: 'ble' | 'install' | 'return' | 'alone';
  title: string;
  description: string;
}

const INFO_PAGES: InfoPage[] = [
  {
    id: 1,
    type: 'ble',
    title: "Pair your Golfer's Crib Sensors and achieve world class analysis of your game!",
    description: '',
  },
  {
    id: 2,
    type: 'install',
    title: 'Install Sensors',
    description: 'Twist sensors into all clubs that do not already have a sensor embedded in the grip. Tighten until it fits securely to the end of the grip.',
  },
  {
    id: 3,
    type: 'return',
    title: 'Return Clubs to Bag',
    description: 'Pair only one club at a time, with all other clubs left in your bag. Return club back to bag after pairing.',
  },
  {
    id: 4,
    type: 'alone',
    title: 'Pair by yourself',
    description: 'Do not pair in close proximity to someone else also pairing. You may pair to their sensors by accident.',
  },
];

interface ClubCategory {
  name: string;
  clubs: string[];
  defaultVisible: boolean;
}

const CLUB_CATEGORIES: ClubCategory[] = [
  {
    name: 'Woods',
    clubs: ['Dr', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w', '10w', '11w', '12w', '13w', '14w', '15w'],
    defaultVisible: true,
  },
  {
    name: 'Hybrids',
    clubs: ['1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h'],
    defaultVisible: true,
  },
  {
    name: 'Irons',
    clubs: ['1i', '2i', '3i', '4i', '5i', '6i', '7i', '8i', '9i', '10i', '11i', '12i', '13i', '14i', '15i'],
    defaultVisible: true,
  },
  {
    name: 'Wedges',
    clubs: ['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw', '50°', '51°', '52°', '53°', '54°', '55°', '56°', '57°', '58°', '60°', '62°', '64°'],
    defaultVisible: true,
  },
  {
    name: 'Others',
    clubs: [],
    defaultVisible: false,
  },
];

const TOTAL_PAGES = INFO_PAGES.length + 1;
const REQUIRED_CLUBS = 13;

export default function PairImpactModal() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [visibleCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CLUB_CATEGORIES.forEach((cat) => {
      initial[cat.name] = cat.defaultVisible;
    });
    initial['Putter'] = true;
    return initial;
  });

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage && page >= 0 && page < TOTAL_PAGES) {
      setCurrentPage(page);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    scrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true });
    setCurrentPage(page);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleClub = useCallback((club: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(club)) {
        next.delete(club);
      } else {
        if (next.size >= REQUIRED_CLUBS) {
          Alert.alert('Maximum Reached', `You can only select ${REQUIRED_CLUBS} clubs.`);
          return prev;
        }
        next.add(club);
      }
      return next;
    });
  }, []);


  const handleStartPairing = useCallback(() => {
    if (selectedClubs.size < REQUIRED_CLUBS) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Select All Clubs', `Please select all ${REQUIRED_CLUBS} clubs before pairing.`);
      return;
    }
    console.log('[PairImpact] Start pairing with clubs:', Array.from(selectedClubs));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const orderedClubs = getOrderedClubs(selectedClubs);
    router.push({
      pathname: '/modals/pairing-process-modal',
      params: { clubs: JSON.stringify(orderedClubs) },
    });
  }, [selectedClubs, router]);

  const isLastPage = currentPage === TOTAL_PAGES - 1;
  const isLastInfoPage = currentPage === INFO_PAGES.length - 1;

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
            onPress={() => router.back()}
            style={styles.closeBtn}
            activeOpacity={0.7}
            testID="pair-close-button"
          >
            <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pair Sensors</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              currentPage === i && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      >
        {INFO_PAGES.map((page) => (
          <View key={page.id} style={styles.page}>
            <View style={styles.pageContent}>
              {page.type === 'ble' && (
                <>
                  <View style={styles.bleIconCircle}>
                    <Bluetooth size={64} color="#fff" />
                  </View>
                  <Text style={styles.bleTitle}>{page.title}</Text>
                </>
              )}
              {page.type === 'install' && (
                <>
                  <View style={styles.sensorIllustration}>
                    <View style={styles.sensorColumn}>
                      <View style={styles.sensorCapBlack}>
                        <View style={styles.sensorCapInnerBlack} />
                      </View>
                      <View style={styles.sensorScrewLine} />
                      <View style={styles.sensorGripTop} />
                      <Text style={styles.sensorLabel}>BLACK SENSOR</Text>
                      <Text style={styles.sensorSubLabel}>For Putter Only</Text>
                    </View>
                    <View style={styles.sensorColumn}>
                      <View style={styles.sensorCapGreen}>
                        <View style={styles.sensorCapInnerGreen} />
                        <View style={styles.sensorGreenRing} />
                      </View>
                      <View style={styles.sensorScrewLine} />
                      <View style={styles.sensorGripTop} />
                      <Text style={styles.sensorLabel}>GREEN SENSORS</Text>
                      <Text style={styles.sensorSubLabel}>All Other Clubs</Text>
                    </View>
                  </View>
                  <Text style={styles.pageTitle}>{page.title}</Text>
                  <Text style={styles.pageDescription}>{page.description}</Text>
                </>
              )}
              {page.type === 'return' && (
                <>
                  <View style={styles.bagIllustration}>
                    <View style={styles.bagBody}>
                      <View style={styles.bagClubSticks}>
                        <View style={styles.clubStick1} />
                        <View style={styles.clubStick2} />
                        <View style={styles.clubStick3} />
                      </View>
                      <View style={styles.bagOutline}>
                        <View style={styles.bagPocket} />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.pageTitle}>{page.title}</Text>
                  <Text style={styles.pageDescription}>{page.description}</Text>
                </>
              )}
              {page.type === 'alone' && (
                <>
                  <View style={styles.aloneIllustration}>
                    <View style={styles.peopleRow}>
                      <Users size={80} color="rgba(255,255,255,0.4)" />
                    </View>
                    <View style={styles.wifiIconRow}>
                      <Wifi size={32} color="#4BA35B" />
                    </View>
                    <View style={styles.sensorDeviceAlone}>
                      <View style={styles.sensorDeviceBody} />
                    </View>
                  </View>
                  <Text style={styles.pageTitle}>{page.title}</Text>
                  <Text style={styles.pageDescription}>{page.description}</Text>
                </>
              )}
            </View>
          </View>
        ))}

        <View style={[styles.page, { paddingHorizontal: 0 }]}>
          <ClubSelectionPage
            selectedClubs={selectedClubs}
            visibleCategories={visibleCategories}
            onToggleClub={toggleClub}
          />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.footer}>
          {isLastPage ? (
            <TouchableOpacity
              style={[
                styles.startPairingBtn,
                selectedClubs.size < REQUIRED_CLUBS && styles.startPairingBtnDisabled,
              ]}
              onPress={handleStartPairing}
              activeOpacity={0.8}
              testID="start-pairing-button"
            >
              <Bluetooth size={20} color={selectedClubs.size >= REQUIRED_CLUBS ? '#2D803D' : '#999'} />
              <MaskedView
                maskElement={
                  <Text style={styles.startPairingTextMask}>Start Pairing</Text>
                }
              >
                {selectedClubs.size >= REQUIRED_CLUBS ? (
                  <LinearGradient
                    colors={['#4BA35B', '#3D954D', '#2D803D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[styles.startPairingTextMask, { opacity: 0 }]}>Start Pairing</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.startPairingTextMask, { color: '#999' }]}>Start Pairing</Text>
                )}
              </MaskedView>
            </TouchableOpacity>
          ) : isLastInfoPage ? (
            <TouchableOpacity
              style={styles.continueToPairingBtn}
              onPress={() => goToPage(currentPage + 1)}
              activeOpacity={0.8}
            >
              <Text style={styles.continueToPairingText}>Continue to Pairing</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navRow}>
              {currentPage > 0 ? (
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => goToPage(currentPage - 1)}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.navBtnText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.navBtnPlaceholder} />
              )}
              <TouchableOpacity
                style={styles.navBtnNext}
                onPress={() => goToPage(currentPage + 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.navBtnNextText}>Next</Text>
                <ChevronRight size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getOrderedClubs(selectedClubs: Set<string>): string[] {
  const ordered: string[] = ['Pu'];
  const categoryOrder = ['Woods', 'Hybrids', 'Irons', 'Wedges'];
  for (const catName of categoryOrder) {
    const cat = CLUB_CATEGORIES.find((c) => c.name === catName);
    if (cat) {
      for (const club of cat.clubs) {
        if (selectedClubs.has(club)) {
          ordered.push(club);
        }
      }
    }
  }
  return ordered;
}

interface ClubSelectionPageProps {
  selectedClubs: Set<string>;
  visibleCategories: Record<string, boolean>;
  onToggleClub: (club: string) => void;
}

function ClubSelectionPage({ selectedClubs, visibleCategories, onToggleClub }: ClubSelectionPageProps) {
  return (
    <View style={clubStyles.container}>
      <View style={clubStyles.topRow}>
        <Text style={clubStyles.selectHeader}>Select {REQUIRED_CLUBS} clubs you Play!</Text>
        <View style={clubStyles.putterArea}>
          <LinearGradient
            colors={['#4BA35B', '#3D954D', '#2D803D']}
            style={clubStyles.putterCircle}
          >
            <Text style={clubStyles.putterText}>Pu</Text>
          </LinearGradient>
          <Text style={clubStyles.putterLabel}>Putter</Text>
        </View>
      </View>

      <View style={clubStyles.counterRow}>
        <Text style={clubStyles.counterText}>{selectedClubs.size}/{REQUIRED_CLUBS} selected</Text>
      </View>

      <ScrollView
        style={clubStyles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={clubStyles.scrollContent}
      >
        {CLUB_CATEGORIES.map((category) => (
          <View key={category.name} style={clubStyles.categoryBlock}>
            <View style={clubStyles.categoryHeader}>
              <Text style={clubStyles.categoryName}>{category.name}</Text>
            </View>
            {visibleCategories[category.name] && category.clubs.length > 0 && (
              <View style={clubStyles.clubGrid}>
                {category.clubs.map((club) => {
                  const isSelected = selectedClubs.has(club);
                  return (
                    <TouchableOpacity
                      key={club}
                      onPress={() => onToggleClub(club)}
                      activeOpacity={0.7}
                      style={clubStyles.clubTouchArea}
                    >
                      <LinearGradient
                        colors={isSelected ? ['#4BA35B', '#3D954D', '#2D803D'] : ['#4BA35B', '#3D954D', '#2D803D']}
                        style={[
                          clubStyles.clubCircle,
                          isSelected && clubStyles.clubCircleSelected,
                        ]}
                      >
                        <Text style={clubStyles.clubText}>{club}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const clubStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 4,
  },
  selectHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    flex: 1,
    paddingTop: 8,
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
  counterRow: {
    marginBottom: 12,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoryBlock: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
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
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  clubText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});

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
  closeBtn: {
    padding: 6,
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
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },
  dotsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
    borderRadius: 4,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {},
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
  },
  pageContent: {
    alignItems: 'center' as const,
    width: '100%' as const,
    marginTop: -20,
  },
  bleIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 40,
  },
  bleTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center' as const,
    lineHeight: 34,
    paddingHorizontal: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  pageDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center' as const,
    lineHeight: 23,
    paddingHorizontal: 16,
  },
  sensorIllustration: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 40,
    marginBottom: 40,
  },
  sensorColumn: {
    alignItems: 'center' as const,
  },
  sensorCapBlack: {
    width: 60,
    height: 30,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#555',
  },
  sensorCapInnerBlack: {
    width: 24,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#111',
  },
  sensorCapGreen: {
    width: 60,
    height: 30,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#555',
  },
  sensorCapInnerGreen: {
    width: 24,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#111',
  },
  sensorGreenRing: {
    position: 'absolute' as const,
    bottom: -2,
    left: 4,
    right: 4,
    height: 6,
    backgroundColor: '#4BA35B',
    borderRadius: 3,
  },
  sensorScrewLine: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  sensorGripTop: {
    width: 36,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  sensorLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  sensorSubLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
  },
  bagIllustration: {
    alignItems: 'center' as const,
    marginBottom: 40,
    height: 160,
    justifyContent: 'center' as const,
  },
  bagBody: {
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  bagClubSticks: {
    flexDirection: 'row' as const,
    gap: 4,
    marginBottom: -10,
    zIndex: 1,
  },
  clubStick1: {
    width: 2,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '-10deg' }],
  },
  clubStick2: {
    width: 2,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  clubStick3: {
    width: 2,
    height: 55,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '10deg' }],
  },
  bagOutline: {
    width: 70,
    height: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    paddingBottom: 10,
  },
  bagPocket: {
    width: 30,
    height: 24,
    borderWidth: 1.5,
    borderColor: '#4BA35B',
    borderRadius: 6,
  },
  aloneIllustration: {
    alignItems: 'center' as const,
    marginBottom: 40,
    gap: 12,
  },
  peopleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  wifiIconRow: {
    marginTop: 4,
  },
  sensorDeviceAlone: {
    alignItems: 'center' as const,
    marginTop: 4,
  },
  sensorDeviceBody: {
    width: 28,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  startPairingBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  startPairingBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  startPairingTextMask: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#000',
  },
  navRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  navBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600' as const,
  },
  navBtnPlaceholder: {
    width: 80,
  },
  navBtnNext: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navBtnNextText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600' as const,
  },
  continueToPairingBtn: {
    backgroundColor: '#4BA35B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  continueToPairingText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
