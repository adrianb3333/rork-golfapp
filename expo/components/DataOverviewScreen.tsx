import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, BarChart2, TrendingUp, Crosshair, List, Video, Plus, Columns2, Trash2, Dumbbell, ChevronRight, MapPin, Search, Star, X } from 'lucide-react-native';

import { useProfile, UserProfile } from '@/contexts/ProfileContext';
import ProfileCard from '@/components/ProfileCard';
import { useScrollHeader, ScrollHeaderProvider, useScrollHeaderContext, useScrollHeaderPadding } from '@/hooks/useScrollHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabCourse, { CourseTab } from '@/components/PlaSta/TabCourse';
import LiquidGlassCard from '@/components/reusables/LiquidGlassCard';
import SwingThoughtsModal from '@/app/modals/swing-thoughts-modal';
import ClubModal from '@/app/modals/club-modal';
import MentalGameModal from '@/app/modals/mental-game-modal';
import GolfIQModal from '@/app/modals/golf-iq-modal';
import GeneralModal from '@/app/modals/general-modal';
import PreRoundModal from '@/app/modals/pre-round-modal';
import DistancesModal from '@/app/modals/distances-modal';
import StrokesGainedModal from '@/app/modals/strokesgained-modal';
import ShortGameModal from '@/app/modals/shortgame-modal';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import { useSessions } from '@/store/sessionStore';
import { useSwingStore } from '@/store/swingStore';
import { AnalysisSession } from '@/Types';
import { useQuery } from '@tanstack/react-query';
import { fetchAllTimeStats } from '@/services/roundStatsService';
import { useSensor } from '@/contexts/SensorContext';
import SensorLockOverlay from '@/components/SensorLockOverlay';

import { fetchRoundShotCount } from '@/services/shotCountService';
import RoundStatsDisplay from '@/components/PlaSta/RoundStatsDisplay';

type DataTab = 'stats' | 'sg' | 'shots' | 'details' | 'video';

interface TabConfig {
  key: DataTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { key: 'stats', label: 'Stats', icon: <BarChart2 size={18} /> },
  { key: 'sg', label: 'SG', icon: <TrendingUp size={18} /> },
  { key: 'shots', label: 'Shots', icon: <Crosshair size={18} /> },
  { key: 'details', label: 'Details', icon: <List size={18} /> },
  { key: 'video', label: 'Video', icon: <Video size={18} /> },
];

type StatsSegment = 'round' | 'practice';



function StatsContent({ segment }: { segment: StatsSegment }) {
  const scrollHandler = useScrollHeaderContext();
  const topPadding = useScrollHeaderPadding();

  const roundQuery = useQuery({
    queryKey: ['allTimeRoundStats'],
    queryFn: fetchAllTimeStats,
  });

  return (
    <View style={{ flex: 1 }}>
      {segment === 'round' ? (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, paddingTop: topPadding }} onScroll={scrollHandler} scrollEventThrottle={16}>
          {roundQuery.isLoading ? (
            <View style={statsStyles.loadingWrap}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={statsStyles.loadingText}>Loading round stats...</Text>
            </View>
          ) : roundQuery.data ? (
            <RoundStatsDisplay stats={roundQuery.data} headerLabel="All-Time Round Stats" />
          ) : (
            <View style={styles.placeholderCard}>
              <BarChart2 size={32} color="#FFFFFF" />
              <Text style={styles.placeholderTitle}>No Round Data</Text>
              <Text style={styles.placeholderSub}>Complete a round to see your statistics here</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, paddingTop: topPadding }} onScroll={scrollHandler} scrollEventThrottle={16}>
          <View style={styles.placeholderCard}>
            <Dumbbell size={32} color="#FFFFFF" />
            <Text style={styles.placeholderTitle}>No Practice Data</Text>
            <Text style={styles.placeholderSub}>No data for practice yet</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const statsStyles = StyleSheet.create({
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center' as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500' as const,
  },
  categoryCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  categoryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 14,
  },
  categoryHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  categoryBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  categoryAvgRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
    gap: 10,
  },
  categoryAvgLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 80,
  },
  categoryAvgBarWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  categoryAvgBar: {
    height: 8,
    borderRadius: 4,
  },
  categoryAvgValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    width: 42,
    textAlign: 'right' as const,
  },
  drillRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  drillNameWrap: {
    flex: 1,
  },
  drillName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  drillAttempts: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  drillScores: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  drillScoreItem: {
    alignItems: 'center' as const,
  },
  drillScoreLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  drillScoreValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginTop: 2,
  },
  drillScoreDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  drillNoData: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
  },
});

type SGSegment = 'ovve' | 'ott' | 'app' | 'arg' | 'p';

const SG_SEGMENTS: { key: SGSegment; label: string }[] = [
  { key: 'ovve', label: 'Ovve' },
  { key: 'ott', label: 'OTT' },
  { key: 'app', label: 'APP' },
  { key: 'arg', label: 'ARG' },
  { key: 'p', label: 'P' },
];

