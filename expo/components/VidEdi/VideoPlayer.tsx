import React, { forwardRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface VideoPlayerProps {
  uri: string;
  onLayout?: (width: number, height: number) => void;
  onStatusUpdate?: (status: AVPlaybackStatus) => void;
}

const VideoPlayer = forwardRef<Video, VideoPlayerProps>(({ uri, onLayout, onStatusUpdate }, ref) => {
  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      onStatusUpdate?.(status);
    },
    [onStatusUpdate]
  );

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      onLayout?.(width, height);
    },
    [onLayout]
  );

  if (!uri) return null;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Video
        ref={ref}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        shouldPlay={false}
        useNativeControls={false}
        progressUpdateIntervalMillis={50}
      />
    </View>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
});
