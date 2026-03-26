import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Pressable,
  Text,
  Platform,
} from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSwingStore } from '@/store/swingStore';
import VideoPlayer from '@/components/VidEdi/VideoPlayer';
import AnalysisCanvas from '@/components/VidEdi/AnalysisCanvas';
import Scrubber from '@/components/VidEdi/Scrubber';
import DrawingToolbar from '@/components/VidEdi/DrawingToolbar';

export default function VideoModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const videoRef1 = useRef<Video>(null);
  const videoRef2 = useRef<Video>(null);
  
  // Track layout sizes for the drawing canvas to match the video dimensions
  const [canvasSize1, setCanvasSize1] = useState({ width: 0, height: 0 });
  const [canvasSize2, setCanvasSize2] = useState({ width: 0, height: 0 });

  const {
    video,
    video2,
    isComparisonMode,
    activeVideoIndex,
    setActiveVideoIndex,
    setDuration,
    setCurrentTime,
    setIsPlaying,
    setIsLoaded,
    clearDrawings,
  } = useSwingStore();

  const handleStatusUpdate1 = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) console.log('Video 1 error:', status.error);
      return;
    }
    setDuration(status.durationMillis || 0, 0);
    setCurrentTime(status.positionMillis || 0, 0);
    setIsPlaying(status.isPlaying, 0);
    setIsLoaded(true, 0);
  }, [setDuration, setCurrentTime, setIsPlaying, setIsLoaded]);

  const handleStatusUpdate2 = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) console.log('Video 2 error:', status.error);
      return;
    }
    setDuration(status.durationMillis || 0, 1);
    setCurrentTime(status.positionMillis || 0, 1);
    setIsPlaying(status.isPlaying, 1);
    setIsLoaded(true, 1);
  }, [setDuration, setCurrentTime, setIsPlaying, setIsLoaded]);

  const activeVideo = activeVideoIndex === 0 ? video : video2;
  const safeActiveVideo = activeVideo ?? { uri: null, duration: 0, currentTime: 0, isPlaying: false, playbackRate: 1.0, isLoaded: false };

  const handleSeek = useCallback(async (positionMillis: number) => {
    try {
      const ref = activeVideoIndex === 0 ? videoRef1 : videoRef2;
      await ref.current?.setPositionAsync(positionMillis, {
        toleranceMillisBefore: 0,
        toleranceMillisAfter: 0,
      });
    } catch (err) {
      console.log('Seek error:', err);
    }
  }, [activeVideoIndex]);

  const handleTogglePlay = useCallback(async () => {
    try {
      const ref = activeVideoIndex === 0 ? videoRef1 : videoRef2;
      const status = await ref.current?.getStatusAsync();
      if (status?.isLoaded) {
        if (status.isPlaying) {
          await ref.current?.pauseAsync();
        } else {
          await ref.current?.playAsync();
        }
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (err) {
      console.log('Toggle play error:', err);
    }
  }, [activeVideoIndex]);

  const handleStepFrame = useCallback(
    async (direction: 'forward' | 'backward') => {
      try {
        const ref = activeVideoIndex === 0 ? videoRef1 : videoRef2;
        const status = await ref.current?.getStatusAsync();
        if (status?.isLoaded) {
          if (status.isPlaying) {
            await ref.current?.pauseAsync();
          }
          const frameDuration = 33; // Approx 1 frame at 30fps
          const newPos =
            direction === 'forward'
              ? Math.min(
                  status.positionMillis + frameDuration,
                  status.durationMillis ?? 0
                )
              : Math.max(status.positionMillis - frameDuration, 0);
          await ref.current?.setPositionAsync(newPos, {
            toleranceMillisBefore: 0,
            toleranceMillisAfter: 0,
          });
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      } catch (err) {
        console.log('Step frame error:', err);
      }
    },
    [activeVideoIndex]
  );

  const handleExit = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.back();
  }, [router]);

  const handleClearDrawings = useCallback(() => {
    clearDrawings();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [clearDrawings]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.exitButton, pressed && styles.pressed]}
          onPress={handleExit}
          testID="exit-button"
        >
          <X size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isComparisonMode ? 'Comparison' : 'Analysis'}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          onPress={handleClearDrawings}
          testID="reset-drawings"
        >
          <RotateCcw size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {!isComparisonMode ? (
          /* Single Video Layout */
          <View style={styles.videoArea}>
            {video?.uri && (
              <VideoPlayer
                ref={videoRef1}
                uri={video.uri}
                onLayout={(w, h) => setCanvasSize1({ width: w, height: h })}
                onStatusUpdate={handleStatusUpdate1}
              />
            )}
            {canvasSize1.width > 0 && canvasSize1.height > 0 && (
              <AnalysisCanvas width={canvasSize1.width} height={canvasSize1.height} />
            )}
          </View>
        ) : (
          /* Comparison (Split) Layout */
          <View style={styles.comparisonVertical}>
            {/* Top Video (Video 1) */}
            <Pressable
              style={[
                styles.comparisonPanel,
                activeVideoIndex === 0 && styles.comparisonPanelActive,
              ]}
              onPress={() => {
                setActiveVideoIndex(0);
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={styles.videoLabelRow}>
                <View style={[styles.videoLabelBadge, activeVideoIndex === 0 && styles.videoLabelBadgeActive]}>
                  <Text style={[styles.videoLabelText, activeVideoIndex === 0 && styles.videoLabelTextActive]}>
                    Video 1
                  </Text>
                </View>
              </View>
              <View style={styles.comparisonVideoWrap}>
                {video?.uri ? (
                  <VideoPlayer
                    ref={videoRef1}
                    uri={video.uri}
                    onLayout={(w, h) => setCanvasSize1({ width: w, height: h })}
                    onStatusUpdate={handleStatusUpdate1}
                  />
                ) : (
                  <View style={styles.noVideoPlaceholder}><Text style={styles.noVideoText}>No video loaded</Text></View>
                )}
                {activeVideoIndex === 0 && canvasSize1.width > 0 && (
                  <AnalysisCanvas width={canvasSize1.width} height={canvasSize1.height} />
                )}
              </View>
            </Pressable>

            <View style={styles.verticalDivider} />

            {/* Bottom Video (Video 2) */}
            <Pressable
              style={[
                styles.comparisonPanel,
                activeVideoIndex === 1 && styles.comparisonPanelActive,
              ]}
              onPress={() => {
                setActiveVideoIndex(1);
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={styles.videoLabelRow}>
                <View style={[styles.videoLabelBadge, activeVideoIndex === 1 && styles.videoLabelBadgeActive]}>
                  <Text style={[styles.videoLabelText, activeVideoIndex === 1 && styles.videoLabelTextActive]}>
                    Video 2
                  </Text>
                </View>
              </View>
              <View style={styles.comparisonVideoWrap}>
                {video2?.uri ? (
                  <VideoPlayer
                    ref={videoRef2}
                    uri={video2.uri}
                    onLayout={(w, h) => setCanvasSize2({ width: w, height: h })}
                    onStatusUpdate={handleStatusUpdate2}
                  />
                ) : (
                  <View style={styles.noVideoPlaceholder}><Text style={styles.noVideoText}>No video loaded</Text></View>
                )}
                {activeVideoIndex === 1 && canvasSize2.width > 0 && (
                  <AnalysisCanvas width={canvasSize2.width} height={canvasSize2.height} />
                )}
              </View>
            </Pressable>
          </View>
        )}

        <DrawingToolbar />

        <View style={{ paddingBottom: insets.bottom }}>
          <Scrubber
            videoState={safeActiveVideo}
            onSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
            onStepFrame={handleStepFrame}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exitButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
  },
  pressed: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  videoArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  comparisonVertical: {
    flex: 1,
    flexDirection: 'column',
  },
  comparisonPanel: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  comparisonPanelActive: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  videoLabelRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  videoLabelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  videoLabelBadgeActive: {
    backgroundColor: 'rgba(0,230,118,0.2)',
  },
  videoLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  videoLabelTextActive: {
    color: Colors.accent,
  },
  comparisonVideoWrap: {
    flex: 1,
    position: 'relative',
  },
  verticalDivider: {
    height: 2,
    backgroundColor: Colors.border,
  },
  noVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0F0D',
  },
  noVideoText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});