const SG_CONFIG: Record<SGSegment, {
  title: string;
  subtitle: string;
  value: number;
  trend: number;
  color: string;
  description: string;
  trendDescription: string;
  trendDirection: 'up' | 'down';
  chartData: number[];
}> = {
  ovve: {
    title: 'Overall Game',
    subtitle: 'SG / Round',
    value: -1.3,
    trend: 1.1,
    color: '#5A6B60',
    description: '',
    trendDescription: '',
    trendDirection: 'up',
    chartData: [],
  },
  ott: {
    title: 'Driving Game',
    subtitle: 'SG Driving / Round',
    value: -2.6,
    trend: -1.2,
    color: '#64B5F6',
    description: "You're losing 2.6 strokes on your drives compared to your overall -1.3 strokes gained.",
    trendDescription: 'Okay, time to reset. Your driving game is trending down by -1.2 SG compared to your last 10 round average.',
    trendDirection: 'down',
    chartData: [-1.0, -0.5, -0.8, 0.5, -0.2, 0.3, -0.5, -1.5, -2.0, -2.6],
  },
  app: {
    title: 'Approach Game',
    subtitle: 'SG Approach / Round',
    value: 1.2,
    trend: 1.0,
    color: '#7E57C2',
    description: "You're gaining 1.2 strokes on your approach shots compared to your overall -1.3 strokes gained.",
    trendDescription: 'Way to go! Your approach game is trending up by +1.0 SG compared to your last 10 round average.',
    trendDirection: 'up',
    chartData: [-1.5, -1.0, -0.5, 0.0, -0.8, -1.2, 0.2, 0.5, 1.0, 1.2],
  },
  arg: {
    title: 'Short Game',
    subtitle: 'SG Short / Round',
    value: 1.0,
    trend: 2.3,
    color: '#E91E8C',
    description: "You're gaining 1.0 strokes on your short shots compared to your overall -1.3 strokes gained.",
    trendDescription: 'Way to go! Your short game is trending up by +2.3 SG compared to your last 10 round average.',
    trendDirection: 'up',
    chartData: [-2.0, -1.5, -0.5, -0.8, 0.0, -0.3, 0.2, 0.5, 0.8, 1.0],
  },
  p: {
    title: 'Putting Game',
    subtitle: 'SG Putting / Round',
    value: -0.9,
    trend: 1.6,
    color: '#F4A261',
    description: "You're losing 0.9 strokes on your putts compared to your overall -1.3 strokes gained.",
    trendDescription: 'Way to go! Your putting game is trending up by +1.6 SG compared to your last 10 round average.',
    trendDirection: 'up',
    chartData: [-1.5, -1.0, 1.0, 0.5, -0.2, 0.0, -0.5, 0.2, 0.5, -0.9],
  },
};

const OVERALL_CATEGORIES = [
  { label: 'Driving', value: -2.6, color: '#E57373', barWidth: 45 },
  { label: 'Approach', value: 1.2, color: '#FFFFFF', barWidth: 60 },
  { label: 'Short', value: 1.0, color: '#90A4AE', barWidth: 50 },
  { label: 'Putting', value: -0.9, color: '#B0BEC5', barWidth: 35 },
];

