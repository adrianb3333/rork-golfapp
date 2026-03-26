import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Search, ChevronDown, X, Swords } from 'lucide-react-native';
import { useBattle } from '@/contexts/BattleContext';
import ProfileCard from '@/components/ProfileCard';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile, UserProfile } from '@/contexts/ProfileContext';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();

const TABS = ['Stats', 'Strokes Gained', 'Distance'] as const;
const FLOATING_HEADER_HEIGHT = 90;

type SGCategory = 'sg' | 'ott' | 'app' | 'arg' | 'p';

const SG_OPTIONS: { key: SGCategory; label: string; fullLabel: string }[] = [
  { key: 'sg', label: 'SG-', fullLabel: 'Overall Strokes Gained' },
  { key: 'ott', label: 'OTT', fullLabel: 'Off The Tee' },
  { key: 'app', label: 'APP', fullLabel: 'Approach The Green' },
  { key: 'arg', label: 'ARG', fullLabel: 'Around The Green' },
  { key: 'p', label: 'P', fullLabel: 'Putting' },
];

interface SGPartData {
  label: string;
  userValue: number;
  opponentValue: number;
}

const SG_MOCK_DATA: Record<SGCategory, { parts: SGPartData[]; userOverall: number; opponentOverall: number }> = {
  sg: {
    parts: [
      { label: 'Driving', userValue: -2.6, opponentValue: -1.2 },
      { label: 'Approach', userValue: 1.2, opponentValue: 0.5 },
      { label: 'Short Game', userValue: 1.0, opponentValue: -0.3 },
      { label: 'Putting', userValue: -0.9, opponentValue: 0.8 },
    ],
    userOverall: -1.3,
    opponentOverall: -0.2,
  },
  ott: {
    parts: [
      { label: 'Accuracy', userValue: -1.4, opponentValue: -0.6 },
      { label: 'Distance', userValue: 0.3, opponentValue: 0.8 },
      { label: 'Penalty Avd.', userValue: -1.5, opponentValue: -1.4 },
    ],
    userOverall: -2.6,
    opponentOverall: -1.2,
  },
  app: {
    parts: [
      { label: '100-150m', userValue: 0.8, opponentValue: 0.2 },
      { label: '150-200m', userValue: 0.3, opponentValue: -0.1 },
      { label: '50-100m', userValue: 0.1, opponentValue: 0.4 },
    ],
    userOverall: 1.2,
    opponentOverall: 0.5,
  },
  arg: {
    parts: [
      { label: 'Chipping', userValue: 0.5, opponentValue: -0.2 },
      { label: 'Pitching', userValue: 0.3, opponentValue: 0.1 },
      { label: 'Bunker', userValue: 0.2, opponentValue: -0.2 },
    ],
    userOverall: 1.0,
    opponentOverall: -0.3,
  },
  p: {
    parts: [
      { label: 'Short (0-3m)', userValue: 0.2, opponentValue: 0.5 },
      { label: 'Mid (3-6m)', userValue: -0.4, opponentValue: 0.2 },
      { label: 'Long (6m+)', userValue: -0.7, opponentValue: 0.1 },
    ],
    userOverall: -0.9,
    opponentOverall: 0.8,
  },
};

interface ClubBagEntry {
  club: string;
  category: string;
  distance: number;
}

const USER_BAG: ClubBagEntry[] = [
  { club: 'Driver', category: 'Woods', distance: 245 },
  { club: '3 Wood', category: 'Woods', distance: 225 },
  { club: '5 Wood', category: 'Woods', distance: 210 },
  { club: '4 Iron', category: 'Irons', distance: 190 },
  { club: '5 Iron', category: 'Irons', distance: 180 },
  { club: '6 Iron', category: 'Irons', distance: 170 },
  { club: '7 Iron', category: 'Irons', distance: 160 },
  { club: '8 Iron', category: 'Irons', distance: 148 },
  { club: '9 Iron', category: 'Irons', distance: 137 },
  { club: 'PW', category: 'Wedges', distance: 125 },
  { club: 'GW', category: 'Wedges', distance: 110 },
  { club: 'SW', category: 'Wedges', distance: 90 },
  { club: 'LW', category: 'Wedges', distance: 70 },
];

