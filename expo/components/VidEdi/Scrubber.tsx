import React, { useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable } from 'react-native';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Gauge,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSwingStore } from '@/store/swingStore';
import { VideoState } from '@/Types';

interface ScrubberProps {
  videoState: VideoState;
  onSeek: (positionMillis: number) => void;
  onTogglePlay: () => void;
  onStepFrame: (direction: 'forward' | 'backward') => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

const PLAYBACK_RATES = [0.125, 0.25, 0.5, 1.0];
const RATE_LABELS = ['⅛×', '¼×', '½×', '1×'];

export default function Scrubber({ videoState, onSeek, onTogglePlay, onStepFrame }: ScrubberProps) {
  const { setPlaybackRate } = useSwingStore();
  const trackRef = useRef<View>(null);

  const safeDuration = videoState?.duration ?? 0;
  const safeCurrentTime = videoState?.currentTime ?? 0;
  const safeIsPlaying = videoState?.isPlaying ?? false;
  const safePlaybackRate = videoState?.playbackRate ?? 1.0;
  const progress = safeDuration > 0 ? safeCurrentTime / safeDuration : 0;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const currentRateIndex = PLAYBACK_RATES.indexOf(safePlaybackRate);

  const cycleRate = useCallback(() => {
    const nextIndex = (currentRateIndex + 1) % PLAYBACK_RATES.length;
    setPlaybackRate(PLAYBACK_RATES[nextIndex]);
    console.log('Playback rate:', PLAYBACK_RATES[nextIndex]);
  }, [currentRateIndex, setPlaybackRate]);

  const handleSeekFromGesture = useCallback(
    (pageX: number) => {
      trackRef.current?.measure((_x, _y, width, _height, px) => {
        const relativeX = pageX - px;
        const clampedX = Math.max(0, Math.min(relativeX, width));
        const seekPosition = width > 0 ? (clampedX / width) * safeDuration : 0;
        onSeek(seekPosition);
      });
    },
    [safeDuration, onSeek]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          handleSeekFromGesture(evt.nativeEvent.pageX);
        },
        onPanResponderMove: (evt) => {
          handleSeekFromGesture(evt.nativeEvent.pageX);
        },
      }),
    [handleSeekFromGesture]
  );

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(safeCurrentTime)}</Text>
        <Text style={styles.timeTextDim}>{formatTime(safeDuration)}</Text>
      </View>

      <View style={styles.trackOuter}>
        <View
          ref={trackRef}
          style={styles.track}
          {...panResponder.panHandlers}
        >
          <View style={styles.trackBg} />
          <View style={[styles.trackFill, { width: `${clampedProgress * 100}%` }]} />
          <View
            style={[
              styles.thumb,
              { left: `${clampedProgress * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [styles.rateButton, pressed && styles.pressed]}
          onPress={cycleRate}
          testID="rate-button"
        >
          <Gauge size={16} color={Colors.textSecondary} />
          <Text style={styles.rateText}>
            {currentRateIndex >= 0 ? RATE_LABELS[currentRateIndex] : '1×'}
          </Text>
        </Pressable>

        <View style={styles.playbackControls}>
          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
            onPress={() => onStepFrame('backward')}
            testID="step-back"
          >
            <SkipBack size={20} color={Colors.textPrimary} fill={Colors.textPrimary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
            onPress={onTogglePlay}
            testID="play-pause"
          >
            {safeIsPlaying ? (
              <Pause size={24} color={Colors.background} fill={Colors.background} />
            ) : (
              <Play size={24} color={Colors.background} fill={Colors.background} />
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
            onPress={() => onStepFrame('forward')}
            testID="step-forward"
          >
            <SkipForward size={20} color={Colors.textPrimary} fill={Colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.rateButton}>
          <Text style={styles.frameText}>
            {safeDuration > 0
              ? `F${Math.round(safeCurrentTime / 33)}`
              : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timeRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
  timeTextDim: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  trackOuter: {
    paddingVertical: 8,
  },
  track: {
    height: 24,
    justifyContent: 'center',
  },
  trackBg: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute' as const,
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute' as const,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    marginLeft: -9,
    top: 3,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  controls: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  playbackControls: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  pressed: {
    opacity: 0.6,
  },
  rateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.card,
    minWidth: 56,
    justifyContent: 'center',
  },
  rateText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  frameText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
