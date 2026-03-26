import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Target, Clock, TrendingUp, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';

export default function PracticeScreen() {
  const { startSetup } = useSession();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Practice Mode</Text>
          <Text style={styles.heroSubtitle}>Sharpen your skills, track your progress</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => startSetup('practice')}
          activeOpacity={0.9}
        >
          <View style={styles.startButtonInner}>
            <Target size={32} color={Colors.textLight} />
            <Text style={styles.startButtonText}>Start Practice</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practice Areas</Text>
          <View style={styles.areasGrid}>
            <TouchableOpacity style={styles.areaCard} activeOpacity={0.8}>
              <View style={[styles.areaIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Zap size={28} color={Colors.primary} />
              </View>
              <Text style={styles.areaName}>Full Swing</Text>
              <Text style={styles.areaDesc}>Driver & Irons</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.areaCard} activeOpacity={0.8}>
              <View style={[styles.areaIcon, { backgroundColor: Colors.accent + '15' }]}>
                <Target size={28} color={Colors.accent} />
              </View>
              <Text style={styles.areaName}>Short Game</Text>
              <Text style={styles.areaDesc}>Chips & Pitches</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.areaCard} activeOpacity={0.8}>
              <View style={[styles.areaIcon, { backgroundColor: Colors.warning + '15' }]}>
                <TrendingUp size={28} color={Colors.warning} />
              </View>
              <Text style={styles.areaName}>Putting</Text>
              <Text style={styles.areaDesc}>Speed & Line</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.areaCard} activeOpacity={0.8}>
              <View style={[styles.areaIcon, { backgroundColor: Colors.error + '15' }]}>
                <Clock size={28} color={Colors.error} />
              </View>
              <Text style={styles.areaName}>Bunker</Text>
              <Text style={styles.areaDesc}>Sand Saves</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekStats}>
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>4</Text>
              <Text style={styles.weekStatLabel}>Sessions</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>3.5h</Text>
              <Text style={styles.weekStatLabel}>Total Time</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>312</Text>
              <Text style={styles.weekStatLabel}>Shots</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <View style={styles.sessionsList}>
            {[
              { date: 'Today', focus: 'Iron Play', duration: '45 min' },
              { date: 'Yesterday', focus: 'Putting', duration: '30 min' },
              { date: 'Mon, Feb 3', focus: 'Full Swing', duration: '1 hr' },
            ].map((session, index) => (
              <View key={index} style={styles.sessionItem}>
                <View>
                  <Text style={styles.sessionFocus}>{session.focus}</Text>
                  <Text style={styles.sessionDate}>{session.date}</Text>
                </View>
                <View style={styles.sessionDuration}>
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.sessionDurationText}>{session.duration}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroSection: {
    height: 180,
    backgroundColor: Colors.accent,
    justifyContent: 'flex-end',
  },
  heroContent: {
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
    padding: 20,
    marginTop: -30,
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    shadowColor: Colors.accent,
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
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  areaCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  areaIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  areaDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  weekStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  weekStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.accent,
  },
  weekStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  weekStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  sessionsList: {
    gap: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  sessionFocus: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sessionDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionDurationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
