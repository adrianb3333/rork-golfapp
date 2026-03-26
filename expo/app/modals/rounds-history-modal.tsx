import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HelpCircle, X } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function RoundsHistoryModal() {
  const router = useRouter();
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <GlassBackButton onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Rounds History</Text>
          <TouchableOpacity
            onPress={() => setShowInfoModal(true)}
            style={styles.helpBtn}
            activeOpacity={0.7}
            testID="rounds-history-help"
          >
            <HelpCircle size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.body} />

      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={['#0059B2', '#1075E3', '#1C8CFF']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.modalGradient}
            >
              <SafeAreaView edges={['top']}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowInfoModal(false)}
                    style={styles.modalClose}
                    activeOpacity={0.7}
                    testID="handicap-info-close"
                  >
                    <X size={22} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>How Handicap Works</Text>
                  <View style={styles.modalClosePlaceholder} />
                </View>
              </SafeAreaView>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBodyContent}>
                <Text style={styles.modalText}>
                  A golf handicap is a numerical measure of a golfer's ability, allowing players of different skill levels to compete fairly against each other.
                </Text>
                <Text style={styles.modalText}>
                  Your handicap index is calculated using the best 8 of your last 20 qualifying rounds. The formula takes into account the course rating, slope rating, and your adjusted gross score.
                </Text>
                <Text style={styles.modalText}>
                  When you shoot better than expected, your handicap goes down. When you shoot worse, it may go up. The system is designed to reflect your potential ability, not your average score.
                </Text>
                <Text style={styles.modalText}>
                  The World Handicap System (WHS) was introduced in 2020 to unify different handicap systems worldwide, making it easier for golfers to play and compete anywhere in the world.
                </Text>
                <Text style={styles.modalText}>
                  Your playing handicap for a specific course is calculated by multiplying your handicap index by the slope rating of the course divided by 113, then adding the difference between the course rating and par.
                </Text>
                <Text style={styles.modalText}>
                  A "soft cap" and "hard cap" prevent rapid increases in handicap. The soft cap limits increases to 3.0 strokes above your low point in the last 12 months, and the hard cap limits it to 5.0 strokes.
                </Text>
              </ScrollView>
            </LinearGradient>
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
  safeTop: {},
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  helpBtn: {
    padding: 6,
    width: 40,
    alignItems: 'flex-end' as const,
  },
  body: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden' as const,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalClose: {
    padding: 6,
    width: 40,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  modalClosePlaceholder: {
    width: 40,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  modalText: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#ffffffEE',
    lineHeight: 24,
    marginBottom: 16,
  },
});
