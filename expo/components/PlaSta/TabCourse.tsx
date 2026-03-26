import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type CourseTab = 'nearby' | 'played' | 'favorite';

interface TabCourseProps {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
  playedCount?: number;
}

const TABS: { key: CourseTab; label: string }[] = [
  { key: 'nearby', label: 'Närmast' },
  { key: 'played', label: 'Spelat' },
  { key: 'favorite', label: 'Favorit' },
];

export default function TabCourse({ activeTab, onTabChange, playedCount }: TabCourseProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        let label = tab.label;
        if (tab.key === 'played' && playedCount !== undefined) {
          label = `${tab.label} (${playedCount})`;
        }
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
