import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSensor } from '@/contexts/SensorContext';
import SensorLockOverlay from '@/components/SensorLockOverlay';

interface StrokesGainedSection {
  title: string;
  abbrev: string;
  color: string;
}

const SECTIONS: StrokesGainedSection[] = [
  { title: 'Off-the-Tee', abbrev: 'OTT', color: '#4FC3F7' },
  { title: 'Approach-the-Green', abbrev: 'APP', color: '#90A4AE' },
  { title: 'Around-the-Green', abbrev: 'ARG', color: '#FFB74D' },
  { title: 'Putting', abbrev: 'P', color: '#E57373' },
];

export default function Step1Page3() {
  const { isPaired } = useSensor();
  return (
    <View style={{ flex: 1, position: 'relative' as const }}>
    {!isPaired && <SensorLockOverlay />}
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Strokes Gained</Text>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>API PENDING</Text>
        </View>
      </View>

      {SECTIONS.map((section, index) => (
        <View key={section.abbrev} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={[styles.abbrevBadge, { borderColor: section.color + '40' }]}>
              <Text style={[styles.abbrevText, { color: section.color }]}>{section.abbrev}</Text>
            </View>
          </View>

          <View style={styles.sectionBody}>
            <View style={styles.valuePlaceholder}>
              <Text style={styles.valueLabel}>Strokes Gained</Text>
              <Text style={styles.valueDash}>—</Text>
            </View>
            <View style={styles.valuePlaceholder}>
              <Text style={styles.valueLabel}>Avg per Round</Text>
              <Text style={styles.valueDash}>—</Text>
            </View>
          </View>

          {index < SECTIONS.length - 1 && <View style={styles.divider} />}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB74D',
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 14,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  abbrevBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  abbrevText: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  sectionBody: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row' as const,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  valuePlaceholder: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 6,
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  valueDash: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
    marginBottom: 8,
  },
});
