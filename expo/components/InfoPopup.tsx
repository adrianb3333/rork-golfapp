import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanityFetch, sanityImageUrl } from '@/lib/sanity';
import * as Haptics from 'expo-haptics';
import { getScreenWidth } from '@/utils/responsive';

const STORAGE_KEY = 'acknowledged_info_post_ids';
const SCREEN_WIDTH = getScreenWidth();

interface SanityInfoPost {
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

async function getAcknowledgedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    console.log('[InfoPopup] Failed to read acknowledged IDs');
    return [];
  }
}

async function saveAcknowledgedId(id: string): Promise<void> {
  try {
    const existing = await getAcknowledgedIds();
    if (!existing.includes(id)) {
      existing.push(id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      console.log('[InfoPopup] Saved acknowledged ID:', id);
    }
  } catch {
    console.log('[InfoPopup] Failed to save acknowledged ID');
  }
}

export default function InfoPopup({ ready = true }: { ready?: boolean }) {
  const [visible, setVisible] = useState<boolean>(false);
  const [pendingPost, setPendingPost] = useState<SanityInfoPost | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const queryClient = useQueryClient();

  const { data: infoPosts } = useQuery<SanityInfoPost[]>({
    queryKey: ['sanity-info-posts'],
    queryFn: () =>
      sanityFetch<SanityInfoPost[]>(
        `*[_type == "post" && tabLocation == "info"] | order(_createdAt desc) { _id, title, caption, mainImage, _createdAt }`
      ),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!ready) {
      console.log('[InfoPopup] Not ready yet, waiting...');
      return;
    }
    if (!infoPosts || infoPosts.length === 0) return;

    const latestPost = infoPosts[0];
    console.log('[InfoPopup] Latest info post:', latestPost._id, latestPost.title);

    getAcknowledgedIds().then((ids) => {
      if (!ids.includes(latestPost._id)) {
        console.log('[InfoPopup] Post not acknowledged, showing popup');
        setPendingPost(latestPost);
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 200,
            friction: 20,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        console.log('[InfoPopup] Post already acknowledged');
      }
    });
  }, [infoPosts, fadeAnim, scaleAnim, ready]);

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [fadeAnim, scaleAnim]);

  const handleDismiss = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeModal();
  }, [closeModal]);

  const handleUnderstand = useCallback(async () => {
    if (!pendingPost) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveAcknowledgedId(pendingPost._id);
    queryClient.invalidateQueries({ queryKey: ['sanity-news-posts'] });
    closeModal();
  }, [pendingPost, closeModal, queryClient]);

  if (!visible || !pendingPost) return null;

  const imageUrl = pendingPost.mainImage?.asset?._ref
    ? sanityImageUrl(pendingPost.mainImage.asset._ref)
    : null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.overlayPress} onPress={handleDismiss}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', alignItems: 'center' as const }}>
            <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleDismiss}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="info-popup-close"
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>

              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder} />
              )}

              <ScrollView
                style={styles.bodyScroll}
                contentContainerStyle={styles.body}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.title}>{pendingPost.title}</Text>
                {pendingPost.caption ? (
                  <Text style={styles.caption}>{pendingPost.caption}</Text>
                ) : null}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.understandButton}
                  onPress={handleUnderstand}
                  activeOpacity={0.8}
                  testID="info-popup-understand"
                >
                  <Text style={styles.understandText}>Understand</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 380);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayPress: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#F0F6FF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#D6EAFF',
  },
  bodyScroll: {
    maxHeight: 200,
  },
  body: {
    padding: 20,
    paddingBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '800' as const,
    color: '#0A1A2A',
    lineHeight: 26,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: 'rgba(10,26,42,0.65)',
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  understandButton: {
    backgroundColor: '#1A6FEF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A6FEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  understandText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
