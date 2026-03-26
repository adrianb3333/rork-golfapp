import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Play, MapPin, Trophy } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';

export default function PlayScreen() {
  const { startSetup } = useSession();

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Ready to Play?</Text>
          <Text style={styles.heroSubtitle}>Track your round, improve your game</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => startSetup('play')}
          activeOpacity={0.9}
        >
          <View style={styles.startButtonInner}>
            <Play size={32} color={Colors.textLight} fill={Colors.textLight} />
            <Text style={styles.startButtonText}>Start Round</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Recent Rounds</Text>
          <View style={styles.statCards}>
            <View style={styles.statCard}>
              <MapPin size={24} color={Colors.primary} />
              <Text style={styles.statValue}>Pebble Beach</Text>
              <Text style={styles.statLabel}>Last Played</Text>
            </View>
            <View style={styles.statCard}>
              <Trophy size={24} color={Colors.warning} />
              <Text style={styles.statValue}>78</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>12</Text>
            <Text style={styles.quickStatLabel}>Rounds</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>82.4</Text>
            <Text style={styles.quickStatLabel}>Avg Score</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>14.2</Text>
            <Text style={styles.quickStatLabel}>Handicap</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    height: 200,
    backgroundColor: Colors.primary,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    padding: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.textLight,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -40,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  startButtonText: {
    color: Colors.textLight,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  statsSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  statCards: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  quickStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
});
