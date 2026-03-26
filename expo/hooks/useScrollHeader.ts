import { useRef, useCallback, createContext, useContext } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const HEADER_HIDE_THRESHOLD = 10;

export function useScrollHeader(headerHeight: number = 60) {
  const scrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const isHeaderVisible = useRef(true);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - scrollY.current;

      if (currentY <= 0) {
        if (!isHeaderVisible.current) {
          isHeaderVisible.current = true;
          Animated.spring(headerTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 20,
            tension: 80,
          }).start();
        }
      } else if (diff > HEADER_HIDE_THRESHOLD && isHeaderVisible.current) {
        isHeaderVisible.current = false;
        Animated.timing(headerTranslateY, {
          toValue: -(headerHeight + 60),
          duration: 250,
          useNativeDriver: true,
        }).start();
      } else if (diff < -3 && !isHeaderVisible.current) {
        isHeaderVisible.current = true;
        Animated.spring(headerTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 20,
          tension: 80,
        }).start();
      }

      scrollY.current = currentY;
    },
    [headerTranslateY, headerHeight],
  );

  return { headerTranslateY, onScroll };
}

type ScrollHeaderContextType = {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentPaddingTop?: number;
};

const ScrollHeaderContext = createContext<ScrollHeaderContextType | null>(null);

export const ScrollHeaderProvider = ScrollHeaderContext.Provider;

export function useScrollHeaderContext() {
  const ctx = useContext(ScrollHeaderContext);
  return ctx?.onScroll;
}

export function useScrollHeaderPadding() {
  const ctx = useContext(ScrollHeaderContext);
  return ctx?.contentPaddingTop ?? 0;
}
