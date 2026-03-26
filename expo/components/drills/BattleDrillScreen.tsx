import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ArrowLeft, User, Plane, Navigation } from 'lucide-react-native';
import { ActiveBattle } from '@/contexts/BattleContext';
import * as Haptics from 'expo-haptics';

interface BattleDrillScreenProps {
  battle: ActiveBattle;
  onBack: () => void;
  onFinish: (userRoundScores: number[], opponentRoundScores: number[]) => void;
  onNavigateToTab?: (tab: 'flight' | 'position') => void;
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

export default function BattleDrillScreen({ battle, onBack, onFinish, onNavigateToTab }: BattleDrillScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentRound, setCurrentRound] = useState(0);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [userHighest, setUserHighest] = useState<number[]>(
    Array.from({ length: battle.rounds }, () => 0)
  );
  const [opponentHighest, setOpponentHighest] = useState<number[]>(
    Array.from({ length: battle.rounds }, () => 0)
  );

  const [isTiebreaker, setIsTiebreaker] = useState(false);
  const [tiebreakerRound, setTiebreakerRound] = useState(0);
  const [tiebreakerUserHit, setTiebreakerUserHit] = useState(false);
  const [tiebreakerOppHit, setTiebreakerOppHit] = useState(false);
  const [tiebreakerUserScores, setTiebreakerUserScores] = useState<number[]>([]);
  const [tiebreakerOppScores, setTiebreakerOppScores] = useState<number[]>([]);

  const userHits = useMemo(() => userHighest[currentRound] ?? 0, [userHighest, currentRound]);
  const oppHits = useMemo(() => opponentHighest[currentRound] ?? 0, [opponentHighest, currentRound]);

  const userTotalHits = useMemo(() => userHighest.reduce((s, h) => s + h, 0), [userHighest]);
  const oppTotalHits = useMemo(() => opponentHighest.reduce((s, h) => s + h, 0), [opponentHighest]);

  const totalShotsSoFar = useMemo(() => (currentRound + 1) * battle.shots_per_round, [currentRound, battle.shots_per_round]);
  const userAvg = useMemo(() => totalShotsSoFar === 0 ? 0 : Math.round((userTotalHits / totalShotsSoFar) * 100), [userTotalHits, totalShotsSoFar]);
  const oppAvg = useMemo(() => totalShotsSoFar === 0 ? 0 : Math.round((oppTotalHits / totalShotsSoFar) * 100), [oppTotalHits, totalShotsSoFar]);

  const isLastRound = currentRound === battle.rounds - 1;

  const toggleUserTarget = useCallback((targetIndex: number) => {
    const targetNumber = targetIndex + 1;
    setUserHighest(prev => {
      const updated = [...prev];
      if (targetNumber === updated[currentRound]) {
        updated[currentRound] = targetNumber - 1;
      } else {
        updated[currentRound] = targetNumber;
      }
      return updated;
    });
  }, [currentRound]);

  const toggleOpponentTarget = useCallback((targetIndex: number) => {
    const targetNumber = targetIndex + 1;
    setOpponentHighest(prev => {
      const updated = [...prev];
      if (targetNumber === updated[currentRound]) {
        updated[currentRound] = targetNumber - 1;
      } else {
        updated[currentRound] = targetNumber;
      }
      return updated;
    });
  }, [currentRound]);

  const handleTiebreakerNext = useCallback(() => {
    const uHit = tiebreakerUserHit ? 1 : 0;
    const oHit = tiebreakerOppHit ? 1 : 0;

    const newUserScores = [...tiebreakerUserScores, uHit];
    const newOppScores = [...tiebreakerOppScores, oHit];
    setTiebreakerUserScores(newUserScores);
    setTiebreakerOppScores(newOppScores);

    if (uHit !== oHit) {
      console.log('[BattleDrillScreen] Tiebreaker resolved at round', tiebreakerRound + 1);
      const finalUserScores = [...userHighest, ...newUserScores];
      const finalOppScores = [...opponentHighest, ...newOppScores];
      onFinish(finalUserScores, finalOppScores);
    } else {
      console.log('[BattleDrillScreen] Tiebreaker round', tiebreakerRound + 1, 'still tied, continuing');
      setTiebreakerRound(prev => prev + 1);
      setTiebreakerUserHit(false);
      setTiebreakerOppHit(false);
    }
  }, [tiebreakerUserHit, tiebreakerOppHit, tiebreakerUserScores, tiebreakerOppScores, tiebreakerRound, userHighest, opponentHighest, onFinish]);

