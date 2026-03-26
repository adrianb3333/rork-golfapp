import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LastRoundData } from '@/contexts/SessionContext';
import { DrillResultRow } from '@/services/drillResultsService';
import { getScreenWidth, wp } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();
const CARD_WIDTH = SCREEN_WIDTH - wp(48);

export type ShareCardType = 'lastRound' | 'lastPractice' | 'qrCode';

interface ShareCardModalProps {
  visible: boolean;
  onClose: () => void;
  type: ShareCardType;
  lastRound?: LastRoundData | null;
  lastPractice?: DrillResultRow | null;
  qrImageUrl?: string;
  username?: string;
  userHandle?: string;
  displayName?: string;
}

function getScoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

export default function ShareCardModal({
  visible,
  onClose,
  type,
  lastRound,
  lastPractice,
  qrImageUrl,
  username,
  userHandle,
  displayName,
}: ShareCardModalProps) {
  const insets = useSafeAreaInsets();
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const handleShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[ShareCard] Share pressed, type:', type);

    if (Platform.OS === 'web') {
      try {
        let shareText = '';
        if (type === 'lastRound' && lastRound) {
          shareText = `My last round at ${lastRound.courseName}: ${lastRound.totalScore} (${getScoreLabel(lastRound.totalScore, lastRound.totalPar)}) - ${lastRound.holesPlayed} holes played on ${lastRound.roundDate}`;
        } else if (type === 'lastPractice' && lastPractice) {
          shareText = `Practice session: ${lastPractice.drill_name} - ${lastPractice.percentage}% accuracy (${lastPractice.total_hits}/${lastPractice.total_shots} shots)`;
        } else if (type === 'qrCode') {
          shareText = `Check out @${userHandle} on Golfers Crib!`;
        }

        if (navigator.share) {
          await navigator.share({
            title: 'Golfers Crib',
            text: shareText,
          });
        } else {
          await navigator.clipboard.writeText(shareText);
          Alert.alert('Copied!', 'Shared content copied to clipboard');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('[ShareCard] Web share error:', err.message);
        }
      }
      return;
    }

    setIsSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
        setIsSharing(false);
        return;
      }

      let shareText = '';
      if (type === 'lastRound' && lastRound) {
        shareText = `🏌️ My last round at ${lastRound.courseName}: ${lastRound.totalScore} (${getScoreLabel(lastRound.totalScore, lastRound.totalPar)}) - ${lastRound.holesPlayed} holes on ${lastRound.roundDate}`;
      } else if (type === 'lastPractice' && lastPractice) {
        shareText = `🎯 Practice: ${lastPractice.drill_name} - ${lastPractice.percentage}% accuracy (${lastPractice.total_hits}/${lastPractice.total_shots})`;
      } else if (type === 'qrCode' && qrImageUrl) {
        const { File, Paths } = await import('expo-file-system');
        const output = await File.downloadFileAsync(
          qrImageUrl,
          new File(Paths.cache, `share_qr_${userHandle}.png`)
        );
        if (output.exists) {
          await Sharing.shareAsync(output.uri, {
            mimeType: 'image/png',
            dialogTitle: `Share @${userHandle}'s QR Code`,
          });
          setIsSharing(false);
          return;
        }
      }

      if (shareText) {
        const { File, Paths } = await import('expo-file-system');
        const tmpFile = new File(Paths.cache, 'share_text.txt');
        tmpFile.write(shareText);
        await Sharing.shareAsync(tmpFile.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Share from Golfers Crib',
        });
      }
    } catch (err: any) {
      console.log('[ShareCard] Share error:', err.message);
      Alert.alert('Error', 'Something went wrong while sharing.');
    } finally {
      setIsSharing(false);
    }
  }, [type, lastRound, lastPractice, qrImageUrl, userHandle]);

  const handleClose = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const renderLastRoundCard = () => {
    if (!lastRound) {
      return (
        <View style={cardStyles.emptyContainer}>
          <Text style={cardStyles.emptyText}>No round data available</Text>
          <Text style={cardStyles.emptySubtext}>Complete a round to share your results</Text>
        </View>
      );
    }

    const scoreDiff = lastRound.totalScore - lastRound.totalPar;
    const scoreLabel = getScoreLabel(lastRound.totalScore, lastRound.totalPar);

    return (
      <>
        <View style={cardStyles.scoreSection}>
          <Text style={cardStyles.scoreLabel}>Score</Text>
          <View style={cardStyles.scoreRow}>
            <Text style={cardStyles.scoreBig}>{lastRound.totalScore}</Text>
            <View style={cardStyles.scoreDetails}>
              <Text style={cardStyles.parLabel}>vs Par</Text>
              <View style={[
                cardStyles.scoreBadge,
                scoreDiff === 0 ? cardStyles.badgeEven :
                scoreDiff < 0 ? cardStyles.badgeUnder : cardStyles.badgeOver,
              ]}>
                <Text style={cardStyles.scoreBadgeText}>{scoreLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={cardStyles.divider} />

        <View style={cardStyles.infoSection}>
          <View style={cardStyles.infoRow}>
            <Text style={cardStyles.infoLabel}>Course</Text>
            <Text style={cardStyles.infoValue}>{lastRound.courseName}</Text>
          </View>
          <View style={cardStyles.infoRow}>
            <Text style={cardStyles.infoLabel}>Date</Text>
            <Text style={cardStyles.infoValue}>{lastRound.roundDate}</Text>
          </View>
          <View style={cardStyles.infoRow}>
            <Text style={cardStyles.infoLabel}>Holes</Text>
            <Text style={cardStyles.infoValue}>{lastRound.holesPlayed} holes</Text>
          </View>
          {lastRound.duration ? (
            <View style={cardStyles.infoRow}>
              <Text style={cardStyles.infoLabel}>Duration</Text>
              <Text style={cardStyles.infoValue}>{lastRound.duration}</Text>
            </View>
          ) : null}
        </View>

        {lastRound.players && lastRound.players.length > 0 ? (
          <>
            <View style={cardStyles.divider} />
            <View style={cardStyles.playersSection}>
              <Text style={cardStyles.playersTitle}>Players</Text>
              <View style={cardStyles.playersRow}>
                {lastRound.players.map((player, idx) => (
                  <View key={idx} style={cardStyles.playerChip}>
                    <Text style={cardStyles.playerChipText}>{player}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}
      </>
    );
  };

  const renderLastPracticeCard = () => {
    if (!lastPractice) {
      return (
        <View style={cardStyles.emptyContainer}>
          <Text style={cardStyles.emptyText}>No practice data available</Text>
          <Text style={cardStyles.emptySubtext}>Complete a drill to share your results</Text>
        </View>
      );
    }

    const formattedDate = lastPractice.completed_at
      ? new Date(lastPractice.completed_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Unknown';

    return (
      <>
        <View style={cardStyles.drillHeader}>
          <Text style={cardStyles.drillCategory}>{lastPractice.category}</Text>
          <Text style={cardStyles.drillName}>{lastPractice.drill_name}</Text>
        </View>

        <View style={cardStyles.resultCircleContainer}>
          <View style={cardStyles.resultCircle}>
            <Text style={cardStyles.resultPercent}>{lastPractice.percentage}%</Text>
            <Text style={cardStyles.resultAccuracy}>Accuracy</Text>
          </View>
        </View>

        <View style={cardStyles.divider} />

        <View style={cardStyles.infoSection}>
          <View style={cardStyles.infoRow}>
            <Text style={cardStyles.infoLabel}>Hits</Text>
            <Text style={cardStyles.infoValue}>{lastPractice.total_hits} / {lastPractice.total_shots}</Text>
          </View>
          <View style={cardStyles.infoRow}>
            <Text style={cardStyles.infoLabel}>Rounds</Text>
            <Text style={cardStyles.infoValue}>{lastPractice.rounds}</Text>
          </View>
          <View style={cardStyles.infoRow}>
            <Text style={cardStyles.infoLabel}>Date</Text>
            <Text style={cardStyles.infoValue}>{formattedDate}</Text>
          </View>
        </View>
      </>
    );
  };

  const renderQrCard = () => {
    return (
      <>
        <View style={cardStyles.qrUserSection}>
          <Text style={cardStyles.qrDisplayName}>{displayName || username || 'Golfer'}</Text>
          <Text style={cardStyles.qrHandle}>@{userHandle || 'user'}</Text>
        </View>

        <View style={cardStyles.qrImageContainer}>
          <View style={cardStyles.qrImageWrapper}>
            {qrImageUrl ? (
              <Image
                source={{ uri: qrImageUrl }}
                style={cardStyles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={cardStyles.qrPlaceholder}>QR Code</Text>
            )}
          </View>
        </View>

        <Text style={cardStyles.qrScanHint}>Scan to add as friend</Text>
      </>
    );
  };

  const getCardTitle = () => {
    switch (type) {
      case 'lastRound': return 'Last Round';
      case 'lastPractice': return 'Last Practice';
      case 'qrCode': return 'My Profile';
      default: return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            testID="share-card-close"
          >
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={['#0059B2', '#1075E3', '#1C8CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{getCardTitle()}</Text>
                <Image
                  source={require('@/assets/images/golferscrib-logo-clean.png')}
                  style={styles.cardLogo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.cardContent}>
                {type === 'lastRound' && renderLastRoundCard()}
                {type === 'lastPractice' && renderLastPracticeCard()}
                {type === 'qrCode' && renderQrCard()}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>Golfers Crib</Text>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>

        <View style={[styles.shareButtonContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShare}
            disabled={isSharing}
            testID="share-card-share-btn"
          >
            <LinearGradient
              colors={['#0059B2', '#1075E3', '#1C8CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareButton}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Share2 size={18} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Share</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    borderRadius: 24,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  card: {
    width: '100%' as const,
    borderRadius: 24,
    padding: 24,
    minHeight: 380,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
  cardLogo: {
    width: 48,
    height: 48,
  },
  cardContent: {
    flex: 1,
  },
  cardFooter: {
    marginTop: 20,
    alignItems: 'center' as const,
  },
  cardFooterText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  shareButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  shareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

const cardStyles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center' as const,
  },
  scoreSection: {
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 16,
  },
  scoreBig: {
    fontSize: 64,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    lineHeight: 68,
  },
  scoreDetails: {
    paddingBottom: 10,
  },
  parLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeEven: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeUnder: {
    backgroundColor: '#E53935',
  },
  badgeOver: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scoreBadgeText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 16,
  },
  infoSection: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  playersSection: {
    gap: 8,
  },
  playersTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  playersRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  playerChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  playerChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  drillHeader: {
    marginBottom: 20,
  },
  drillCategory: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  drillName: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  resultCircleContainer: {
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  resultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  resultPercent: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  resultAccuracy: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  qrUserSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  qrDisplayName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  qrHandle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  qrImageContainer: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  qrImageWrapper: {
    width: 180,
    height: 180,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  qrScanHint: {
    textAlign: 'center' as const,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
});
