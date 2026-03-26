import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Settings, Award, TrendingUp, Calendar, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ProfileContent() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
            <Settings size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JD</Text>
            </View>
            <View style={styles.handicapBadge}>
              <Text style={styles.handicapText}>14.2</Text>
            </View>
          </View>
          
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.memberSince}>Member since 2023</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>47</Text>
            <Text style={styles.statLabel}>Rounds</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>78</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>83.2</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#FEF3C7' }]}>
                <Award size={24} color="#D97706" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>First Birdie</Text>
                <Text style={styles.achievementDate}>Earned Jan 15, 2024</Text>
              </View>
            </View>
            
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#E0E7FF' }]}>
                <TrendingUp size={24} color="#4338CA" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>10 Round Streak</Text>
                <Text style={styles.achievementDate}>Earned Feb 2, 2024</Text>
              </View>
            </View>

            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#E0F2FE' }]}>
                <Calendar size={24} color="#0369A1" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>Weekend Warrior</Text>
                <Text style={styles.achievementDate}>Earned Mar 10, 2024</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.linksList}>
            {['Statistics', 'Equipment', 'Goals', 'Friends'].map((item, index) => (
              <TouchableOpacity key={index} style={styles.linkItem}>
                <Text style={styles.linkText}>{item}</Text>
                <ChevronRight size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  topHeader: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1A1C1E',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    paddingVertical: 30,
    alignItems: 'center' as const,
    position: 'relative' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  settingsButton: {
    position: 'absolute' as const,
    top: 20,
    right: 20,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#386641',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  handicapBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: -4,
    backgroundColor: '#63B3ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  handicapText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1C1E',
  },
  memberSince: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#386641',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1C1E',
    marginBottom: 16,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1C1E',
  },
  achievementDate: {
    fontSize: 13,
    color: '#64748B',
  },
  linksList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  linkItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1A1C1E',
  },
});
