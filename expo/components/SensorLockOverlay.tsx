import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';

interface SensorLockOverlayProps {
  message?: string;
  compact?: boolean;
}

export default function SensorLockOverlay({ message = 'Pair Sensors to use', compact = false }: SensorLockOverlayProps) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBlur}>
          <Lock size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.compactText}>{message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.blurLayer} />
      <View style={styles.content}>
        <View style={styles.lockCircle}>
          <Lock size={32} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text style={styles.title}>{message}</Text>
        <Text style={styles.subtitle}>Complete sensor pairing to unlock</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  content: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  compactContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
  },
  compactBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.9)',
  },
});
