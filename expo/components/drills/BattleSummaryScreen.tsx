import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, RotateCcw, User, Trophy } from 'lucide-react-native';
import { ActiveBattle } from '@/contexts/BattleContext';

interface BattleSummaryScreenProps {
  battle: ActiveBattle;
  userRoundScores: number[];
  opponentRoundScores: number[];
  onRetry: () => void;
  onHome: () => void;
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

export default function BattleSummaryScreen({
  battle,
  userRoundScores,
  opponentRoundScores,
  onRetry,
  onHome,
}: BattleSummaryScreenProps) {
  const insets = useSafeAreaInsets();

  const userTotal = userRoundScores.reduce((a, b) => a + b, 0);
  const oppTotal = opponentRoundScores.reduce((a, b) => a + b, 0);
  const totalShots = battle.rounds * battle.shots_per_round;
  const userPct = totalShots > 0 ? Math.round((userTotal / totalShots) * 100) : 0;
  const oppPct = totalShots > 0 ? Math.round((oppTotal / totalShots) * 100) : 0;

  const userWon = userTotal > oppTotal;
  const isDraw = userTotal === oppTotal;

  return (
    <LinearGradient
      colors={['#C62828', '#E53935', '#FF5252']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 24 }]}>
        <Trophy size={40} color={isDraw ? '#FFD166' : userWon ? '#7AE582' : '#FF8A80'} strokeWidth={1.5} />
        <Text style={styles.resultTitle}>
          {isDraw ? 'Draw!' : userWon ? 'You Won!' : 'You Lost!'}
        </Text>
        <Text style={styles.battleName}>{battle.battle_name}</Text>

        <View style={styles.vsContainer}>
          <View style={styles.playerColumn}>
            {userWon ? <View style={styles.greenLine} /> : <View style={styles.greenLinePlaceholder} />}
            <Text style={[styles.vsScore, { color: '#7AE582' }]}>{userTotal}</Text>
            <Text style={styles.vsPct}>{userPct}%</Text>
            <View style={styles.playerAvatarWrapSmall}>
              <User size={20} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.vsMiddle}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.playerColumn}>
            {!userWon && !isDraw ? <View style={styles.greenLine} /> : <View style={styles.greenLinePlaceholder} />}
            <Text style={[styles.vsScore, { color: '#FFD166' }]}>{oppTotal}</Text>
            <Text style={styles.vsPct}>{oppPct}%</Text>
            {battle.opponent_avatar_url ? (
              <Image source={{ uri: battle.opponent_avatar_url }} style={styles.opponentAvatarSmall} />
            ) : (
              <View style={styles.playerAvatarWrapSmall}>
                <User size={20} color="#FFD166" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>ROUND BREAKDOWN</Text>
          {userRoundScores.map((uScore, idx) => {
            const oScore = opponentRoundScores[idx] ?? 0;
            return (
              <View key={idx} style={styles.roundRow}>
                <Text style={styles.roundLabel}>R{idx + 1}</Text>
                <View style={styles.roundScoresWrap}>
                  <Text style={[styles.roundScoreUser, uScore > oScore && styles.roundWinner]}>
                    {uScore}/{battle.shots_per_round}
                  </Text>
                  <Text style={styles.roundVs}>vs</Text>
                  <Text style={[styles.roundScoreOpp, oScore > uScore && styles.roundWinner]}>
                    {oScore}/{battle.shots_per_round}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity onPress={onRetry} style={styles.rematchButton} activeOpacity={0.8}>
            <RotateCcw size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.rematchText}>ReMatch</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onHome} activeOpacity={0.8} style={styles.homeButton}>
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.homeGradient}
            >
              <Home size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.homeText}>Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center' as const,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginTop: 12,
  },
  battleName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    marginBottom: 28,
  },
  vsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 20,
    marginBottom: 30,
  },
  playerColumn: {
    alignItems: 'center' as const,
    width: 100,
  },
  playerAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  opponentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  playerAvatarWrapSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
  },
  opponentAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  vsPlayerName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  greenLine: {
    width: 40,
    height: 3,
    backgroundColor: '#22C55E',
    borderRadius: 1.5,
    marginBottom: 4,
  },
  greenLinePlaceholder: {
    width: 40,
    height: 3,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  vsScore: {
    fontSize: 36,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  vsPct: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  vsMiddle: {
    paddingHorizontal: 4,
  },
  vsText: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  breakdownCard: {
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 18,
    padding: 20,
    width: '85%',
    marginBottom: 30,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  roundRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 12,
  },
  roundLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 30,
  },
  roundScoresWrap: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  roundScoreUser: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 60,
    textAlign: 'right' as const,
  },
  roundVs: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  roundScoreOpp: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 60,
    textAlign: 'left' as const,
  },
  roundWinner: {
    color: '#FFFFFF',
    fontWeight: '900' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 12,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
  },
  rematchButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: GLASS_BG,
  },
  rematchText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  homeButton: {
    flex: 1.4,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  homeGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  homeText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