function MiniChart({ data, color, height = 120 }: { data: number[]; color: string; height?: number }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map(Math.abs), 3);
  const chartWidth = 280;
  const barAreaHeight = height;
  const midY = barAreaHeight / 2;
  const stepX = chartWidth / (data.length - 1 || 1);

  const handleChartPress = useCallback((evt: any) => {
    const locationX = evt.nativeEvent.locationX;
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const dotX = i * stepX;
      const dist = Math.abs(locationX - dotX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    setSelectedIndex(closestIdx);
  }, [data.length, stepX]);

  return (
    <View style={sgStyles.chartContainer}>
      <View style={sgStyles.chartYAxis}>
        <Text style={sgStyles.chartYLabel}>3</Text>
        <Text style={sgStyles.chartYLabel}>1.5</Text>
        <Text style={sgStyles.chartYLabel}>0</Text>
        <Text style={sgStyles.chartYLabel}>-1.5</Text>
        <Text style={sgStyles.chartYLabel}>3</Text>
      </View>
      <Pressable onPress={handleChartPress} style={[sgStyles.chartArea, { height: barAreaHeight }]}>
        {data.map((val, i) => {
          const barH = (Math.abs(val) / maxVal) * (barAreaHeight / 2 - 4);
          const isNeg = val < 0;
          return (
            <View
              key={i}
              style={[
                sgStyles.chartBar,
                {
                  left: i * stepX - 8,
                  height: barH,
                  top: isNeg ? midY : midY - barH,
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  width: 16,
                },
              ]}
            />
          );
        })}
        <View style={[sgStyles.chartMidLine, { top: midY }]} />
        {data.map((val, i) => {
          const y = midY - (val / maxVal) * (barAreaHeight / 2 - 4);
          const isSelected = selectedIndex === i;
          return (
            <View key={`dot-${i}`}>
              <View
                style={[
                  sgStyles.chartDot,
                  {
                    left: i * stepX - 4,
                    top: y - 4,
                    backgroundColor: (i === data.length - 1 || isSelected) ? color : 'transparent',
                    borderColor: color,
                    borderWidth: 2,
                  },
                ]}
              />
              {isSelected && (
                <View style={[sgStyles.chartTooltip, { left: i * stepX - 20, top: y - 28 }]}>
                  <Text style={sgStyles.chartTooltipText}>
                    {val >= 0 ? '+' : ''}{val.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
        {data.length > 1 && (
          <View style={sgStyles.chartLineContainer}>
            {data.slice(0, -1).map((val, i) => {
              const y1 = midY - (val / maxVal) * (barAreaHeight / 2 - 4);
              const nextVal = data[i + 1];
              const y2 = midY - (nextVal / maxVal) * (barAreaHeight / 2 - 4);
              const x1 = i * stepX;
              const x2 = (i + 1) * stepX;
              const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
              const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
              return (
                <View
                  key={`line-${i}`}
                  style={[
                    sgStyles.chartLine,
                    {
                      left: x1,
                      top: y1,
                      width: length,
                      backgroundColor: color,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: 'left center',
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
      </Pressable>
    </View>
  );
}

function SGOverallView({ selectedHandicap }: { selectedHandicap: string; }) {
  const scrollHandler = useScrollHeaderContext();
  const topPadding = useScrollHeaderPadding();
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: topPadding }} onScroll={scrollHandler} scrollEventThrottle={16}>
      <View style={sgStyles.titleRow}>
        <Text style={sgStyles.gameTitle}>Overall Game</Text>
        <Text style={sgStyles.handicapBadgeText}>{selectedHandicap}</Text>
      </View>

      <View style={sgStyles.mainCard}>
        <Text style={sgStyles.cardHeader}>Your Strokes Gained (SG) Breakdown</Text>
        <View style={sgStyles.bigValueRow}>
          <Text style={sgStyles.bigValue}>-1.3</Text>
          <View style={sgStyles.trendBadge}>
            <Text style={sgStyles.trendArrow}>▲</Text>
            <Text style={sgStyles.trendValue}>1.1</Text>
          </View>
        </View>
        <Text style={sgStyles.bigSubtitle}>SG / Round</Text>

        <Text style={sgStyles.cardDescription}>
          You lose 1.3 strokes per round compared to a 0 HCP. Your{' '}
          <Text style={sgStyles.descHighlightGreen}>overall game has improved by 1.1 strokes</Text>{' '}
          over your last 10 rounds.
        </Text>

        <View style={sgStyles.categoryGrid}>
          {OVERALL_CATEGORIES.map((cat) => (
            <View key={cat.label} style={sgStyles.categoryItem}>
              <View style={sgStyles.categoryBarContainer}>
                <View style={[sgStyles.categoryBar, { width: cat.barWidth, backgroundColor: cat.color }]} />
              </View>
              <Text style={sgStyles.categoryLabel}>{cat.label}</Text>
              <Text style={[sgStyles.categoryValue, { color: cat.value >= 0 ? '#FFFFFF' : '#E57373' }]}>
                {cat.value >= 0 ? '+' : ''}{cat.value.toFixed(1)}
              </Text>
              <TouchableOpacity style={sgStyles.categorySgLink} activeOpacity={0.7}>
                <Text style={sgStyles.categorySgText}>SG</Text>
                <ChevronRight size={12} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={sgStyles.handicapLink} activeOpacity={0.7}>
          <Text style={sgStyles.handicapLinkText}>Show Handicap Breakdown</Text>
          <ChevronRight size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SGCategoryView({ segment, selectedHandicap }: { segment: SGSegment; selectedHandicap: string }) {
  const scrollHandler = useScrollHeaderContext();
  const topPadding = useScrollHeaderPadding();
  const config = SG_CONFIG[segment];
  const isPositive = config.value >= 0;
  const valueStr = (isPositive ? '+' : '') + config.value.toFixed(1);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: topPadding }} onScroll={scrollHandler} scrollEventThrottle={16}>
      <View style={sgStyles.titleRow}>
        <Text style={sgStyles.gameTitle}>{config.title}</Text>
        <Text style={sgStyles.handicapBadgeText}>{selectedHandicap}</Text>
      </View>

      <View style={sgStyles.bigValueWrap}>
        <Text style={[sgStyles.bigSGValue, { color: isPositive ? '#FFFFFF' : '#E57373' }]}>{valueStr}</Text>
        <Text style={sgStyles.avgSGLabel}>AVG SG</Text>
      </View>

      <MiniChart data={config.chartData} color={config.color} />
    </ScrollView>
  );
}

const HANDICAP_OPTIONS = ['Pro', 'Scratch', '5 Handicap', '10 Handicap', '15 Handicap', '20 Handicap'];

function SGContent({ sgSegment, selectedHandicap, showHandicapPicker, setShowHandicapPicker, setSelectedHandicap }: {
  sgSegment: SGSegment;
  selectedHandicap: string;
  showHandicapPicker: boolean;
  setShowHandicapPicker: (v: boolean) => void;
  setSelectedHandicap: (v: string) => void;
}) {
  const { isPaired } = useSensor();
  return (
    <View style={{ flex: 1 }}>
      {!isPaired && <SensorLockOverlay />}
      {sgSegment === 'ovve' ? (
        <SGOverallView selectedHandicap={selectedHandicap} />
      ) : (
        <SGCategoryView segment={sgSegment} selectedHandicap={selectedHandicap} />
      )}

      <Modal
        visible={showHandicapPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHandicapPicker(false)}
      >
        <Pressable style={sgStyles.handicapOverlay} onPress={() => setShowHandicapPicker(false)}>
          <View style={sgStyles.handicapModal}>
            <View style={sgStyles.handicapModalHeader}>
              <Text style={sgStyles.handicapModalTitle}>Compare Against</Text>
              <TouchableOpacity onPress={() => setShowHandicapPicker(false)}>
                <X size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            {HANDICAP_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[sgStyles.handicapOption, selectedHandicap === option && sgStyles.handicapOptionActive]}
                onPress={() => {
                  setSelectedHandicap(option);
                  setShowHandicapPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[sgStyles.handicapOptionText, selectedHandicap === option && sgStyles.handicapOptionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const sgStyles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  vsIconBtn: {
    padding: 4,
  },
  vsIcon: {
    fontSize: 20,
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    gap: 10,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  handicapBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden' as const,
  },
  bigValueWrap: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  bigSGValue: {
    fontSize: 52,
    fontWeight: '800' as const,
    letterSpacing: -2,
  },
  avgSGLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center' as const,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  bigValueRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
  },
  bigValue: {
    fontSize: 52,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  trendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 10,
    gap: 2,
  },
  trendArrow: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  bigSubtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  descHighlightGreen: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  categoryGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%' as const,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  categoryItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  categoryBarContainer: {
    height: 32,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  categoryBar: {
    height: 24,
    borderRadius: 3,
    minWidth: 20,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  categorySgLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  categorySgText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as const,
  },
  handicapLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    width: '100%' as const,
    justifyContent: 'center' as const,
  },
  handicapLinkText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },

  chartContainer: {
    flexDirection: 'row' as const,
    marginBottom: 20,
    paddingRight: 16,
  },
  chartYAxis: {
    width: 28,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    paddingRight: 6,
  },
  chartYLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500' as const,
  },
  chartArea: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  chartBar: {
    position: 'absolute' as const,
    borderRadius: 3,
  },
  chartMidLine: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chartDot: {
    position: 'absolute' as const,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLineContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartLine: {
    position: 'absolute' as const,
    height: 2,
    transformOrigin: 'left center',
  },
  chartTooltip: {
    position: 'absolute' as const,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  chartTooltipText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  handicapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  handicapModal: {
    backgroundColor: 'rgba(0,40,80,0.9)',
    borderRadius: 16,
    width: '80%' as const,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  handicapModalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  handicapModalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  handicapOption: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  handicapOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  handicapOptionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  handicapOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
});

type ShotsSegment = 'round' | 'practice';

function ShotsContent({ segment }: { segment: ShotsSegment }) {
  const topPadding = useScrollHeaderPadding();
  const { isPaired } = useSensor();
  const roundShotsQuery = useQuery({
    queryKey: ['totalRoundShots'],
    queryFn: fetchRoundShotCount,
  });

  return (
    <View style={{ flex: 1 }}>
      {!isPaired && <SensorLockOverlay />}
      {segment === 'round' ? (
        <View style={[shotsStyles.totalContainer, { paddingTop: topPadding + 20 }]}>
          {roundShotsQuery.isLoading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={shotsStyles.totalValueWrap}>
              <Text style={shotsStyles.totalValue}>{roundShotsQuery.data ?? 0}</Text>
              <Text style={shotsStyles.totalLabel}>Total Shots</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Dumbbell size={32} color="rgba(255,255,255,0.3)" />
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, fontWeight: '600' as const, marginTop: 12 }}>No data for practice yet</Text>
        </View>
      )}
    </View>
  );
}

const shotsStyles = StyleSheet.create({
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  totalContainer: {
    alignItems: 'flex-end' as const,
    paddingRight: 24,
    paddingTop: 20,
  },
  totalValueWrap: {
    alignItems: 'flex-end' as const,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});

type DetailsSegment = 'courses' | 'notes' | 'thegame';

interface GolfCourse {
  id: string;
  name: string;
  clubName: string;
  holes: number;
  par: number;
  city: string;
  country: string;
  rating: number;
  distance: number;
  played: boolean;
}

const DETAILS_STORAGE_KEY_FAVORITES = 'play_setup_favorite_courses';

const DETAILS_MOCK_COURSES: GolfCourse[] = [
  { id: 'c1', name: 'Hulta Golfklubb', clubName: 'Hulta GK', holes: 18, par: 72, city: 'Bollebygd', country: 'Sweden', rating: 4.0, distance: 2.0, played: true },
  { id: 'c2', name: 'Chalmers Golfklubb', clubName: 'Chalmers Golfklubb', holes: 18, par: 71, city: 'Landvetter', country: 'Sweden', rating: 4.0, distance: 18.7, played: true },
  { id: 'c3', name: 'Borås Golfklubb', clubName: 'Norra Banan', holes: 18, par: 72, city: 'Borås', country: 'Sweden', rating: 4.5, distance: 21.2, played: true },
  { id: 'c4', name: 'Borås Golfklubb', clubName: 'Södra Banan', holes: 18, par: 69, city: 'Borås', country: 'Sweden', rating: 3.5, distance: 21.3, played: false },
  { id: 'c5', name: 'Marks Golfklubb', clubName: 'Kinnaborg', holes: 18, par: 70, city: 'Kinna', country: 'Sweden', rating: 4.0, distance: 21.3, played: false },
  { id: 'c6', name: 'Göteborg Golfklubb', clubName: 'Hovås', holes: 18, par: 72, city: 'Göteborg', country: 'Sweden', rating: 4.5, distance: 35.1, played: true },
  { id: 'c7', name: 'Kungsbacka Golfklubb', clubName: 'Hamra', holes: 18, par: 71, city: 'Kungsbacka', country: 'Sweden', rating: 3.5, distance: 42.0, played: false },
  { id: 'c8', name: 'Varberg Golfklubb', clubName: 'Varberg GK', holes: 18, par: 72, city: 'Varberg', country: 'Sweden', rating: 4.0, distance: 55.8, played: true },
  { id: 'c9', name: 'Falsterbo Golfklubb', clubName: 'Falsterbo GK', holes: 18, par: 71, city: 'Falsterbo', country: 'Sweden', rating: 5.0, distance: 280.0, played: false },
  { id: 'c10', name: 'Barsebäck Golf & CC', clubName: 'Masters Course', holes: 18, par: 73, city: 'Barsebäck', country: 'Sweden', rating: 4.5, distance: 260.0, played: true },
  { id: 'c11', name: 'Quinta do Lago', clubName: 'South Course', holes: 18, par: 72, city: 'Almancil', country: 'Portugal', rating: 4.5, distance: 3100.0, played: false },
  { id: 'c12', name: 'Valderrama Golf Club', clubName: 'Valderrama', holes: 18, par: 71, city: 'Sotogrande', country: 'Spain', rating: 5.0, distance: 3400.0, played: false },
];

const DETAILS_COUNTRIES = ['Alla länder', 'Sweden', 'Portugal', 'Spain'];

type NotesModalKey = 'swing-thoughts' | 'club' | 'mental-game' | 'golf-iq' | 'general' | 'pre-round' | 'distances' | 'strokesgained' | 'shortgame' | null;

const NOTES_DATA: { title: string; description: string; modalKey: NotesModalKey }[] = [
  { title: 'Swing Thoughts', description: 'Describe Every Detail Of Your Swing', modalKey: 'swing-thoughts' },
  { title: 'Club', description: 'Learn your Club Difference', modalKey: 'club' },
  { title: 'Mental Game', description: '"Golf is 90% mental and 10% physical."', modalKey: 'mental-game' },
  { title: 'Golf IQ', description: 'Manage Yourself On The Course', modalKey: 'golf-iq' },
  { title: 'General', description: 'Your Own Focus', modalKey: 'general' },
];

const PREPARATION_DATA = {
  title: 'Pre Round',
  description: 'Create routines to perform better!',
  modalKey: 'pre-round' as NotesModalKey,
};

const CLUB_DATA_BUTTONS: { title: string; modalKey: NotesModalKey }[] = [
  { title: 'Distances', modalKey: 'distances' },
  { title: 'Strokes Gained', modalKey: 'strokesgained' },
  { title: 'Short Game', modalKey: 'shortgame' },
];

const THE_GAME_SECTIONS = [
  'The Fundamentals (The "Setup")',
  'The Full Swing',
  'The Short Game (Scoring)',
  'Course Management & Mental Game',
  'Rules and Etiquette',
  'Equipment & Fit',
  'Environmental & Weather Factors',
  'Turf & Terrain Variables',
  'Green Anatomy & Physics',
  'The Psychology of "Rub of the Green"',
];

function DetailsCoursesList({ courseTab, searchQuery, selectedCountry, favorites, toggleFavorite }: { courseTab: CourseTab; searchQuery: string; selectedCountry: string; favorites: string[]; toggleFavorite: (courseId: string) => void }) {
  const scrollHandler = useScrollHeaderContext();
  const topPadding = useScrollHeaderPadding();

  const filteredCourses = useMemo(() => {
    let list = [...DETAILS_MOCK_COURSES];
    if (selectedCountry !== 'Alla länder') {
      list = list.filter((c) => c.country === selectedCountry);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.clubName.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }
    if (courseTab === 'played') {
      list = list.filter((c) => c.played);
    } else if (courseTab === 'favorite') {
      list = list.filter((c) => favorites.includes(c.id));
    } else {
      list.sort((a, b) => a.distance - b.distance);
    }
    return list;
  }, [courseTab, searchQuery, selectedCountry, favorites]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          color={i <= Math.floor(rating) ? '#FFB74D' : 'rgba(255,255,255,0.3)'}
          fill={i <= Math.floor(rating) ? '#FFB74D' : 'transparent'}
        />
      );
    }
    return <View style={detailsStyles.starsRow}>{stars}</View>;
  };

  const renderCourseItem = ({ item }: { item: GolfCourse }) => {
    const isFav = favorites.includes(item.id);
    return (
      <View style={detailsStyles.courseRow}>
        <View style={detailsStyles.courseInfo}>
          <Text style={detailsStyles.courseName}>{item.name}</Text>
          <View style={detailsStyles.courseSubRow}>
            <Text style={detailsStyles.courseClub}>
              {item.clubName}, {item.holes}/{item.par}
            </Text>
            <MapPin size={12} color="rgba(255,255,255,0.5)" />
          </View>
          <Text style={detailsStyles.courseCity}>{item.city}, {item.country}</Text>
          <View style={detailsStyles.courseBottom}>
            {renderStars(item.rating)}
            <Text style={detailsStyles.courseDistance}>{item.distance.toFixed(1)} km</Text>
          </View>
        </View>
        <TouchableOpacity
          style={detailsStyles.favBtn}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Star
            size={20}
            color={isFav ? '#FFB74D' : 'rgba(255,255,255,0.3)'}
            fill={isFav ? '#FFB74D' : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      data={filteredCourses}
      keyExtractor={(item) => item.id}
      renderItem={renderCourseItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: topPadding }}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      ListEmptyComponent={
        <View style={detailsStyles.emptyState}>
          <Text style={detailsStyles.emptyText}>
            {courseTab === 'favorite'
              ? 'Inga favoritbanor ännu'
              : 'Inga banor hittades'}
          </Text>
        </View>
      }
    />
  );
}

function DetailsNotesContent() {
  const scrollHandler = useScrollHeaderContext();
  const topPadding = useScrollHeaderPadding();
  const [activeModal, setActiveModal] = useState<NotesModalKey>(null);

  const closeModal = () => setActiveModal(null);

  const renderModal = () => {
    switch (activeModal) {
      case 'swing-thoughts': return <SwingThoughtsModal onClose={closeModal} />;
      case 'club': return <ClubModal onClose={closeModal} />;
      case 'mental-game': return <MentalGameModal onClose={closeModal} />;
      case 'golf-iq': return <GolfIQModal onClose={closeModal} />;
      case 'general': return <GeneralModal onClose={closeModal} />;
      case 'pre-round': return <PreRoundModal onClose={closeModal} />;
      case 'distances': return <DistancesModal onClose={closeModal} />;
      case 'strokesgained': return <StrokesGainedModal onClose={closeModal} />;
      case 'shortgame': return <ShortGameModal onClose={closeModal} />;
      default: return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[detailsStyles.notesScrollContent, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={detailsStyles.clubDataSection}>
          <View style={detailsStyles.clubDataHeaderRow}>
            <Text style={detailsStyles.clubDataHeader}>Club DATA</Text>
            <Text style={detailsStyles.clubDataSubtext}>(Sensors Needed)</Text>
          </View>
          <View style={detailsStyles.clubDataButtons}>
            {CLUB_DATA_BUTTONS.map((btn, index) => (
              <Pressable
                key={index}
                style={detailsStyles.clubDataButton}
                onPress={() => setActiveModal(btn.modalKey)}
              >
                <Text style={detailsStyles.clubDataButtonTitle}>{btn.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {NOTES_DATA.map((note, index) => (
          <Pressable
            key={index}
            onPress={() => setActiveModal(note.modalKey)}
            style={detailsStyles.noteCardContainer}
          >
            <LiquidGlassCard containerStyle={detailsStyles.noteCard}>
              <View style={detailsStyles.noteCardContent}>
                <View style={detailsStyles.noteTextContainer}>
                  <Text style={detailsStyles.noteCardTitle}>{note.title}</Text>
                  <Text style={detailsStyles.noteCardDescription}>{note.description}</Text>
                </View>
              </View>
            </LiquidGlassCard>
          </Pressable>
        ))}

        <Text style={detailsStyles.notesSectionTitle}>Preparation!</Text>

        <Pressable
          onPress={() => setActiveModal(PREPARATION_DATA.modalKey)}
          style={detailsStyles.noteCardContainer}
        >
          <LiquidGlassCard containerStyle={detailsStyles.noteCard}>
            <View style={detailsStyles.noteCardContent}>
              <View style={detailsStyles.noteTextContainer}>
                <Text style={detailsStyles.noteCardTitle}>{PREPARATION_DATA.title}</Text>
                <Text style={detailsStyles.noteCardDescription}>{PREPARATION_DATA.description}</Text>
              </View>
            </View>
          </LiquidGlassCard>
        </Pressable>
      </ScrollView>

      <Modal
        visible={activeModal !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        {renderModal()}
      </Modal>
    </View>
  );
}

function TheGameContent() {
  const scrollHandler = useScrollHeaderContext();
  const topPadding = useScrollHeaderPadding();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[detailsStyles.gameScrollContent, { paddingTop: topPadding + 16 }]}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {THE_GAME_SECTIONS.map((section, index) => (
        <View key={index} style={detailsStyles.gameSectionCard}>
          <View style={detailsStyles.gameSectionNumberWrap}>
            <Text style={detailsStyles.gameSectionNumber}>{index + 1}</Text>
          </View>
          <Text style={detailsStyles.gameSectionTitle}>{section}</Text>
          <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
        </View>
      ))}
    </ScrollView>
  );
}

function DetailsContent({ detailsSegment, courseTab, courseSearchQuery, courseSelectedCountry, courseFavorites, toggleCourseFavorite }: { detailsSegment: DetailsSegment; courseTab: CourseTab; courseSearchQuery: string; courseSelectedCountry: string; courseFavorites: string[]; toggleCourseFavorite: (courseId: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      {detailsSegment === 'courses' && <DetailsCoursesList courseTab={courseTab} searchQuery={courseSearchQuery} selectedCountry={courseSelectedCountry} favorites={courseFavorites} toggleFavorite={toggleCourseFavorite} />}
      {detailsSegment === 'notes' && <DetailsNotesContent />}
      {detailsSegment === 'thegame' && <TheGameContent />}
    </View>
  );
}

const detailsStyles = StyleSheet.create({
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as const,
  },
  countryPicker: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  countryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
    flex: 1,
  },
  countryChevron: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  countryDropdown: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden' as const,
  },
  countryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  countryOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  countryOptionText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  countryOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  tabRow: {
    marginBottom: 8,
  },
  courseRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 2,
  },
  courseClub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  courseCity: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  courseBottom: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  courseDistance: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500' as const,
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
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  notesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  clubDataSection: {
    marginBottom: 20,
  },
  clubDataHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginBottom: 10,
    gap: 6,
  },
  clubDataHeader: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  clubDataSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500' as const,
  },
  clubDataButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  clubDataButton: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  clubDataButtonTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  noteCardContainer: {
    marginBottom: 12,
  },
  noteCard: {
    width: '100%' as const,
  },
  noteCardContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  noteTextContainer: {
    flex: 1,
    gap: 4,
  },
  noteCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFCC00',
  },
  noteCardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  notesSectionTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 32,
    textAlign: 'center' as const,
  },
  gameScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  gameSectionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 14,
  },
  gameSectionNumberWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  gameSectionNumber: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  gameSectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 0) return `Today at ${time}`;
    if (diffDays === 1) return `Yesterday at ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
  } catch {
    return 'Recently';
  }
}

function VideoContent() {
  const scrollHandler = useScrollHeaderContext();
  const topPadding = useScrollHeaderPadding();
  const router = useRouter();
  const { sessions = [], addSession, removeSession } = useSessions();
  const { setVideoUri, setComparisonMode, clearAll } = useSwingStore();

  const pickAndAnalyze = useCallback(async (comparison: boolean) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;
      
      clearAll();
      const uri1 = result.assets[0].uri;
      setVideoUri(uri1, 0);

      let finalUris = [uri1];
      let finalComparisonMode = false;

      if (comparison) {
        const result2 = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: true,
          quality: 1,
        });

        if (!result2.canceled && result2.assets?.[0]) {
          const uri2 = result2.assets[0].uri;
          setVideoUri(uri2, 1);
          finalUris.push(uri2);
          finalComparisonMode = true;
        }
      }

      setComparisonMode(finalComparisonMode);
      addSession(finalUris);

      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/modals/vid-modal');
    } catch {
      Alert.alert('Error', 'Failed to pick video.');
    }
  }, [clearAll, setVideoUri, setComparisonMode, addSession, router]);

  const handleOpenSession = useCallback((session: AnalysisSession) => {
    clearAll();
    if (!session?.videoUris?.[0]) {
      Alert.alert('Missing video', 'This session does not have a valid video.');
      return;
    }
    
    setVideoUri(session.videoUris[0], 0);
    if (session.isComparison && session.videoUris[1]) {
      setVideoUri(session.videoUris[1], 1);
      setComparisonMode(true);
    } else {
      setComparisonMode(false);
    }
    router.push('/modals/vid-modal');
  }, [clearAll, setVideoUri, setComparisonMode, router]);

  const renderSession = useCallback(({ item }: { item: AnalysisSession }) => (
    <Pressable
      style={({ pressed }) => [styles.videoSessionCard, pressed && styles.videoSessionCardPressed]}
      onPress={() => handleOpenSession(item)}
    >
      <View style={styles.videoSessionIcon}>
        {item.isComparison ? <Columns2 size={18} color="#FFFFFF" /> : <Video size={18} color="#FFFFFF" />}
      </View>
      <View style={styles.videoSessionInfo}>
        <Text style={styles.videoSessionTitle}>{item.isComparison ? 'Comparison' : 'Swing Analysis'}</Text>
        <Text style={styles.videoSessionDate}>{formatSessionDate(item.createdAt)}</Text>
      </View>
      <Pressable onPress={() => removeSession(item.id)} style={styles.videoDeleteBtn}>
        <Trash2 size={14} color="rgba(255,255,255,0.5)" />
      </Pressable>
    </Pressable>
  ), [handleOpenSession, removeSession]);

  return (
    <FlatList
      data={Array.isArray(sessions) ? sessions : []}
      keyExtractor={(item) => item.id}
      renderItem={renderSession}
      style={styles.tabContent}
      contentContainerStyle={[styles.videoListContent, { paddingTop: topPadding }]}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      ListHeaderComponent={
        <View style={styles.videoActionsSection}>
          <Text style={styles.videoHeaderTitle}>Swing Analyzer</Text>
          <Pressable style={styles.videoUploadButton} onPress={() => pickAndAnalyze(false)}>
            <Plus size={24} color="#FFFFFF" />
            <Text style={styles.videoUploadTitle}>New Analysis</Text>
          </Pressable>
          <Pressable style={styles.videoCompareButton} onPress={() => pickAndAnalyze(true)}>
            <Columns2 size={22} color="#FFFFFF" />
            <Text style={styles.videoCompareTitle}>Compare Swings</Text>
          </Pressable>
          {sessions.length > 0 && <Text style={styles.videoSectionTitle}>History</Text>}
        </View>
      }
    />
  );
}

const HEADER_BAR_HEIGHT = 44;
const SEGMENT_HEIGHT = 40;
const DETAILS_COURSES_SEARCH_HEIGHT = 140;

const DETAIL_SEGMENTS: { key: DetailsSegment; label: string }[] = [
  { key: 'courses', label: 'Courses' },
  { key: 'notes', label: 'Notes' },
  { key: 'thegame', label: 'The Game' },
];





export default function DataOverviewScreen() {
  const [activeTab, setActiveTab] = useState<DataTab>('stats');

  const { openSidebar, navigateTo, dataOverviewInitialTab, clearDataOverviewInitialTab, dataOverviewInitialStatsSegment, clearDataOverviewInitialStatsSegment } = useAppNavigation();

  const { isFollowing: checkIsFollowing, toggleFollow } = useProfile();
  const [profileCardUser] = useState<UserProfile | null>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const insets = useSafeAreaInsets();

  const [statsSegment, setStatsSegment] = useState<StatsSegment>(dataOverviewInitialStatsSegment || 'round');
  const [sgSegment, setSgSegment] = useState<SGSegment>('ovve');
  const [shotsSegment, setShotsSegment] = useState<ShotsSegment>('round');
  const [detailsSegment, setDetailsSegment] = useState<DetailsSegment>('courses');
  const [selectedHandicap, setSelectedHandicap] = useState<string>('Scratch');
  const [showHandicapPicker, setShowHandicapPicker] = useState(false);

  const [courseTab, setCourseTab] = useState<CourseTab>('nearby');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseSelectedCountry, setCourseSelectedCountry] = useState('Alla länder');
  const [courseShowCountryPicker, setCourseShowCountryPicker] = useState(false);
  const [courseFavorites, setCourseFavorites] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(DETAILS_STORAGE_KEY_FAVORITES);
        if (stored) setCourseFavorites(JSON.parse(stored));
      } catch (e) {
        console.log('[DataOverview] Error loading favorites:', e);
      }
    };
    void load();
  }, []);

  const toggleCourseFavorite = useCallback(async (courseId: string) => {
    setCourseFavorites((prev) => {
      const updated = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      AsyncStorage.setItem(DETAILS_STORAGE_KEY_FAVORITES, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const coursePlayedCount = useMemo(
    () => DETAILS_MOCK_COURSES.filter((c) => c.played).length,
    []
  );

  useEffect(() => {
    if (dataOverviewInitialStatsSegment) {
      setStatsSegment(dataOverviewInitialStatsSegment);
      clearDataOverviewInitialStatsSegment();
    }
  }, [dataOverviewInitialStatsSegment, clearDataOverviewInitialStatsSegment]);

  useEffect(() => {
    if (dataOverviewInitialTab && ['stats', 'sg', 'shots', 'details', 'video'].includes(dataOverviewInitialTab)) {
      setActiveTab(dataOverviewInitialTab as DataTab);
      clearDataOverviewInitialTab();
    }
  }, [dataOverviewInitialTab, clearDataOverviewInitialTab]);

  const hasSegment = activeTab === 'stats' || activeTab === 'sg' || activeTab === 'shots' || activeTab === 'details';
  const isDetailsCourses = activeTab === 'details' && detailsSegment === 'courses';
  const totalHeaderHeight = HEADER_BAR_HEIGHT + (hasSegment ? SEGMENT_HEIGHT : 0) + (isDetailsCourses ? DETAILS_COURSES_SEARCH_HEIGHT : 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'stats': return <StatsContent segment={statsSegment} />;
      case 'sg': return <SGContent sgSegment={sgSegment} selectedHandicap={selectedHandicap} showHandicapPicker={showHandicapPicker} setShowHandicapPicker={setShowHandicapPicker} setSelectedHandicap={setSelectedHandicap} />;
      case 'shots': return <ShotsContent segment={shotsSegment} />;
      case 'details': return <DetailsContent detailsSegment={detailsSegment} courseTab={courseTab} courseSearchQuery={courseSearchQuery} courseSelectedCountry={courseSelectedCountry} courseFavorites={courseFavorites} toggleCourseFavorite={toggleCourseFavorite} />;
      case 'video': return <VideoContent />;
    }
  };

  const { headerTranslateY, onScroll: onHeaderScroll } = useScrollHeader(totalHeaderHeight);
  const contentPaddingTop = insets.top + totalHeaderHeight;
  const scrollHeaderValue = useMemo(() => ({ onScroll: onHeaderScroll, contentPaddingTop }), [onHeaderScroll, contentPaddingTop]);



  const activeTabLabel = useMemo(() => {
    const found = tabs.find(t => t.key === activeTab);
    return found ? found.label : 'Stats';
  }, [activeTab]);

  const renderSegmentControl = () => {
    if (activeTab === 'stats') {
      return (
        <View style={styles.headerSegmentWrap}>
          <View style={styles.headerSegmentControl}>
            <TouchableOpacity
              style={[styles.headerSegmentButton, statsSegment === 'round' && styles.headerSegmentButtonActive]}
              onPress={() => setStatsSegment('round')}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerSegmentText, statsSegment === 'round' && styles.headerSegmentTextActive]}>Round</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerSegmentButton, statsSegment === 'practice' && styles.headerSegmentButtonActive]}
              onPress={() => setStatsSegment('practice')}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerSegmentText, statsSegment === 'practice' && styles.headerSegmentTextActive]}>Practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (activeTab === 'sg') {
      return (
        <View style={styles.headerSegmentWrap}>
          <View style={styles.headerSegmentControl}>
            {SG_SEGMENTS.map((seg) => (
              <TouchableOpacity
                key={seg.key}
                style={[styles.headerSegmentButton, sgSegment === seg.key && styles.headerSegmentButtonActive]}
                onPress={() => setSgSegment(seg.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerSegmentText, sgSegment === seg.key && styles.headerSegmentTextActive]}>
                  {seg.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    if (activeTab === 'shots') {
      return (
        <View style={styles.headerSegmentWrap}>
          <View style={styles.headerSegmentControl}>
            <TouchableOpacity
              style={[styles.headerSegmentButton, shotsSegment === 'round' && styles.headerSegmentButtonActive]}
              onPress={() => setShotsSegment('round')}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerSegmentText, shotsSegment === 'round' && styles.headerSegmentTextActive]}>Round</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerSegmentButton, shotsSegment === 'practice' && styles.headerSegmentButtonActive]}
              onPress={() => setShotsSegment('practice')}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerSegmentText, shotsSegment === 'practice' && styles.headerSegmentTextActive]}>Practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (activeTab === 'details') {
      return (
        <View style={styles.headerSegmentWrap}>
          <View style={styles.headerSegmentControl}>
            {DETAIL_SEGMENTS.map((seg) => (
              <TouchableOpacity
                key={seg.key}
                style={[styles.headerSegmentButton, detailsSegment === seg.key && styles.headerSegmentButtonActive]}
                onPress={() => setDetailsSegment(seg.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerSegmentText, detailsSegment === seg.key && styles.headerSegmentTextActive]}>
                  {seg.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <LinearGradient
      colors={['#0F6FAF', '#3FB8E8', '#BFF3FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.headerAbsolute, { transform: [{ translateY: headerTranslateY }], paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} activeOpacity={0.7}>
              <Menu size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{activeTabLabel}</Text>
            <TouchableOpacity onPress={() => navigateTo('mygame')} style={styles.menuBtn} activeOpacity={0.7}>
              <Image source={require('@/assets/images/golferscrib-logo.png')} style={styles.logoIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          {renderSegmentControl()}
          {isDetailsCourses && (
            <View style={styles.headerSearchSection}>
              <View style={styles.headerSearchBar}>
                <Search size={16} color="rgba(255,255,255,0.6)" />
                <TextInput
                  style={styles.headerSearchInput}
                  placeholder="Sök"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={courseSearchQuery}
                  onChangeText={setCourseSearchQuery}
                />
              </View>
              <View style={styles.headerFilterRow}>
                <Text style={styles.headerFilterLabel}>Filter:</Text>
                <TouchableOpacity
                  style={styles.headerCountryPicker}
                  onPress={() => setCourseShowCountryPicker(true)}
                >
                  <Text style={styles.headerCountryText}>{courseSelectedCountry}</Text>
                  <Text style={styles.headerCountryChevron}>▼</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.headerTabRow}>
                <TabCourse
                  activeTab={courseTab}
                  onTabChange={setCourseTab}
                  playedCount={coursePlayedCount}
                />
              </View>
            </View>
          )}
      </Animated.View>

      <View style={styles.body}>
        <ScrollHeaderProvider value={scrollHeaderValue}>
          {renderContent()}
        </ScrollHeaderProvider>
      </View>

      <ProfileCard
        visible={showProfileCard}
        onClose={() => setShowProfileCard(false)}
        user={profileCardUser}
        isFollowingUser={profileCardUser ? checkIsFollowing(profileCardUser.id) : false}
        onToggleFollow={profileCardUser ? () => void toggleFollow(profileCardUser.id) : undefined}
      />

      <Modal
        visible={courseShowCountryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setCourseShowCountryPicker(false)}
      >
        <Pressable style={sgStyles.handicapOverlay} onPress={() => setCourseShowCountryPicker(false)}>
          <View style={sgStyles.handicapModal}>
            <View style={sgStyles.handicapModalHeader}>
              <Text style={sgStyles.handicapModalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setCourseShowCountryPicker(false)}>
                <X size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            {DETAILS_COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country}
                style={[sgStyles.handicapOption, courseSelectedCountry === country && sgStyles.handicapOptionActive]}
                onPress={() => {
                  setCourseSelectedCountry(country);
                  setCourseShowCountryPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[sgStyles.handicapOptionText, courseSelectedCountry === country && sgStyles.handicapOptionTextActive]}>
                  {country}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <View style={[styles.tabBarSafe, { paddingBottom: insets.bottom }]}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <View style={isActive ? styles.iconActive : styles.iconInactive}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  })}
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerAbsolute: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 2,
    height: HEADER_BAR_HEIGHT,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logoIcon: {
    width: 32,
    height: 20,
  },

  sgHeaderTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  vsHeaderBtn: {
    padding: 4,
  },
  vsHeaderIcon: {
    fontSize: 18,
  },
  headerSegmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 4,
  },
  headerSegmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerSegmentButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  headerSegmentButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  headerSegmentText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  headerSegmentTextActive: {
    color: '#FFFFFF',
  },
  headerSearchSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  headerSearchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 5,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 8,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  headerFilterRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    gap: 8,
  },
  headerFilterLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as const,
  },
  headerCountryPicker: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  headerCountryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
    flex: 1,
  },
  headerCountryChevron: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  headerTabRow: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  body: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  placeholderCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 20,
    gap: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  placeholderSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  statGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 6,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  sgRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 12,
  },
  sgLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 80,
  },
  sgBarWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sgBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  sgValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    width: 36,
    textAlign: 'right' as const,
  },
  videoHeaderTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  videoListContent: {
    paddingBottom: 40,
  },
  videoActionsSection: {
    paddingTop: 4,
    gap: 12,
  },
  videoUploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  videoUploadTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  videoCompareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  videoCompareTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  videoSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
    textTransform: 'uppercase' as const,
  },
  videoSessionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  videoSessionCardPressed: {
    opacity: 0.7,
  },
  videoSessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  videoSessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoSessionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  videoSessionDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  videoDeleteBtn: {
    padding: 8,
  },
  tabBarSafe: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingTop: 3,
    paddingBottom: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 2,
  },
  iconActive: {},
  iconInactive: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600' as const,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});
