import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface Props {
  label: string;
  value: string;
}

export default function StatCard({ label, value }: Props) {
  return (
    <BlurView intensity={15} tint="dark" style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase', // Matches professional golf app aesthetics
    marginBottom: 4,
  },
  value: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
