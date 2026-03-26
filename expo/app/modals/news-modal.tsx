import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Image, ActivityIndicator, Modal } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Newspaper, Play } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanityFetch, sanityImageUrl } from '@/lib/sanity';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { getScreenWidth } from '@/utils/responsive';

const SEGMENTS = ['News', 'Onboarding', 'Tutorials'] as const;

const SCREEN_WIDTH = getScreenWidth();

interface SanityPost {
  _id: string;
  title: string;
  caption?: string;
  mainImage?: {
    asset: {
      _ref: string;
    };
  };
  _createdAt: string;
}

function NewsDetailModal({ post, visible, onClose }: { post: SanityPost | null; visible: boolean; onClose: () => void }) {
  if (!post) return null;

  const imageUrl = post.mainImage?.asset?._ref
    ? sanityImageUrl(post.mainImage.asset._ref)
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <ScrollView
            showsVerticalScrollIndicator={true}
            bounces={true}
            scrollEventThrottle={16}
            contentContainerStyle={styles.modalScrollContent}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="cover" />
            ) : null}
            <View style={styles.modalBodyGradient}>
              <Text style={styles.modalTitle}>{post.title}</Text>
              {post.caption ? (
                <Text style={styles.modalCaption}>{post.caption}</Text>
              ) : null}
              <Text style={styles.modalDate}>
                {new Date(post._createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function NewsContent() {
  const [selectedPost, setSelectedPost] = useState<SanityPost | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('acknowledged_info_post_ids')
      .then((raw) => {
        if (raw) {
          setAcknowledgedIds(JSON.parse(raw));
          console.log('[NewsContent] Loaded acknowledged info IDs:', JSON.parse(raw));
        }
      })
      .catch(() => console.log('[NewsContent] Failed to load acknowledged IDs'));
  }, []);

  const { data: newsPosts, isLoading: newsLoading, isError: newsError, refetch: newsRefetch } = useQuery<SanityPost[]>({
    queryKey: ['sanity-news-posts'],
    queryFn: () =>
      sanityFetch<SanityPost[]>(
        `*[_type == "post" && tabLocation == "news"] | order(_createdAt desc) { _id, title, caption, mainImage, _createdAt }`
      ),
  });

  const { data: infoPosts } = useQuery<SanityPost[]>({
    queryKey: ['sanity-info-posts'],
    queryFn: () =>
      sanityFetch<SanityPost[]>(
        `*[_type == "post" && tabLocation == "info"] | order(_createdAt desc) { _id, title, caption, mainImage, _createdAt }`
      ),
    staleTime: 1000 * 60 * 5,
  });

  const acknowledgedInfoPosts = (infoPosts ?? []).filter((p) => acknowledgedIds.includes(p._id));
  const posts = [...(newsPosts ?? []), ...acknowledgedInfoPosts].sort(
    (a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
  );
  const isLoading = newsLoading;
  const isError = newsError;
  const refetch = newsRefetch;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="rgba(0,0,0,0.5)" />
      </View>
    );
  }

  if (isError) {
    return (
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
        <View style={styles.emptyState}>
          <Newspaper size={48} color="rgba(0,0,0,0.25)" />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>Could not load news. Pull down to retry.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton} activeOpacity={0.7}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
        <View style={styles.emptyState}>
          <Newspaper size={48} color="rgba(0,0,0,0.25)" />
          <Text style={styles.emptyTitle}>News</Text>
          <Text style={styles.emptySubtitle}>Latest updates and announcements will appear here</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.newsListContainer}>
        {posts.map((post) => {
          const imageUrl = post.mainImage?.asset?._ref
            ? sanityImageUrl(post.mainImage.asset._ref)
            : null;

          return (
            <TouchableOpacity
              key={post._id}
              style={styles.newsCard}
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPost(post);
              }}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.newsCardImage} resizeMode="cover" />
              ) : null}
              <View style={styles.newsCardBody}>
                <Text style={styles.newsCardTitle}>{post.title}</Text>
                {post.caption ? (
                  <Text style={styles.newsCardCaption}>{post.caption}</Text>
                ) : null}
                <Text style={styles.newsCardDate}>
                  {new Date(post._createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <NewsDetailModal
        post={selectedPost}
        visible={selectedPost !== null}
        onClose={() => setSelectedPost(null)}
      />
    </>
  );
}

