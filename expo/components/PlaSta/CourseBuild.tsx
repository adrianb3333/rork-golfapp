import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CircleCheck } from 'lucide-react-native';

export type HoleOption = '18' | '9_first' | '9_back';

interface CourseBuildProps {
  selected: HoleOption;
  onSelect: (option: HoleOption) => void;
}

const OPTIONS: { key: HoleOption; title: string; subtitle: string }[] = [
  { key: '18', title: '18 hål', subtitle: 'Välj detta om du planerar att spela mer än 9 hål' },
  { key: '9_first', title: 'Första 9 hålen', subtitle: 'Välj att spela hål 1-9' },
  { key: '9_back', title: 'Sista 9 hålen', subtitle: 'Välj att spela hål 10-18' },
];

export default function CourseBuild({ selected, onSelect }: CourseBuildProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>HUR MÅNGA HÅL SKA DU SPELA?</Text>
      {OPTIONS.map((opt) => {
        const isActive = selected === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.card, isActive && styles.cardActive]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]}>
                {opt.title}
              </Text>
              <Text style={styles.cardSubtitle}>{opt.subtitle}</Text>
            </View>
            {isActive && (
              <CircleCheck size={24} color="#FFFFFF" fill="#FFFFFF" stroke="#000" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  heading: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardActive: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cardTitleActive: {
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
});
