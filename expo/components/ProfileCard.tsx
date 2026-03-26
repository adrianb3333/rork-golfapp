import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Trophy, MessageSquare, UserPlus, UserCheck, Send, User } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/supabase';
import { useChat, ChatMessage } from '@/contexts/ChatContext';
import * as Haptics from 'expo-haptics';
import { wp, fp } from '@/utils/responsive';

interface TourData {
  eventsPlayed: number;
  placements: string;
  earnings: string;
  rank: string;
  age: number;
}

const MOCK_TOUR_DATA: TourData = {
  eventsPlayed: 3,
  placements: 'T5',
  earnings: '1.2k SEK',
  rank: '#42',
  age: 27,
};

interface ProfileCardProps {
  visible: boolean;
  onClose: () => void;
  _onNavigateAway?: () => void;
  user: UserProfile | null;
  isFollowingUser?: boolean;
  onToggleFollow?: () => void;
}

function useUserSocialCounts(userId: string | null, visible: boolean) {
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId || !visible) {
      setFollowersCount(0);
      setFollowingCount(0);
      setFriendsCount(0);
      setLoading(true);
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      try {
        console.log('[ProfileCard] Fetching social counts for:', userId);
        const [followersRes, followingRes] = await Promise.all([
          supabase
            .from('follows')
            .select('following_id', { count: 'exact' })
            .eq('following_id', userId),
          supabase
            .from('follows')
            .select('follower_id', { count: 'exact' })
            .eq('follower_id', userId),
        ]);

        if (cancelled) return;

        const fwersCount = followersRes.count ?? 0;
        const fwingCount = followingRes.count ?? 0;

        const followerIds = (followersRes.data ?? []).map((r: any) => r.following_id);
        const followingIds = (followingRes.data ?? []).map((r: any) => r.follower_id);
        const mutualCount = followerIds.filter((id: string) => followingIds.includes(id)).length;

        console.log('[ProfileCard] Social counts:', { followers: fwersCount, following: fwingCount, friends: mutualCount });
        setFollowersCount(fwersCount);
        setFollowingCount(fwingCount);
        setFriendsCount(mutualCount);
      } catch (err: any) {
        console.log('[ProfileCard] Error fetching social counts:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchCounts();
    return () => { cancelled = true; };
  }, [userId, visible]);

  return { followersCount, followingCount, friendsCount, loading };
}

