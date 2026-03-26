import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

export const useButtonAnimations = (count: number) => {
  const animations = useRef(
    Array(count).fill(0).map(() => new Animated.Value(1))
  ).current;

  const onPressIn = useCallback((index: number) => {
    Animated.spring(animations[index], {
      toValue: 0.9,
      useNativeDriver: true
    }).start();
  }, [animations]);

  const onPressOut = useCallback((index: number) => {
    Animated.spring(animations[index], {
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [animations]);

  return { animations, onPressIn, onPressOut };
};
