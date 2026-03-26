import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';

export default function WindArrow({ rotationStyle }: { rotationStyle: any }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationStyle.value}deg` }],
  }));

  const Container = Platform.OS !== 'web' ? Animated.View : View;
  const containerStyle = Platform.OS !== 'web' ? [styles.container, animatedStyle] : styles.container;

  return (
    <Container style={containerStyle} pointerEvents="none">
      <Svg height="300" width="300" viewBox="0 0 300 300">
        <Path
          d="M150,30 L157,130 L150,145 L143,130 Z"
          fill="#000000"
          opacity="1"
        />
        <Circle cx="150" cy="150" r="4.5" fill="#000000" opacity="0.9" />
      </Svg>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
});