const OPPONENT_BAG: ClubBagEntry[] = [
  { club: 'Driver', category: 'Woods', distance: 260 },
  { club: '3 Wood', category: 'Woods', distance: 235 },
  { club: '7 Wood', category: 'Woods', distance: 200 },
  { club: '3 Hybrid', category: 'Hybrids', distance: 210 },
  { club: '5 Iron', category: 'Irons', distance: 185 },
  { club: '6 Iron', category: 'Irons', distance: 175 },
  { club: '7 Iron', category: 'Irons', distance: 163 },
  { club: '8 Iron', category: 'Irons', distance: 152 },
  { club: '9 Iron', category: 'Irons', distance: 140 },
  { club: 'PW', category: 'Wedges', distance: 128 },
  { club: 'GW', category: 'Wedges', distance: 112 },
  { club: 'SW', category: 'Wedges', distance: 95 },
  { club: 'LW', category: 'Wedges', distance: 75 },
];

export default function CompareModal() {
  const router = useRouter();
  const { profile, allUsers, isLoadingAllUsers, isFollowing: checkIsFollowing, toggleFollow } = useProfile();
  const { battleResults } = useBattle();
  const insets = useSafeAreaInsets();
  const username = profile?.display_name || profile?.username || 'User';
  const [showBattleSummaries, setShowBattleSummaries] = useState(false);
  const [profileCardUser, setProfileCardUser] = useState<UserProfile | null>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [expandedBattleId, setExpandedBattleId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedOpponent, setSelectedOpponent] = useState<UserProfile | null>(null);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedSG, setSelectedSG] = useState<SGCategory>('sg');
  const [showSGDropdown, setShowSGDropdown] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const { headerTranslateY, onScroll: onVerticalScroll } = useScrollHeader(FLOATING_HEADER_HEIGHT + insets.top);

  const filteredUsers = useMemo(() => {
    if (!playerSearch.trim()) return allUsers;
    const q = playerSearch.toLowerCase();
    return allUsers.filter(
      (u) =>
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
    );
  }, [allUsers, playerSearch]);

  const handleHorizontalScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      if (index >= 0 && index < TABS.length && index !== activeTab) {
        setActiveTab(index);
      }
      const progress = offsetX / SCREEN_WIDTH;
      indicatorAnim.setValue(progress);
    },
    [activeTab, indicatorAnim]
  );

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  }, []);

  const handleSelectPlayer = useCallback((user: UserProfile) => {
    console.log('[CompareModal] Selected opponent:', user.display_name);
    setSelectedOpponent(user);
    setShowPlayerPicker(false);
    setPlayerSearch('');
  }, []);

  const tabWidth = (SCREEN_WIDTH - 40) / TABS.length;
  const underlineWidth = 40;

  const translateX = indicatorAnim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth + (tabWidth - underlineWidth) / 2),
    extrapolate: 'clamp',
  });

  const renderVSCard = useCallback(() => (
    <View style={styles.vsSection}>
      <View style={styles.vsCard}>
        <View style={styles.vsPlayer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.vsAvatar} />
          ) : (
            <View style={styles.vsAvatarPlaceholder}>
              <User size={22} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.vsName} numberOfLines={1}>{username}</Text>
          <Text style={styles.vsHcp}>HCP 14.2</Text>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <TouchableOpacity
          style={styles.vsPlayer}
          activeOpacity={0.7}
          onPress={() => setShowPlayerPicker(true)}
        >
          {selectedOpponent ? (
            <>
              {selectedOpponent.avatar_url ? (
                <Image source={{ uri: selectedOpponent.avatar_url }} style={styles.vsAvatar} />
              ) : (
                <View style={styles.vsAvatarPlaceholder}>
                  <User size={22} color="#FFFFFF" />
                </View>
              )}
              <Text style={styles.vsName} numberOfLines={1}>
                {selectedOpponent.display_name || selectedOpponent.username}
              </Text>
              <Text style={styles.vsHcp}>HCP —</Text>
            </>
          ) : (
            <>
              <View style={styles.vsAvatarEmpty}>
                <Search size={20} color="rgba(255,255,255,0.5)" />
              </View>
              <Text style={styles.vsNameEmpty}>Select Player</Text>
              <Text style={styles.vsHcpEmpty}>—</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  ), [profile, username, selectedOpponent]);

  const statsCategories = [
    'Avg Score',
    'Best Round',
    'Fairways Hit %',
    'GIR %',
    'Putts per Round',
    'Longest Drive',
    'Up & Downs',
    'Sand Saves',
    'Penalty Shots',
    'Handicap Trend',
  ];

  const contentPaddingTop = FLOATING_HEADER_HEIGHT + insets.top + 8;

  const renderStatsTab = () => (
    <ScrollView
      style={styles.tabPage}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.tabPageContent, { paddingTop: contentPaddingTop }]}
      onScroll={onVerticalScroll}
      scrollEventThrottle={16}
    >
      {renderVSCard()}

      <View style={styles.statsPreview}>
        {statsCategories.map((stat, i) => (
          <View key={i} style={styles.statRow}>
            <Text style={styles.statValueLeft}>
              {selectedOpponent ? '—' : '—'}
            </Text>
            <Text style={styles.statNameCenter}>{stat}</Text>
            <Text style={styles.statValueRight}>
              {selectedOpponent ? '—' : '—'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const sgData = SG_MOCK_DATA[selectedSG];
  const currentSGOption = SG_OPTIONS.find(o => o.key === selectedSG)!;

  const formatSG = (val: number) => {
    const prefix = val >= 0 ? '+' : '';
    return `${prefix}${val.toFixed(1)}`;
  };

  const renderStrokesGainedTab = () => {
    const isOverall = selectedSG === 'sg';

    return (
      <ScrollView
        style={styles.tabPage}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.tabPageContent, { paddingTop: contentPaddingTop }]}
        onScroll={onVerticalScroll}
        scrollEventThrottle={16}
      >
        {renderVSCard()}

        <View style={styles.sgDropdownSection}>
          <TouchableOpacity
            style={styles.sgDropdownBtn}
            activeOpacity={0.7}
            onPress={() => setShowSGDropdown(!showSGDropdown)}
          >
            <Text style={styles.sgDropdownLabel}>{currentSGOption.label}</Text>
            <Text style={styles.sgDropdownSublabel}>{currentSGOption.fullLabel}</Text>
            <ChevronDown size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {showSGDropdown && (
            <View style={styles.sgDropdownMenu}>
              {SG_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.sgDropdownItem,
                    selectedSG === opt.key && styles.sgDropdownItemActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedSG(opt.key);
                    setShowSGDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.sgDropdownItemLabel,
                    selectedSG === opt.key && styles.sgDropdownItemLabelActive,
                  ]}>
                    {opt.label}
                  </Text>
                  <Text style={[
                    styles.sgDropdownItemSub,
                    selectedSG === opt.key && styles.sgDropdownItemSubActive,
                  ]}>
                    {opt.fullLabel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {isOverall ? (
          <View style={styles.sgCompareSection}>
            <View style={styles.sgHeaderRow}>
              <Text style={styles.sgHeaderSide} numberOfLines={1}>{username}</Text>
              <Text style={styles.sgHeaderMiddle}>Category</Text>
              <Text style={styles.sgHeaderSide} numberOfLines={1}>
                {selectedOpponent ? (selectedOpponent.display_name || selectedOpponent.username) : '—'}
              </Text>
            </View>

            {sgData.parts.map((part, i) => {
              const userColor = part.userValue >= 0 ? '#22C55E' : '#EF4444';
              const oppColor = part.opponentValue >= 0 ? '#22C55E' : '#EF4444';
              return (
                <View key={i} style={styles.sgRow}>
                  <Text style={[styles.sgValue, { color: selectedOpponent ? userColor : 'rgba(255,255,255,0.4)' }]}>
                    {selectedOpponent ? formatSG(part.userValue) : '—'}
                  </Text>
                  <Text style={styles.sgPartLabel}>{part.label}</Text>
                  <Text style={[styles.sgValue, { color: selectedOpponent ? oppColor : 'rgba(255,255,255,0.4)' }]}>
                    {selectedOpponent ? formatSG(part.opponentValue) : '—'}
                  </Text>
                </View>
              );
            })}

            <View style={styles.sgOverallRow}>
              <Text style={[
                styles.sgOverallValue,
                { color: selectedOpponent ? (sgData.userOverall >= 0 ? '#22C55E' : '#EF4444') : 'rgba(255,255,255,0.4)' },
              ]}>
                {selectedOpponent ? formatSG(sgData.userOverall) : '—'}
              </Text>
              <Text style={styles.sgOverallLabel}>Overall</Text>
              <Text style={[
                styles.sgOverallValue,
                { color: selectedOpponent ? (sgData.opponentOverall >= 0 ? '#22C55E' : '#EF4444') : 'rgba(255,255,255,0.4)' },
              ]}>
                {selectedOpponent ? formatSG(sgData.opponentOverall) : '—'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.sgSingleSection}>
            <View style={styles.sgSingleRow}>
              <View style={styles.sgSingleSide}>
                <Text style={[
                  styles.sgSingleBigNumber,
                  { color: selectedOpponent ? (sgData.userOverall >= 0 ? '#22C55E' : '#EF4444') : 'rgba(255,255,255,0.3)' },
                ]}>
                  {selectedOpponent ? formatSG(sgData.userOverall) : '—'}
                </Text>
              </View>

              <View style={styles.sgSingleCenter}>
                <Text style={styles.sgSingleLabel}>{currentSGOption.label}</Text>
                <Text style={styles.sgSingleSublabel}>{currentSGOption.fullLabel}</Text>
              </View>

              <View style={styles.sgSingleSide}>
                <Text style={[
                  styles.sgSingleBigNumber,
                  { color: selectedOpponent ? (sgData.opponentOverall >= 0 ? '#22C55E' : '#EF4444') : 'rgba(255,255,255,0.3)' },
                ]}>
                  {selectedOpponent ? formatSG(sgData.opponentOverall) : '—'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const groupBag = useCallback((bag: ClubBagEntry[]) => {
    const groups: { category: string; clubs: ClubBagEntry[] }[] = [];
    let currentCat = '';
    bag.forEach((club) => {
      if (club.category !== currentCat) {
        groups.push({ category: club.category, clubs: [] });
        currentCat = club.category;
      }
      groups[groups.length - 1].clubs.push(club);
    });
    return groups;
  }, []);

  const userGrouped = useMemo(() => groupBag(USER_BAG), [groupBag]);
  const opponentGrouped = useMemo(() => groupBag(OPPONENT_BAG), [groupBag]);

  const maxRows = useMemo(() => {
    const allCats = new Set<string>();
    USER_BAG.forEach(c => allCats.add(c.category));
    OPPONENT_BAG.forEach(c => allCats.add(c.category));
    return Array.from(allCats);
  }, []);

  const renderDistanceTab = () => {
    const getUserClubsForCat = (cat: string) => userGrouped.find(g => g.category === cat)?.clubs ?? [];
    const getOppClubsForCat = (cat: string) => opponentGrouped.find(g => g.category === cat)?.clubs ?? [];

    return (
      <ScrollView
        style={styles.tabPage}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.tabPageContent, { paddingTop: contentPaddingTop }]}
        onScroll={onVerticalScroll}
        scrollEventThrottle={16}
      >
        {renderVSCard()}

        <View style={styles.distSection}>
          <View style={styles.distDualHeader}>
            <Text style={styles.distDualHeaderName} numberOfLines={1}>{username}</Text>
            <Text style={styles.distDualHeaderName} numberOfLines={1}>
              {selectedOpponent ? (selectedOpponent.display_name || selectedOpponent.username) : '—'}
            </Text>
          </View>

          {maxRows.map((cat) => {
            const userClubs = getUserClubsForCat(cat);
            const oppClubs = getOppClubsForCat(cat);
            const rowCount = Math.max(userClubs.length, oppClubs.length);

            return (
              <View key={cat}>
                <View style={styles.distCatRow}>
                  <Text style={styles.distCatLabel}>{cat}</Text>
                </View>

                <View style={styles.distDualColumnHeader}>
                  <View style={styles.distDualColHalf}>
                    <Text style={styles.distDualColLabel}>Club</Text>
                    <Text style={styles.distDualColLabel}>Dist</Text>
                  </View>
                  <View style={styles.distDualDivider} />
                  <View style={styles.distDualColHalf}>
                    <Text style={styles.distDualColLabel}>Dist</Text>
                    <Text style={styles.distDualColLabel}>Club</Text>
                  </View>
                </View>

                {Array.from({ length: rowCount }).map((_, i) => {
                  const uClub = userClubs[i];
                  const oClub = oppClubs[i];
                  return (
                    <View key={i} style={styles.distDualRow}>
                      <View style={styles.distDualColHalf}>
                        <Text style={styles.distDualClubName}>
                          {uClub ? uClub.club : ''}
                        </Text>
                        <Text style={[
                          styles.distDualValue,
                          !uClub && styles.distValueDim,
                        ]}>
                          {uClub ? `${uClub.distance}m` : ''}
                        </Text>
                      </View>
                      <View style={styles.distDualDivider} />
                      <View style={styles.distDualColHalf}>
                        <Text style={[
                          styles.distDualValue,
                          (!oClub || !selectedOpponent) && styles.distValueDim,
                        ]}>
                          {selectedOpponent && oClub ? `${oClub.distance}m` : (oClub ? '—' : '')}
                        </Text>
                        <Text style={styles.distDualClubName}>
                          {oClub ? oClub.club : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderPlayerPickerItem = useCallback(({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.pickerRow}
      activeOpacity={0.7}
      onPress={() => handleSelectPlayer(item)}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.pickerAvatar} />
      ) : (
        <View style={styles.pickerAvatarPlaceholder}>
          <User size={18} color="rgba(255,255,255,0.6)" />
        </View>
      )}
      <View style={styles.pickerInfo}>
        <Text style={styles.pickerName}>{item.display_name || item.username}</Text>
        <Text style={styles.pickerUsername}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  ), [handleSelectPlayer]);

  return (
    <LinearGradient
      colors={['#FF1C1C', '#E31010', '#B20000', '#800000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleHorizontalScroll}
        scrollEventThrottle={16}
        style={styles.pagerScroll}
      >
        <View style={{ width: SCREEN_WIDTH }}>{renderStatsTab()}</View>
        <View style={{ width: SCREEN_WIDTH }}>{renderStrokesGainedTab()}</View>
        <View style={{ width: SCREEN_WIDTH }}>{renderDistanceTab()}</View>
      </ScrollView>

      <Animated.View
        style={[
          styles.floatingHeader,
          {
            paddingTop: insets.top,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.headerRow} pointerEvents="box-none">
          <GlassBackButton onPress={() => router.back()} />
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            onPress={() => setShowBattleSummaries(true)}
            style={styles.oneVOneBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.oneVOneText}>1V1</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.segmentContainer} pointerEvents="box-none">
          <View style={styles.segmentRow}>
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab}
                style={styles.segmentTab}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    activeTab === index && styles.segmentLabelActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Animated.View
            style={[
              styles.segmentUnderline,
              {
                width: underlineWidth,
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
      </Animated.View>

      {showBattleSummaries && (
        <View style={[styles.battleSummariesScreen, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={['#FF1C1C', '#E31010', '#B20000', '#800000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.battleSummariesHeader}>
            <TouchableOpacity onPress={() => setShowBattleSummaries(false)} activeOpacity={0.7}>
              <View style={styles.battleSummariesBackCircle}>
                <ChevronDown size={22} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
            </TouchableOpacity>
            <Text style={styles.battleSummariesTitle}>Battle Summaries</Text>
            <View style={{ width: 38 }} />
          </View>
          <ScrollView contentContainerStyle={styles.battleScrollContent} showsVerticalScrollIndicator={false}>
            {battleResults.length === 0 ? (
              <View style={styles.battleEmptyWrap}>
                <Swords size={40} color="rgba(255,255,255,0.35)" />
                <Text style={styles.battleEmptyTitle}>No battles yet</Text>
                <Text style={styles.battleEmptySub}>Start a battle from the Drills tab</Text>
              </View>
            ) : (
              [...battleResults]
                .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                .map((result) => {
                  const isExpanded = expandedBattleId === result.id;
                  const userWon = result.user_score > result.opponent_score;
                  const isDraw = result.user_score === result.opponent_score;
                  const dateStr = new Date(result.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <TouchableOpacity
                      key={result.id}
                      style={styles.battleCard}
                      onPress={() => setExpandedBattleId(isExpanded ? null : result.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.battleCardInner}>
                        <View style={styles.battleRow}>
                          <View style={styles.battlePlayerCol}>
                            {userWon && <View style={styles.bsGreenLine} />}
                            {!userWon && <View style={styles.bsGreenLinePlaceholder} />}
                            <Text style={[styles.battleScore, { color: '#FFFFFF' }]}>{result.user_score}</Text>
                            <Text style={styles.battlePctWhite}>{result.user_percentage}%</Text>
                            {profile?.avatar_url ? (
                              <Image source={{ uri: profile.avatar_url }} style={styles.battleAvatarSmall} />
                            ) : (
                              <View style={styles.battleAvatarSmallPlaceholder}>
                                <User size={14} color="rgba(255,255,255,0.5)" />
                              </View>
                            )}
                          </View>
                          <View style={styles.battleVsCol}>
                            <Text style={styles.battleVsTextWhite}>VS</Text>
                            <View style={[styles.battleBadge, { backgroundColor: isDraw ? 'rgba(255,209,102,0.25)' : userWon ? 'rgba(122,229,130,0.25)' : 'rgba(255,138,128,0.25)' }]}>
                              <Text style={[styles.battleBadgeText, { color: '#FFFFFF' }]}>
                                {isDraw ? 'Draw' : userWon ? 'Won' : 'Lost'}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.battlePlayerCol}
                            onPress={() => {
                              setProfileCardUser({ id: result.opponent_id, username: result.opponent_username, display_name: result.opponent_display_name, avatar_url: result.opponent_avatar_url });
                              setShowProfileCard(true);
                            }}
                            activeOpacity={0.7}
                          >
                            {!userWon && !isDraw && <View style={styles.bsGreenLine} />}
                            {(userWon || isDraw) && <View style={styles.bsGreenLinePlaceholder} />}
                            <Text style={[styles.battleScore, { color: '#FFFFFF' }]}>{result.opponent_score}</Text>
                            <Text style={styles.battlePctWhite}>{result.opponent_percentage}%</Text>
                            {result.opponent_avatar_url ? (
                              <Image source={{ uri: result.opponent_avatar_url }} style={styles.battleAvatarSmall} />
                            ) : (
                              <View style={styles.battleAvatarSmallPlaceholder}>
                                <User size={14} color="rgba(255,255,255,0.5)" />
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                        <View style={styles.battleMeta}>
                          <Text style={styles.battleMetaTextWhite}>{result.battle_name}</Text>
                          <Text style={styles.battleMetaTextWhite}>{dateStr}</Text>
                        </View>
                        {isExpanded && (
                          <View style={styles.battleExpanded}>
                            <Text style={styles.battleExpandedTitleWhite}>ROUND BREAKDOWN</Text>
                            {result.user_round_scores.map((uScore, idx) => {
                              const oScore = result.opponent_round_scores[idx] ?? 0;
                              return (
                                <View key={idx} style={styles.battleExpandedRow}>
                                  <Text style={styles.battleExpandedRoundWhite}>R{idx + 1}</Text>
                                  <Text style={[styles.battleExpandedScoreWhite, uScore > oScore && { fontWeight: '900' as const }]}>
                                    {uScore}/{result.shots_per_round}
                                  </Text>
                                  <Text style={styles.battleExpandedVsWhite}>vs</Text>
                                  <Text style={[styles.battleExpandedScoreWhite, oScore > uScore && { fontWeight: '900' as const }]}>
                                    {oScore}/{result.shots_per_round}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                        <View style={styles.battleExpandHint}>
                          <ChevronDown size={16} color="rgba(255,255,255,0.5)" style={isExpanded ? { transform: [{ rotate: '180deg' }] } : undefined} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
            )}
          </ScrollView>
        </View>
      )}

      <ProfileCard
        visible={showProfileCard}
        onClose={() => setShowProfileCard(false)}
        user={profileCardUser}
        isFollowingUser={profileCardUser ? checkIsFollowing(profileCardUser.id) : false}
        onToggleFollow={profileCardUser ? () => void toggleFollow(profileCardUser.id) : undefined}
      />

      <Modal
        visible={showPlayerPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlayerPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContainer, { paddingTop: insets.top }]}>
            <LinearGradient
              colors={['#1a1a1a', '#0d0d0d']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Player</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPlayerPicker(false);
                  setPlayerSearch('');
                }}
                style={styles.pickerClose}
              >
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSearchWrap}>
              <Search size={16} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search players..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={playerSearch}
                onChangeText={setPlayerSearch}
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderPlayerPickerItem}
              contentContainerStyle={styles.pickerList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.pickerEmpty}>
                  {isLoadingAllUsers ? 'Loading players...' : 'No players found'}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSpacer: {
    flex: 1,
  },
  oneVOneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  oneVOneText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  battleOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  battleScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  battleEmptyWrap: {
    alignItems: 'center' as const,
    paddingTop: 60,
    gap: 10,
  },
  battleEmptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  battleEmptySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
  },
  battleCard: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
    overflow: 'hidden' as const,
  },
  battleCardInner: {
    padding: 16,
  },
  battleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  battlePlayerCol: {
    alignItems: 'center' as const,
    width: 90,
  },
  battleVsCol: {
    alignItems: 'center' as const,
    gap: 6,
  },
  battleVsText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: 'rgba(255,255,255,0.45)',
  },
  battleBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  battleBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  battleScore: {
    fontSize: 30,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  battlePlayerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  battlePct: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
  },
  battleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  battleAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 4,
  },
  battleMeta: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  battleMetaText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  battleExpanded: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  battleExpandedTitle: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  battleExpandedRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
    gap: 16,
  },
  battleExpandedRound: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
    width: 28,
  },
  battleExpandedScore: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 55,
    textAlign: 'center' as const,
  },
  battleExpandedVs: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.35)',
  },
  battleExpandHint: {
    alignItems: 'center' as const,
    marginTop: 6,
  },
  segmentContainer: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  segmentRow: {
    flexDirection: 'row' as const,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.45)',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  segmentUnderline: {
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  pagerScroll: {
    flex: 1,
  },
  tabPage: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabPageContent: {
    paddingBottom: 40,
  },
  vsSection: {
    marginTop: 8,
  },
  vsCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  vsPlayer: {
    flex: 1,
    alignItems: 'center' as const,
  },
  vsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
  },
  vsAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 6,
  },
  vsAvatarEmpty: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed' as const,
    marginBottom: 6,
  },
  vsName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    maxWidth: 100,
    textAlign: 'center' as const,
  },
  vsNameEmpty: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  vsHcp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  vsHcpEmpty: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  vsBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  vsText: {
    fontSize: 13,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },

  statsPreview: {
    marginTop: 20,
  },
  statRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  statValueLeft: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center' as const,
  },
  statNameCenter: {
    flex: 1.4,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  statValueRight: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center' as const,
  },

  sgDropdownSection: {
    marginTop: 16,
  },
  sgDropdownBtn: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sgDropdownLabel: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginRight: 8,
  },
  sgDropdownSublabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    flex: 1,
  },
  sgDropdownMenu: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden' as const,
  },
  sgDropdownItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sgDropdownItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sgDropdownItemLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
    width: 40,
  },
  sgDropdownItemLabelActive: {
    color: '#FFFFFF',
  },
  sgDropdownItemSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    flex: 1,
  },
  sgDropdownItemSubActive: {
    color: 'rgba(255,255,255,0.7)',
  },

  sgCompareSection: {
    marginTop: 16,
  },
  sgHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  sgHeaderSide: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
  },
  sgHeaderMiddle: {
    flex: 1.2,
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
  },
  sgRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sgValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  sgPartLabel: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  sgOverallRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    marginTop: 8,
  },
  sgOverallValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
  },
  sgOverallLabel: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },

  sgSingleSection: {
    marginTop: 40,
    alignItems: 'center' as const,
  },
  sgSingleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as const,
  },
  sgSingleSide: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sgSingleBigNumber: {
    fontSize: 42,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
  },
  sgSingleCenter: {
    alignItems: 'center' as const,
    paddingHorizontal: 12,
  },
  sgSingleLabel: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  sgSingleSublabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
    textAlign: 'center' as const,
  },

  distSection: {
    marginTop: 16,
  },
  distDualHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  distDualHeaderName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
  },
  distCatRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  distCatLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  distDualColumnHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  distDualColHalf: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 10,
  },
  distDualColLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase' as const,
  },
  distDualDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'stretch' as const,
  },
  distDualRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  distDualClubName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  distDualValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  distValueHighlight: {
    color: '#22C55E',
  },
  distValueDim: {
    color: 'rgba(255,255,255,0.3)',
  },

  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  pickerContainer: {
    flex: 1,
    overflow: 'hidden' as const,
  },
  pickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  pickerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pickerSearchWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickerSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#FFFFFF',
  },
  pickerList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pickerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pickerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pickerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pickerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  pickerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  pickerUsername: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  pickerEmpty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center' as const,
    marginTop: 40,
  },
  battleSummariesScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  battleSummariesHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
  },
  battleSummariesBackCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  battleSummariesTitle: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  bsGreenLine: {
    width: 40,
    height: 3,
    backgroundColor: '#22C55E',
    borderRadius: 1.5,
    marginBottom: 4,
  },
  bsGreenLinePlaceholder: {
    width: 40,
    height: 3,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  battleAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 6,
  },
  battleAvatarSmallPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 6,
  },
  battlePlayerLabelWhite: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginTop: 2,
  },
  battlePctWhite: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  battleVsTextWhite: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  battleMetaTextWhite: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  battleExpandedTitleWhite: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  battleExpandedRoundWhite: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 28,
  },
  battleExpandedScoreWhite: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    width: 55,
    textAlign: 'center' as const,
  },
  battleExpandedVsWhite: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.5)',
  },
});
