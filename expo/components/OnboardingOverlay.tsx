import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import { X, Hand } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ONBOARDING_CARDS } from '@/app/modals/news-modal';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

interface OnboardingFlipCardProps {
  card: typeof ONBOARDING_CARDS[number];
}

function OnboardingFlipCard({ card }: OnboardingFlipCardProps) {
  const [flipped, setFlipped] = useState<boolean>(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handleFlip = useCallback(() => {
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      useNativeDriver: true,
      tension: 400,
      friction: 30,
    }).start();
    setFlipped(!flipped);
  }, [flipped, flipAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '270deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={styles.slideCard}>
      <Text style={styles.slideCardHeader}>{card.header}</Text>
      <TouchableOpacity activeOpacity={0.9} onPress={handleFlip} style={styles.slideCardTouchable}>
        <Animated.View
          style={[
            styles.slideCardFace,
            { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
          ]}
        >
          <Image source={{ uri: card.image }} style={styles.slideCardImage} resizeMode="cover" />
        </Animated.View>
        <Animated.View
          style={[
            styles.slideCardFace,
            styles.slideCardBack,
            { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
          ]}
        >
          <Text style={styles.slideCardNumberTopLeft}>{card.number}</Text>
          <View style={styles.slideCardBackContent}>
            <Text style={styles.slideCardBackHeader}>{card.header}</Text>
            <Text style={styles.slideCardBackDescription}>{card.description}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

interface OnboardingOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function OnboardingOverlay({ visible, onDismiss }: OnboardingOverlayProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const hintBounce = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      hintOpacity.setValue(1);

      const bounceLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(hintBounce, { toValue: -8, duration: 600, useNativeDriver: true }),
          Animated.timing(hintBounce, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      bounceLoop.start();

      const hintTimer = setTimeout(() => {
        Animated.timing(hintOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
          bounceLoop.stop();
        });
      }, 4000);

      return () => {
        clearTimeout(hintTimer);
        bounceLoop.stop();
      };
    }
  }, [visible, hintOpacity, hintBounce]);

  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    setCurrentIndex(index);
  }, []);

  const renderItem = useCallback(({ item }: { item: typeof ONBOARDING_CARDS[number] }) => (
    <View style={{ width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2 }}>
      <OnboardingFlipCard card={item} />
    </View>
  ), []);

  const keyExtractor = useCallback((item: typeof ONBOARDING_CARDS[number]) => String(item.number), []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Image source={require('@/assets/images/golferscrib-logo.png')} style={styles.topBarLogo} resizeMode="contain" />
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={onDismiss} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
            <X size={18} color="#999" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.hintContainer, { opacity: hintOpacity, transform: [{ translateY: hintBounce }] }]}>
          <Hand size={20} color="#FFFFFF" />
          <Text style={styles.hintText}>Tap a card to see details</Text>
        </Animated.View>

        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={ONBOARDING_CARDS}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled={false}
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_SPACING / 2,
            }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        </View>

        <View style={styles.pagination}>
          {ONBOARDING_CARDS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.pageIndicator}>
            {currentIndex + 1} / {ONBOARDING_CARDS.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#050505',
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBarLogo: {
    width: 140,
    height: 36,
  },
  skipBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#999',
  },
  hintContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 10,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  slideCard: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  slideCardHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  slideCardTouchable: {
    width: '100%' as const,
    aspectRatio: 9 / 16,
    borderRadius: 16,
  },
  slideCardFace: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backfaceVisibility: 'hidden' as const,
    overflow: 'hidden' as const,
  },
  slideCardBack: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  slideCardImage: {
    width: '100%' as const,
    height: '100%' as const,
    borderRadius: 16,
  },
  slideCardNumberTopLeft: {
    position: 'absolute' as const,
    top: 16,
    left: 18,
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    zIndex: 2,
  },
  slideCardBackContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  slideCardBackHeader: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  slideCardBackDescription: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#B0B0B0',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  pagination: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
    borderRadius: 4,
  },
  bottomBar: {
    alignItems: 'center' as const,
  },
  pageIndicator: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#555',
  },
});