export const ONBOARDING_CARDS = [
  { header: 'Profile', number: 1, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/btkoot8ufsc99ndex0kdw', description: 'Home screen, where you can access or start any part of the app.' },
  { header: 'Start Round', number: 2, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xoqkqtvi1ncpx3aaftb0c', description: 'Play rounds with friends. 40k Golf courses, invite buddies and take some course records!' },
  { header: 'Start Practice', number: 3, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8e36cs2dl821sjnm6tscu', description: 'Get better at the game, track your data on the training field and make it translate over to the course' },
  { header: 'Drill Yourself', number: 4, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/13xpd0v8icbcvby3o6e55', description: 'Do practice drills, use your sensors for automatic data detailed and a professional way of tracking.' },
  { header: 'See results', number: 5, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/23331tcxrx7fmhsouy8yu', description: 'See how you perform at the practice facilities over time, learn your strengths and weaknesses.' },
  { header: 'Wind data', number: 6, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/trh9wg0765xkpj238r4wg', description: 'Understand how the wind and weather effects your ball flight' },
  { header: 'GPS Analysis', number: 7, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/tv25zeknpu4m9bo6i7o9n', description: 'Get a birdsview at the course to know how to navigate yourself and see your patterns.' },
  { header: 'Advanced Data', number: 8, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/9w1isv9nxldjv978ip23x', description: 'Learn your stats for each round, bring to the practice facilities to work on Weaknesses and get better at your strengths' },
];

function FlippableCard({ card }: { card: typeof ONBOARDING_CARDS[number] }) {
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
    <View style={styles.cardWrapper}>
      <Text style={styles.cardHeader}>{card.header}</Text>
      <TouchableOpacity activeOpacity={0.9} onPress={handleFlip} style={styles.cardTouchable}>
        <Animated.View
          style={[
            styles.cardFace,
            { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
          ]}
        >
          <Image source={{ uri: card.image }} style={styles.cardImage} resizeMode="cover" />
        </Animated.View>
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBack,
            { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
          ]}
        >
          <Text style={styles.cardNumberTopLeft}>{card.number}</Text>
          <View style={styles.cardBackContent}>
            <Text style={styles.cardBackHeader}>{card.header}</Text>
            <Text style={styles.cardBackDescription}>{card.description}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function OnboardingContent() {
  return (
    <ScrollView style={styles.contentScroll} contentContainerStyle={styles.onboardingContainer}>
      {ONBOARDING_CARDS.map((card) => (
        <FlippableCard key={card.number} card={card} />
      ))}
    </ScrollView>
  );
}

function TutorialsContent() {
  return (
    <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
      <View style={styles.emptyState}>
        <Play size={48} color="rgba(0,0,0,0.25)" />
        <Text style={styles.emptyTitle}>Tutorials</Text>
        <Text style={styles.emptySubtitle}>Step-by-step tutorials to improve your game</Text>
      </View>
    </ScrollView>
  );
}

export default function NewsModal() {
  const insets = useSafeAreaInsets();
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const handleSegmentPress = useCallback((index: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSegment(index);
    Animated.spring(underlineAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }, [underlineAnim]);

  const segmentWidth = (SCREEN_WIDTH - 48) / SEGMENTS.length;
  const underlineWidth = 40;

  const translateX = underlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      (segmentWidth - underlineWidth) / 2,
      segmentWidth + (segmentWidth - underlineWidth) / 2,
      segmentWidth * 2 + (segmentWidth - underlineWidth) / 2,
    ],
  });

  const renderContent = () => {
    switch (activeSegment) {
      case 0:
        return <NewsContent />;
      case 1:
        return <OnboardingContent />;
      case 2:
        return <TutorialsContent />;
      default:
        return <NewsContent />;
    }
  };

  return (
    <LinearGradient
      colors={['#EBF4FF', '#D6EAFF', '#C2DFFF', '#EBF4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <GlassBackButton onPress={() => router.back()} />
        <Text style={styles.title}>Information</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.segmentContainer}>
        <View style={styles.segmentRow}>
          {SEGMENTS.map((segment, index) => (
            <TouchableOpacity
              key={segment}
              style={[styles.segmentButton, { width: segmentWidth }]}
              onPress={() => handleSegmentPress(index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeSegment === index && styles.segmentTextActive,
                ]}
              >
                {segment}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View
          style={[
            styles.segmentUnderline,
            {
              width: underlineWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>

      <View style={styles.contentArea}>
        {renderContent()}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  segmentContainer: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
  },
  segmentRow: {
    flexDirection: 'row' as const,
  },
  segmentButton: {
    paddingVertical: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  segmentTextActive: {
    color: '#1A1A1A',
    fontWeight: '700' as const,
  },
  segmentUnderline: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 1.5,
  },
  contentArea: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center' as const,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  newsListContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  newsCard: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  newsCardImage: {
    width: '100%' as const,
    height: 180,
  },
  newsCardBody: {
    padding: 14,
    gap: 6,
  },
  newsCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  newsCardCaption: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
    lineHeight: 19,
  },

  newsCardDate: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.35)',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    width: '100%' as const,
    maxHeight: '85%' as const,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    backgroundColor: '#D6EAFF',
  },
  modalScrollContent: {
    flexGrow: 1,
  },

  modalCloseButton: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  modalImage: {
    width: '100%' as const,
    height: 240,
  },
  modalBodyGradient: {
    padding: 20,
    paddingBottom: 24,
    gap: 10,
    backgroundColor: '#D6EAFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#000000',
  },
  modalCaption: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  modalDate: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  onboardingContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 60,
  },
  cardWrapper: {
    marginBottom: 24,
    alignItems: 'center' as const,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  cardTouchable: {
    width: '80%' as const,
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'visible' as const,
  },
  cardFace: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backfaceVisibility: 'hidden' as const,
    overflow: 'hidden' as const,
  },
  cardBack: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardImage: {
    width: '100%' as const,
    height: '100%' as const,
    borderRadius: 16,
  },
  cardNumberTopLeft: {
    position: 'absolute' as const,
    top: 16,
    left: 18,
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#1A1A1A',
    zIndex: 2,
  },
  cardBackContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  cardBackHeader: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  cardBackDescription: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: 'rgba(0,0,0,0.55)',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
});
