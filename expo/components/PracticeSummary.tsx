import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/contexts/SessionContext';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();

const TAB_LABELS = ['DATA', 'Shot Overview'];

export default function PracticeSummary() {
  const { dismissPracticeSummary } = useSession();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      if (index >= 0 && index < TAB_LABELS.length) {
        setActiveIndex(index);
      }
    },
    []
  );

  const handleTabPress = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.tabBar}>
          {TAB_LABELS.map((label, index) => (
            <TouchableOpacity
              key={label}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeIndex === index && styles.tabLabelActive,
                ]}
              >
                {label}
              </Text>
              {activeIndex === index && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <Text style={styles.pageTitle}>DATA</Text>
          </View>
        </View>

        <View style={styles.page}>
          <View style={styles.pageContent}>
            <Text style={styles.pageTitle}>Shot Overview</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.dotRow}>
        {TAB_LABELS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 32 }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismissPracticeSummary}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 24,
  },
  tabBar: {
    flexDirection: 'row' as const,
    gap: 28,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabItem: {
    paddingBottom: 10,
    position: 'relative' as const,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#A4D15F',
    borderRadius: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  pageContent: {
    flex: 1,
    alignItems: 'center' as const,
    paddingTop: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  dotRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#A4D15F',
    width: 24,
  },
  footer: {
    paddingHorizontal: 24,
  },
  closeButton: {
    backgroundColor: '#A4D15F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
