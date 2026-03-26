import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useScoring, PlayerRoundInfo } from '@/contexts/ScoringContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useSession } from '@/contexts/SessionContext';
import { HoleInfo, getToPar } from '@/mocks/courseData';

interface ScoreBoardProps {
  visible: boolean;
  onClose: () => void;
}

export default function ScoreBoard({ visible, onClose }: ScoreBoardProps) {
  const {
    scores, players, holesPlayed, courseName,
    playerScores, getPlayerTotalScore, getPlayerTotalPar, getPlayerHolesPlayed,
  } = useScoring();
  const { profile } = useProfile();
  const { roundDate } = useSession();

  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const currentPlayerName = profile?.display_name || profile?.username || 'Spelare';
  const currentPlayerId = '__creator__';

  const allPlayers = useMemo(() => {
    const current: PlayerRoundInfo = { id: currentPlayerId, name: currentPlayerName, hcp: 0 };
    return [current, ...players];
  }, [currentPlayerName, players]);

  const { holes: scoringHoles } = useScoring();
  const front9 = useMemo(() => scoringHoles.filter((h) => h.number <= 9), [scoringHoles]);
  const back9 = useMemo(() => scoringHoles.filter((h) => h.number >= 10), [scoringHoles]);

  const front9Par = useMemo(() => front9.reduce((s, h) => s + h.par, 0), [front9]);
  const back9Par = useMemo(() => back9.reduce((s, h) => s + h.par, 0), [back9]);
  const fullPar = front9Par + back9Par;

  const getPlayerScore = useCallback((playerId: string): number => {
    return getPlayerTotalScore(playerId);
  }, [getPlayerTotalScore]);

  const getPlayerPlayed = useCallback((playerId: string): number => {
    return getPlayerHolesPlayed(playerId);
  }, [getPlayerHolesPlayed]);

  const getPlayerToPar = (playerId: string): string => {
    const pScore = getPlayerTotalScore(playerId);
    const pPar = getPlayerTotalPar(playerId);
    const pPlayed = getPlayerHolesPlayed(playerId);
    if (pPlayed > 0) return getToPar(pScore, pPar);
    return 'E';
  };

  const getHoleScoreForPlayer = (playerId: string, holeNum: number): number => {
    if (playerId === currentPlayerId) {
      const s = scores.get(holeNum);
      return s?.score ?? 0;
    }
    const pScores = playerScores.get(playerId);
    if (pScores) {
      const s = pScores.get(holeNum);
      return s?.score ?? 0;
    }
    return 0;
  };

  const getHalfTotal = (playerId: string, halfHoles: HoleInfo[]): number => {
    return halfHoles.reduce((sum, h) => sum + getHoleScoreForPlayer(playerId, h.number), 0);
  };

  const toggleExpand = (playerId: string) => {
    setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
  };

  const getScoreCellStyle = (score: number, par: number) => {
    if (score === 0) return {};
    const diff = score - par;
    if (diff <= -2) return { backgroundColor: '#ffb300' };
    if (diff === -1) return { backgroundColor: '#e53935' };
    if (diff === 0) return {};
    if (diff === 1) return { backgroundColor: '#1565c0' };
    if (diff >= 2) return { backgroundColor: '#1565c0' };
    return {};
  };

  const getScoreTextStyle = (score: number, par: number) => {
    if (score === 0) return {};
    const diff = score - par;
    if (diff <= -1) return { color: '#fff' };
    if (diff >= 1) return { color: '#fff' };
    return {};
  };

  const sortedPlayers = useMemo(() => {
    return [...allPlayers].sort((a, b) => {
      const aPlayed = getPlayerPlayed(a.id);
      const bPlayed = getPlayerPlayed(b.id);
      if (aPlayed === 0 && bPlayed === 0) return 0;
      if (aPlayed === 0) return 1;
      if (bPlayed === 0) return -1;
      const aScoreToPar = getPlayerScore(a.id) - getPlayerTotalPar(a.id);
      const bScoreToPar = getPlayerScore(b.id) - getPlayerTotalPar(b.id);
      return aScoreToPar - bScoreToPar;
    });
  }, [allPlayers, getPlayerScore, getPlayerPlayed, getPlayerTotalPar]);

  const renderScorecard = (playerId: string) => {
    const front9Total = getHalfTotal(playerId, front9);
    const back9Total = getHalfTotal(playerId, back9);
    const pTotalScore = getPlayerScore(playerId);
    const pPlayed = getPlayerPlayed(playerId);

    return (
      <View style={styles.scorecardContainer}>
        <View style={styles.halfSection}>
          <View style={[styles.scorecardRow, styles.scorecardHeaderRow]}>
            <Text style={[styles.scorecardCell, styles.scorecardHeaderCell, styles.labelCell]}>Hål</Text>
            {front9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.scorecardHeaderCell]}>{h.number}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.scorecardHeaderCell, styles.totalCell]}>Ut</Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.metaCell]}>Par</Text>
            {front9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.metaCell]}>{h.par}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.metaCell]}>{front9Par}</Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.boldCell]}>Resultat</Text>
            {front9.map((h) => {
              const s = getHoleScoreForPlayer(playerId, h.number);
              return (
                <View key={h.number} style={[styles.scoreCellWrap, getScoreCellStyle(s, h.par)]}>
                  <Text style={[styles.scorecardCell, styles.boldCell, getScoreTextStyle(s, h.par)]}>
                    {s > 0 ? s : ''}
                  </Text>
                </View>
              );
            })}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.boldCell]}>
              {front9Total > 0 ? front9Total : ''}
            </Text>
          </View>
        </View>

        <View style={styles.halfSection}>
          <View style={[styles.scorecardRow, styles.scorecardHeaderRowBack]}>
            <Text style={[styles.scorecardCell, styles.scorecardHeaderCellBack, styles.labelCell]}>Hål</Text>
            {back9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.scorecardHeaderCellBack]}>{h.number}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.scorecardHeaderCellBack, styles.totalCell]}>In</Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.metaCell]}>Par</Text>
            {back9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.metaCell]}>{h.par}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.metaCell]}>{back9Par}</Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.boldCell]}>Resultat</Text>
            {back9.map((h) => {
              const s = getHoleScoreForPlayer(playerId, h.number);
              return (
                <View key={h.number} style={[styles.scoreCellWrap, getScoreCellStyle(s, h.par)]}>
                  <Text style={[styles.scorecardCell, styles.boldCell, getScoreTextStyle(s, h.par)]}>
                    {s > 0 ? s : ''}
                  </Text>
                </View>
              );
            })}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.boldCell]}>
              {back9Total > 0 ? back9Total : ''}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryItem}>Par <Text style={styles.summaryBold}>{fullPar}</Text></Text>
          <Text style={styles.summaryItem}>
            Resultat <Text style={styles.summaryBold}>
              {pTotalScore > 0 ? `${pTotalScore}/${pPlayed}` : '0/0'}
            </Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <LinearGradient
        colors={['#4BA35B', '#3D954D', '#2D803D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <ChevronDown size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Game {roundDate} ({holesPlayed})</Text>
            <Text style={styles.headerSubtitle}>{courseName}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderHash}>#</Text>
          <Text style={styles.tableHeaderName}>NAMN</Text>
          <Text style={styles.tableHeaderStat}>RESULTAT</Text>
          <Text style={styles.tableHeaderStat}>TILL PAR</Text>
          <Text style={styles.tableHeaderStat}>SPELAT</Text>
        </View>

        <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
          {sortedPlayers.map((player, idx) => {
            const pScore = getPlayerScore(player.id);
            const pToPar = getPlayerToPar(player.id);
            const pPlayed = getPlayerPlayed(player.id);
            const isExpanded = expandedPlayer === player.id;

            return (
              <View key={player.id}>
                <TouchableOpacity
                  style={[styles.playerRow, isExpanded && styles.playerRowExpanded]}
                  onPress={() => toggleExpand(player.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.playerPosition}>{idx + 1}.</Text>
                  <View style={styles.playerNameCol}>
                    <Text style={styles.playerName}>{player.id === currentPlayerId ? currentPlayerName : player.name}</Text>
                    <Text style={styles.playerHcp}>HCP {player.hcp}</Text>
                  </View>
                  <Text style={styles.playerStat}>{pScore > 0 ? pScore : '—'}</Text>
                  <Text style={[styles.playerStat, styles.toParStat, pToPar === 'E' && styles.evenPar]}>
                    {pToPar}
                  </Text>
                  <Text style={styles.playerStat}>{pPlayed}</Text>
                </TouchableOpacity>
                {isExpanded && renderScorecard(player.id)}
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  tableHeaderHash: {
    width: 28,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  tableHeaderName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  tableHeaderStat: {
    width: 60,
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  playerList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginBottom: 6,
  },
  playerRowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  playerPosition: {
    width: 28,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  playerNameCol: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  playerHcp: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  playerStat: {
    width: 60,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  toParStat: {
    fontWeight: '800' as const,
    color: '#FFD54F',
  },
  evenPar: {
    color: '#FFFFFF',
  },
  scorecardContainer: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 6,
  },
  halfSection: {
    marginBottom: 8,
  },
  scorecardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scorecardHeaderRow: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    marginBottom: 1,
  },
  scorecardHeaderRowBack: {
    backgroundColor: 'rgba(200,50,50,0.5)',
    borderRadius: 4,
    marginBottom: 1,
  },
  scorecardCell: {
    flex: 1,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 4,
    color: '#FFFFFF',
  },
  scorecardHeaderCell: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: 12,
  },
  scorecardHeaderCellBack: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: 12,
  },
  labelCell: {
    flex: 1.5,
    textAlign: 'left',
    paddingLeft: 4,
  },
  totalCell: {
    fontWeight: '700' as const,
  },
  metaCell: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  boldCell: {
    fontWeight: '700' as const,
    fontSize: 12,
  },
  scoreCellWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    marginHorizontal: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  summaryItem: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryBold: {
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
