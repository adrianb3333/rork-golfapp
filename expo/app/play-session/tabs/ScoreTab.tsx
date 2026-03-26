import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, List } from 'lucide-react-native';
import { useScoring } from '@/contexts/ScoringContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useSession } from '@/contexts/SessionContext';
import { getToPar } from '@/mocks/courseData';
import { fetchGolfWeather } from '@/services/weatherApi';
import Digit from '@/components/Scorinpu/Digit';
import Fairway from '@/components/Scorinpu/Fairway';
import Green from '@/components/Scorinpu/Green';
import ExtraShot from '@/components/Scorinpu/ExtraShot';
import RoundSumModal from '@/app/modals/roundsum-modal';
import type { FairwayHit, PuttDistance, GreenMiss } from '@/contexts/ScoringContext';

export default function ScoreTab() {
  const {
    currentHole,
    currentHoleIndex,
    currentHoleScore,
    inputStep,
    holes,
    totalScore,
    totalPar,
    holesPlayed,
    courseName,
    setScore,
    setFairwayData,
    setGreenData,
    setExtraShotData,
    goToNextHole,
    goToPrevHole,
    goBackStep,
    clearHoleScore,
    setShowScoreboard,
    allScoringPlayers,
    currentScoringPlayerIndex,
    currentScoringPlayer,
    isCreatorScoring,
    getPlayerTotalScore,
    getPlayerTotalPar,
    getPlayerHolesPlayed,
  } = useScoring();

  const { profile } = useProfile();
  const { sessionStartTime, roundName, roundDate } = useSession();

  const [showRoundSum, setShowRoundSum] = useState(false);
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    const loadTemp = async () => {
      try {
        if (Platform.OS !== 'web' || navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          const result = await fetchGolfWeather(position.coords.latitude, position.coords.longitude);
          if (result) setTemperature(result.temp);
        }
      } catch {
        const result = await fetchGolfWeather(59.33, 18.07);
        if (result) setTemperature(result.temp);
      }
    };
    void loadTemp();
  }, []);

  const playerName = profile?.display_name || profile?.username || 'Spelare';
  const playerHcp = 0;
  const toParDisplay = holesPlayed > 0 ? getToPar(totalScore, totalPar) : 'E';

  const allHolesScored = holesPlayed >= holes.length && holes.length > 0;

  const getPlayerToParDisplay = useCallback((playerId: string): string => {
    const pScore = getPlayerTotalScore(playerId);
    const pPar = getPlayerTotalPar(playerId);
    const pPlayed = getPlayerHolesPlayed(playerId);
    if (pPlayed > 0) return getToPar(pScore, pPar);
    return 'E';
  }, [getPlayerTotalScore, getPlayerTotalPar, getPlayerHolesPlayed]);

  const formatDuration = () => {
    if (!sessionStartTime) return '0:00';
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const handleFinishRound = useCallback(() => {
    Alert.alert(
      'End Round',
      'Are you sure you want to finish the round?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            console.log('[ScoreTab] Finishing round');
            setShowRoundSum(true);
          },
        },
      ]
    );
  }, []);

  const handleSelectScore = useCallback((score: number) => {
    if (!currentHole) return;
    console.log('[ScoreTab] Score selected:', score, 'for hole:', currentHole.number);
    setScore(currentHole.number, score);
  }, [currentHole, setScore]);

  const handleClear = useCallback(() => {
    if (!currentHole) return;
    clearHoleScore(currentHole.number);
  }, [currentHole, clearHoleScore]);

  const handleFairwayNext = useCallback((fairway: FairwayHit, putts: number, puttDistance: PuttDistance | null) => {
    if (!currentHole) return;
    setFairwayData(currentHole.number, fairway, putts, puttDistance);
  }, [currentHole, setFairwayData]);

  const handleGreenNext = useCallback((greenMiss: GreenMiss) => {
    if (!currentHole) return;
    setGreenData(currentHole.number, greenMiss);
  }, [currentHole, setGreenData]);

  const handleExtraDone = useCallback((bunker: number, penalty: number, chips: number, sandSave: boolean, upAndDown: boolean) => {
    if (!currentHole) return;
    setExtraShotData(currentHole.number, bunker, penalty, chips, sandSave, upAndDown);
  }, [currentHole, setExtraShotData]);

  if (!currentHole) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Laddar...</Text>
      </View>
    );
  }

  const isLastHole = currentHoleIndex === holes.length - 1;

  const roundSumData = {
    totalScore,
    totalPar,
    holesPlayed,
    courseName,
    players: allScoringPlayers.map((sp, idx) => {
      const isCreator = idx === 0;
      const name = isCreator ? playerName : sp.name;
      const score = getPlayerTotalScore(sp.id);
      const toPar = getPlayerToParDisplay(sp.id);
      return { name, score, toPar };
    }),
    roundDate,
    roundName,
    duration: formatDuration(),
    temperature,
  };

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.holeHeader}>
        <TouchableOpacity
          style={styles.navArrow}
          onPress={goToPrevHole}
          activeOpacity={0.6}
          disabled={currentHoleIndex === 0}
        >
          <ChevronLeft size={24} color={currentHoleIndex === 0 ? '#555' : '#fff'} />
        </TouchableOpacity>
        <Text style={styles.holeTitle}>HÅL {currentHole.number} | PAR {currentHole.par}</Text>
        <TouchableOpacity
          style={styles.navArrow}
          onPress={goToNextHole}
          activeOpacity={0.6}
          disabled={isLastHole}
        >
          <ChevronRight size={24} color={isLastHole ? '#555' : '#fff'} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.playerCardsScroll} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.playerCardsContent}
      >
        {allScoringPlayers.map((sp, idx) => {
          const isActive = idx === currentScoringPlayerIndex;
          const isCreator = idx === 0;
          const displayName = isCreator ? playerName : sp.name;
          const displayHcp = isCreator ? playerHcp : sp.hcp;
          const pToParDisplay = isCreator ? toParDisplay : getPlayerToParDisplay(sp.id);

          return (
            <View 
              key={sp.id} 
              style={[
                styles.playerCard, 
                isActive && styles.playerCardActive,
                !isActive && styles.playerCardInactive,
              ]}
            >
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, !isActive && styles.playerNameInactive]}>
                  {displayName}
                </Text>
                <Text style={[styles.playerHcp, !isActive && styles.playerHcpInactive]}>
                  HCP {displayHcp}
                </Text>
              </View>
              <View style={[styles.toParBadge, isActive && styles.toParBadgeActive]}>
                <Text style={[styles.toParText, isActive && styles.toParTextActive]}>{pToParDisplay}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {inputStep === 'digit' && (
        <View style={styles.digitArea}>
          <View style={styles.scoreboardRow}>
            <TouchableOpacity
              style={styles.scoreboardBtn}
              onPress={() => setShowScoreboard(true)}
              activeOpacity={0.7}
            >
              <List size={22} color="#333" />
              <Text style={styles.scoreboardLabel}>Leaderboard</Text>
            </TouchableOpacity>

            {!isCreatorScoring && (
              <View style={styles.scoringForBadge}>
                <Text style={styles.scoringForText}>Scoring for</Text>
                <Text style={styles.scoringForName}>{currentScoringPlayer.name}</Text>
              </View>
            )}

            {allHolesScored && (
              <TouchableOpacity
                style={styles.finishRoundBtn}
                onPress={handleFinishRound}
                activeOpacity={0.7}
              >
                <Text style={styles.finishRoundText}>Finish Round</Text>
              </TouchableOpacity>
            )}
          </View>
          <Digit par={currentHole.par} onSelectScore={handleSelectScore} onClear={handleClear} />
        </View>
      )}

      {inputStep === 'fairway' && (
        <View style={styles.inputArea}>
          <View style={styles.scoreCircleRow}>
            {!isCreatorScoring && (
              <Text style={styles.inputPlayerLabel}>{currentScoringPlayer.name}</Text>
            )}
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreCircleText}>{currentHoleScore.score}</Text>
            </View>
          </View>
          <Fairway
            initialFairway={currentHoleScore.fairway}
            initialPutts={currentHoleScore.putts}
            initialPuttDistance={currentHoleScore.puttDistance}
            onNext={handleFairwayNext}
            onPrevious={goBackStep}
          />
        </View>
      )}

      {inputStep === 'green' && (
        <View style={styles.inputArea}>
          <View style={styles.scoreCircleRow}>
            {!isCreatorScoring && (
              <Text style={styles.inputPlayerLabel}>{currentScoringPlayer.name}</Text>
            )}
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreCircleText}>{currentHoleScore.score}</Text>
            </View>
          </View>
          <Green
            initialGreenMiss={currentHoleScore.greenMiss}
            onNext={handleGreenNext}
            onPrevious={goBackStep}
          />
        </View>
      )}

      {inputStep === 'extrashot' && (
        <View style={styles.inputArea}>
          <View style={styles.scoreCircleRow}>
            {!isCreatorScoring && (
              <Text style={styles.inputPlayerLabel}>{currentScoringPlayer.name}</Text>
            )}
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreCircleText}>{currentHoleScore.score}</Text>
            </View>
          </View>
          <ExtraShot
            initialBunkerShots={currentHoleScore.bunkerShots}
            initialPenaltyShots={currentHoleScore.penaltyShots}
            initialChips={currentHoleScore.chips}
            initialSandSave={currentHoleScore.sandSave}
            initialUpAndDown={currentHoleScore.upAndDown}
            isLastHole={isLastHole}
            onDone={handleExtraDone}
            onPrevious={goBackStep}
          />
        </View>
      )}

      <Modal
        visible={showRoundSum}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowRoundSum(false)}
      >
        <RoundSumModal
          onClose={() => setShowRoundSum(false)}
          roundData={roundSumData}
        />
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  holeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  holeTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  playerCardsScroll: {
    maxHeight: 180,
    marginTop: 8,
  },
  playerCardsContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  playerCardActive: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
  },
  playerCardInactive: {
    opacity: 0.5,
  },
  playerInfo: {},
  playerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  playerNameInactive: {
    color: 'rgba(255,255,255,0.7)',
  },
  playerHcp: {
    fontSize: 13,
    color: '#CCCCCC',
    fontWeight: '500' as const,
  },
  playerHcpInactive: {
    color: 'rgba(255,255,255,0.5)',
  },
  toParBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toParBadgeActive: {
    backgroundColor: '#fff',
  },
  toParText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#333333',
  },
  toParTextActive: {
    color: '#2D803D',
  },
  digitArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  inputArea: {
    flex: 1,
  },
  scoreboardRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  scoreboardBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreboardLabel: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 2,
  },
  finishRoundBtn: {
    backgroundColor: 'rgba(255,82,82,0.15)',
    borderWidth: 1.5,
    borderColor: '#FF5252',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  finishRoundText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FF5252',
  },
  scoreCircleRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleText: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  scoringForBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  scoringForText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  scoringForName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  inputPlayerLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
});
