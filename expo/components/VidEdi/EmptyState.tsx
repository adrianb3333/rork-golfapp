import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Plus, Video, Crosshair, Columns2 } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface EmptyStateProps {
  onUpload: () => void;
  onCompare: () => void;
}

export default function EmptyState({ onUpload, onCompare }: EmptyStateProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.gridOverlay}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 16.6}%` }]} />
        ))}
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 25}%` }]} />
        ))}
      </View>

      <View style={styles.crosshairContainer}>
        <Crosshair size={48} color={Colors.textMuted} strokeWidth={1} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconRow}>
          <Video size={20} color={Colors.textSecondary} />
          <Text style={styles.subtitle}>SWING ANALYZER</Text>
        </View>

        <Text style={styles.title}>Upload Your Swing</Text>
        <Text style={styles.description}>
          Record or pick a video from your library to start analyzing your golf swing frame by frame
        </Text>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            style={({ pressed }) => [
              styles.uploadButton,
              pressed && styles.uploadButtonPressed,
            ]}
            onPress={onUpload}
            testID="upload-button"
          >
            <Plus size={28} color={Colors.background} strokeWidth={2.5} />
            <Text style={styles.uploadText}>Select Video</Text>
          </Pressable>
        </Animated.View>

        <Pressable
          style={({ pressed }) => [
            styles.compareButton,
            pressed && styles.compareButtonPressed,
          ]}
          onPress={onCompare}
          testID="compare-button"
        >
          <Columns2 size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.compareText}>Compare Two Videos</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  gridLineV: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  crosshairContainer: {
    position: 'absolute' as const,
    top: '30%',
    alignSelf: 'center',
    opacity: 0.3,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  iconRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 36,
  },
  uploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  uploadButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  uploadText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  compareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    gap: 10,
    backgroundColor: Colors.accentDim,
  },
  compareButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  compareText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
});