  const handleNext = useCallback(() => {
    if (isLastRound) {
      const uTotal = userHighest.reduce((s, h) => s + h, 0);
      const oTotal = opponentHighest.reduce((s, h) => s + h, 0);
      if (uTotal === oTotal) {
        console.log('[BattleDrillScreen] Tie detected, entering tiebreaker mode');
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsTiebreaker(true);
        setTiebreakerRound(0);
        setTiebreakerUserHit(false);
        setTiebreakerOppHit(false);
        setTiebreakerUserScores([]);
        setTiebreakerOppScores([]);
      } else {
        onFinish(userHighest, opponentHighest);
      }
    } else {
      setCurrentRound(prev => prev + 1);
    }
  }, [isLastRound, userHighest, opponentHighest, onFinish]);

  const handleQuitPress = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowQuitModal(true);
  }, []);

  const handleQuitConfirm = useCallback(() => {
    console.log('[BattleDrillScreen] Quit battle confirmed');
    setShowQuitModal(false);
    onBack();
  }, [onBack]);

  return (
    <LinearGradient
      colors={['#C62828', '#E53935', '#FF5252']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleQuitPress} activeOpacity={0.7}>
          <View style={styles.backCircle}>
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{battle.battle_name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressBarContainer}>
        {Array.from({ length: battle.rounds }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i <= currentRound ? styles.progressActive : styles.progressInactive,
              i < battle.rounds - 1 && { marginRight: 4 },
            ]}
          />
        ))}
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Round</Text>
          <Text style={styles.statValue}>{currentRound + 1}/{battle.rounds}</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={styles.statLabel}>You</Text>
          <Text style={[styles.statValue, { color: '#7AE582' }]}>{userAvg}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{battle.opponent_display_name.split(' ')[0]}</Text>
          <Text style={[styles.statValue, { color: '#FFD166' }]}>{oppAvg}%</Text>
        </View>
      </View>

      {isTiebreaker ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tiebreakerBanner}>
            <Text style={styles.tiebreakerBannerTitle}>TIEBREAKER</Text>
            <Text style={styles.tiebreakerBannerSub}>Sudden death — 1 shot each until a winner is decided</Text>
            <Text style={styles.tiebreakerRoundLabel}>Round {tiebreakerRound + 1}</Text>
          </View>

          <View style={styles.playerSection}>
            <View style={styles.playerHeader}>
              <View style={styles.playerIcon}>
                <User size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.playerName}>Your Shot</Text>
            </View>
            <View style={styles.tiebreakerRow}>
              <TouchableOpacity
                style={[styles.tiebreakerCircle, tiebreakerUserHit && styles.targetHitUser]}
                onPress={() => setTiebreakerUserHit(!tiebreakerUserHit)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tiebreakerCircleText, tiebreakerUserHit && styles.targetTextHit]}>
                  {tiebreakerUserHit ? 'HIT' : 'MISS'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.playerSection}>
            <View style={styles.playerHeader}>
              <View style={[styles.playerIcon, { backgroundColor: 'rgba(255,209,102,0.3)' }]}>
                <User size={16} color="#FFD166" />
              </View>
              <Text style={styles.playerName}>{battle.opponent_display_name}</Text>
            </View>
            <View style={styles.tiebreakerRow}>
              <TouchableOpacity
                style={[styles.tiebreakerCircle, tiebreakerOppHit && styles.targetHitOpp]}
                onPress={() => setTiebreakerOppHit(!tiebreakerOppHit)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tiebreakerCircleText, tiebreakerOppHit && styles.targetTextHit]}>
                  {tiebreakerOppHit ? 'HIT' : 'MISS'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {tiebreakerUserScores.length > 0 && (
            <View style={styles.tiebreakerHistory}>
              <Text style={styles.tiebreakerHistoryTitle}>PREVIOUS ROUNDS</Text>
              {tiebreakerUserScores.map((uS, idx) => {
                const oS = tiebreakerOppScores[idx] ?? 0;
                return (
                  <View key={idx} style={styles.tiebreakerHistoryRow}>
                    <Text style={styles.tiebreakerHistoryRound}>TB{idx + 1}</Text>
                    <Text style={[styles.tiebreakerHistoryScore, uS === 1 && { color: '#7AE582', fontWeight: '900' as const }]}>
                      {uS === 1 ? 'Hit' : 'Miss'}
                    </Text>
                    <Text style={styles.tiebreakerHistoryVs}>vs</Text>
                    <Text style={[styles.tiebreakerHistoryScore, oS === 1 && { color: '#FFD166', fontWeight: '900' as const }]}>
                      {oS === 1 ? 'Hit' : 'Miss'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.playerSection}>
            <View style={styles.playerHeader}>
              <View style={styles.playerIcon}>
                <User size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.playerName}>Your Score</Text>
              <Text style={styles.playerHitsLabel}>{userHits}/{battle.shots_per_round}</Text>
            </View>
            <View style={styles.targetsGrid}>
              {Array.from({ length: battle.shots_per_round }).map((_, idx) => {
                const targetNumber = idx + 1;
                const isHit = targetNumber <= userHits;
                return (
                  <TouchableOpacity
                    key={`u-${idx}`}
                    style={[styles.targetCircle, isHit && styles.targetHitUser]}
                    onPress={() => toggleUserTarget(idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.targetText, isHit && styles.targetTextHit]}>
                      {targetNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.playerSection}>
            <View style={styles.playerHeader}>
              <View style={[styles.playerIcon, { backgroundColor: 'rgba(255,209,102,0.3)' }]}>
                <User size={16} color="#FFD166" />
              </View>
              <Text style={styles.playerName}>{battle.opponent_display_name}</Text>
              <Text style={styles.playerHitsLabel}>{oppHits}/{battle.shots_per_round}</Text>
            </View>
            <View style={styles.targetsGrid}>
              {Array.from({ length: battle.shots_per_round }).map((_, idx) => {
                const targetNumber = idx + 1;
                const isHit = targetNumber <= oppHits;
                return (
                  <TouchableOpacity
                    key={`o-${idx}`}
                    style={[styles.targetCircle, isHit && styles.targetHitOpp]}
                    onPress={() => toggleOpponentTarget(idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.targetText, isHit && styles.targetTextHit]}>
                      {targetNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerRow}>
          {onNavigateToTab && (
            <TouchableOpacity
              onPress={() => onNavigateToTab('flight')}
              activeOpacity={0.7}
              style={styles.navCircleWrap}
            >
              <View style={styles.navCircle}>
                <Plane size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.navCircleLabel}>Flight</Text>
            </TouchableOpacity>
          )}

          <View style={styles.nextButtonFlex}>
            <TouchableOpacity onPress={isTiebreaker ? handleTiebreakerNext : handleNext} activeOpacity={0.8}>
              <View style={styles.nextButtonOuter}>
                <LinearGradient
                  colors={isTiebreaker ? ['rgba(255,215,0,0.35)', 'rgba(255,165,0,0.25)'] : ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.25)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>
                    {isTiebreaker ? 'Submit Shot' : isLastRound ? 'Finish Battle' : 'Next Round'}
                  </Text>
                  <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </View>

          {onNavigateToTab && (
            <TouchableOpacity
              onPress={() => onNavigateToTab('position')}
              activeOpacity={0.7}
              style={styles.navCircleWrap}
            >
              <View style={styles.navCircle}>
                <Navigation size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.navCircleLabel}>Position</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        visible={showQuitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuitModal(false)}
      >
        <View style={styles.quitOverlay}>
          <LinearGradient
            colors={['#C62828', '#E53935']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quitModal}
          >
            <Text style={styles.quitTitle}>Quit Battle</Text>
            <Text style={styles.quitMessage}>Are you sure you want to quit this battle? Your progress will be lost.</Text>
            <View style={styles.quitButtons}>
              <TouchableOpacity
                style={styles.quitNoBtn}
                onPress={() => setShowQuitModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.quitNoBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quitYesBtn}
                onPress={handleQuitConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.quitYesBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSpacer: { width: 38 },
  progressBarContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressActive: { backgroundColor: '#FFFFFF' },
  progressInactive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  statsBar: {
    flexDirection: 'row' as const,
    marginHorizontal: 20,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: GLASS_BORDER,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playerSection: {
    marginBottom: 8,
  },
  playerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
    gap: 10,
  },
  playerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(122,229,130,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  playerHitsLabel: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  targetsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  targetCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GLASS_BG,
    borderWidth: 2,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  targetHitUser: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  targetHitOpp: {
    backgroundColor: '#D4A017',
    borderColor: '#D4A017',
  },
  targetText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  targetTextHit: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14,
  },
  footer: {
    paddingHorizontal: 16,
  },
  footerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  navCircleWrap: {
    alignItems: 'center' as const,
    gap: 4,
  },
  navCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  navCircleLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  nextButtonFlex: {
    flex: 1,
  },
  nextButtonOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  nextButton: {
    flexDirection: 'row' as const,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  quitOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  quitModal: {
    borderRadius: 22,
    padding: 28,
    width: '80%',
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quitTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  quitMessage: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 24,
  },
  quitButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
  },
  quitNoBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quitNoBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  quitYesBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  quitYesBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#C62828',
  },
  tiebreakerBanner: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  tiebreakerBannerTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#FFD166',
    letterSpacing: 2,
  },
  tiebreakerBannerSub: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    marginTop: 4,
  },
  tiebreakerRoundLabel: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginTop: 10,
  },
  tiebreakerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
  },
  tiebreakerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GLASS_BG,
    borderWidth: 2,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tiebreakerCircleText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  tiebreakerHistory: {
    marginTop: 16,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    padding: 14,
  },
  tiebreakerHistoryTitle: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  tiebreakerHistoryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 6,
    gap: 14,
  },
  tiebreakerHistoryRound: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
    width: 30,
  },
  tiebreakerHistoryScore: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 50,
    textAlign: 'center' as const,
  },
  tiebreakerHistoryVs: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.35)',
  },
});