export default function ProfileCard({
  visible,
  onClose,
  _onNavigateAway,
  user,
  isFollowingUser = false,
  onToggleFollow,
}: ProfileCardProps) {
  const [tourModalVisible, setTourModalVisible] = useState<boolean>(false);
  const [chatVisible, setChatVisible] = useState<boolean>(false);
  const { followersCount, followingCount, friendsCount, loading: socialLoading } = useUserSocialCounts(
    user?.id ?? null,
    visible
  );

  const handleOpenChat = useCallback(() => {
    if (!user) return;
    console.log('[ProfileCard] Opening inline chat modal on top of profile card');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChatVisible(true);
  }, [user]);

  const handleCloseChat = useCallback(() => {
    console.log('[ProfileCard] Closing inline chat, returning to profile card');
    setChatVisible(false);
  }, []);

  if (!user) return null;

  const initials = (user.display_name || user.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const homeCourse = 'Bro Hof Slott GC';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#EBF4FF', '#D6EAFF', '#C2DFFF', '#EBF4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={styles.header}>
          <GlassBackButton onPress={onClose} />
          <Text style={styles.headerTitle}>@{user.username}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.avatarSection}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <Text style={styles.displayName}>{user.display_name || user.username}</Text>
            <Text style={styles.homeCourse}>{homeCourse}</Text>
          </View>

          <View style={styles.statsRow}>
            {socialLoading ? (
              <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" />
            ) : (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followersCount}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statSep} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followingCount}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statSep} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{friendsCount}</Text>
                  <Text style={styles.statLabel}>Friends</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.actionRow}>
            {onToggleFollow && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onToggleFollow}
                activeOpacity={0.7}
              >
                {isFollowingUser ? (
                  <UserCheck size={16} color="#1A1A1A" strokeWidth={2.2} />
                ) : (
                  <UserPlus size={16} color="#1A1A1A" strokeWidth={2.2} />
                )}
                <Text style={styles.actionButtonText}>
                  {isFollowingUser ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={handleOpenChat}
              testID="profile-card-text-button"
            >
              <MessageSquare size={16} color="#1A1A1A" strokeWidth={2.2} />
              <Text style={styles.actionButtonText}>Text</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgeRow}>
            <LinearGradient
              colors={['#4BA35B', '#3D954D', '#2D803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.handicapCard}
            >
              <Text style={styles.handicapValue}>HCP</Text>
              <Image
                source={require('@/assets/images/sgf-icon.png')}
                style={styles.handicapSgfIcon}
                resizeMode="contain"
              />
            </LinearGradient>

            <TouchableOpacity
              style={styles.tourCard}
              activeOpacity={0.7}
              onPress={() => {
                console.log('[ProfileCard] TOUR pressed');
                setTourModalVisible(true);
              }}
            >
              <Trophy size={16} color="#FFB74D" />
              <Text style={styles.tourButtonText}>TOUR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Last Round</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmpty}>No round data available</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Last Practice</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmpty}>No practice data available</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <InlineChatModal
        visible={chatVisible}
        onClose={handleCloseChat}
        otherUserId={user.id}
        otherUsername={user.username || user.display_name || 'User'}
        otherAvatar={user.avatar_url || ''}
      />

      <Modal
        visible={tourModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTourModalVisible(false)}
      >
        <View style={tourStyles.overlay}>
          <View style={tourStyles.modalCard}>
            <Text style={tourStyles.modalTitle}>Tour Stats</Text>

            <View style={tourStyles.dataGrid}>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.eventsPlayed}</Text>
                <Text style={tourStyles.dataLabel}>Events Played</Text>
              </View>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.placements}</Text>
                <Text style={tourStyles.dataLabel}>Placements</Text>
              </View>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.earnings}</Text>
                <Text style={tourStyles.dataLabel}>Earnings</Text>
              </View>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.rank}</Text>
                <Text style={tourStyles.dataLabel}>Rank</Text>
              </View>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.age}</Text>
                <Text style={tourStyles.dataLabel}>Age</Text>
              </View>
            </View>

            <View style={tourStyles.closeRow}>
              <TouchableOpacity
                style={tourStyles.closeButton}
                activeOpacity={0.7}
                onPress={() => setTourModalVisible(false)}
              >
                <Text style={tourStyles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function InlineChatModal({
  visible,
  onClose,
  otherUserId,
  otherUsername,
  otherAvatar,
}: {
  visible: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUsername: string;
  otherAvatar: string;
}) {
  const { userId, loadMessages, sendMessage, getOrCreateConversation, isSending } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const flatListRef = useRef<FlatList>(null);

  const conversationId = getOrCreateConversation(otherUserId);

  useEffect(() => {
    if (!visible) {
      setMessages([]);
      setInputText('');
      setLoading(true);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      if (!conversationId) { setLoading(false); return; }
      console.log('[InlineChatModal] Fetching messages for:', conversationId);
      try {
        const msgs = await loadMessages(conversationId);
        if (!cancelled) setMessages(msgs);
      } catch (err: any) {
        console.error('[InlineChatModal] Error loading messages:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetch();
    return () => { cancelled = true; };
  }, [visible, conversationId, loadMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !otherUserId) return;
    console.log('[InlineChatModal] Sending message:', trimmed);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    try {
      await sendMessage({ otherUserId, text: trimmed });
      const msgs = await loadMessages(conversationId);
      setMessages(msgs);
      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    } catch (err: any) {
      console.error('[InlineChatModal] Send error:', err.message);
    }
  }, [inputText, otherUserId, sendMessage, loadMessages, conversationId]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id === userId;
    return (
      <View style={[chatStyles.messageBubbleRow, isMe ? chatStyles.messageBubbleRowRight : chatStyles.messageBubbleRowLeft]}>
        {!isMe && (
          otherAvatar ? (
            <Image source={{ uri: otherAvatar }} style={chatStyles.msgAvatar} />
          ) : (
            <View style={chatStyles.msgAvatarPlaceholder}>
              <User size={12} color="rgba(0,0,0,0.4)" />
            </View>
          )
        )}
        <View style={[chatStyles.messageBubble, isMe ? chatStyles.myBubble : chatStyles.theirBubble]}>
          <Text style={[chatStyles.messageText, isMe ? chatStyles.myMessageText : chatStyles.theirMessageText]}>{item.text}</Text>
          <Text style={[chatStyles.messageTime, isMe ? chatStyles.myMessageTime : chatStyles.theirMessageTime]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  }, [userId, otherAvatar]);

  const initials = (otherUsername || '?').slice(0, 2).toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#EBF4FF', '#D6EAFF', '#C2DFFF', '#EBF4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={chatStyles.container}
      >
        <SafeAreaView edges={['top']} style={chatStyles.safeTop}>
          <View style={chatStyles.header}>
            <GlassBackButton onPress={onClose} />
            <View style={chatStyles.headerCenter}>
              {otherAvatar ? (
                <Image source={{ uri: otherAvatar }} style={chatStyles.headerAvatar} />
              ) : (
                <View style={chatStyles.headerAvatarPlaceholder}>
                  <Text style={chatStyles.headerInitials}>{initials}</Text>
                </View>
              )}
              <Text style={chatStyles.headerTitle} numberOfLines={1}>@{otherUsername}</Text>
            </View>
            <View style={chatStyles.headerSpacer} />
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          style={chatStyles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {loading ? (
            <View style={chatStyles.centered}>
              <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
            </View>
          ) : messages.length === 0 ? (
            <View style={chatStyles.emptyState}>
              <Text style={chatStyles.emptyText}>No messages yet</Text>
              <Text style={chatStyles.emptySubtext}>Say hello to @{otherUsername}!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={chatStyles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          <SafeAreaView edges={['bottom']} style={chatStyles.inputSafeArea}>
            <View style={chatStyles.inputRow}>
              <TextInput
                style={chatStyles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="rgba(0,0,0,0.35)"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                returnKeyType="default"
                testID="inline-chat-input"
              />
              <TouchableOpacity
                style={[chatStyles.sendButton, (!inputText.trim() || isSending) && chatStyles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isSending}
                activeOpacity={0.7}
                testID="inline-chat-send-button"
              >
                <Send size={18} color={inputText.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
}

const chatStyles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  safeTop: { backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
    justifyContent: 'center' as const,
  },
  headerAvatar: { width: wp(32), height: wp(32), borderRadius: wp(16) },
  headerAvatarPlaceholder: {
    width: wp(32), height: wp(32), borderRadius: wp(16),
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerInitials: { fontSize: 12, fontWeight: '700' as const, color: '#1A1A1A' },
  headerTitle: { fontSize: 16, fontWeight: '700' as const, color: '#1A1A1A', maxWidth: 180 },
  headerSpacer: { width: 44 },
  centered: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
  emptyState: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 6 },
  emptyText: { fontSize: 17, fontWeight: '700' as const, color: '#1A1A1A' },
  emptySubtext: { fontSize: 13, color: 'rgba(0,0,0,0.4)' },
  messagesList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  messageBubbleRow: { flexDirection: 'row' as const, marginBottom: 10, alignItems: 'flex-end' as const },
  messageBubbleRowRight: { justifyContent: 'flex-end' as const },
  messageBubbleRowLeft: { justifyContent: 'flex-start' as const },
  msgAvatar: { width: wp(26), height: wp(26), borderRadius: wp(13), marginRight: 8 },
  msgAvatarPlaceholder: {
    width: wp(26), height: wp(26), borderRadius: wp(13),
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  messageBubble: { maxWidth: '75%' as const, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  myBubble: { backgroundColor: '#1A1A1A', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: 'rgba(0,0,0,0.08)', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#FFFFFF' },
  theirMessageText: { color: '#1A1A1A' },
  messageTime: { fontSize: 10, marginTop: 4 },
  myMessageTime: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' as const },
  theirMessageTime: { color: 'rgba(0,0,0,0.35)' },
  inputSafeArea: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sendButton: {
    width: wp(42), height: wp(42), borderRadius: wp(21),
    backgroundColor: '#1A1A1A',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButtonDisabled: { backgroundColor: 'rgba(0,0,0,0.15)' },
});

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center' as const,
  },
  avatarSection: {
    alignItems: 'center' as const,
    paddingTop: 20,
    marginBottom: 16,
  },
  avatar: {
    width: wp(96),
    height: wp(96),
    borderRadius: wp(48),
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: wp(96),
    height: wp(96),
    borderRadius: wp(48),
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: fp(34),
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  displayName: {
    fontSize: fp(20),
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  homeCourse: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.4)',
  },
  statsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 18,
    gap: 16,
    minHeight: 44,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: fp(20),
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 2,
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  actionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 14,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  badgeRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 16,
    width: '100%' as const,
  },
  handicapCard: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  handicapValue: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: -0.5,
  },
  handicapSgfIcon: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
  },
  tourCard: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFB74D30',
    gap: 8,
  },
  tourButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFB74D',
    letterSpacing: 1,
  },
  infoSection: {
    marginBottom: 16,
    width: '100%' as const,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  infoEmpty: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.35)',
    textAlign: 'center' as const,
  },
});

const tourStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start' as const,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  dataGrid: {
    gap: 12,
  },
  dataItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  dataLabel: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.45)',
    fontWeight: '600' as const,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFB74D',
  },
  closeRow: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
});
