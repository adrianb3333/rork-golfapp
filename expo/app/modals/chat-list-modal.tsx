import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { useChat, Conversation } from '@/contexts/ChatContext';
import * as Haptics from 'expo-haptics';

export default function ChatListModal() {
  const router = useRouter();
  const { conversations, isLoadingConversations, refetchConversations } = useChat();

  useEffect(() => {
    console.log('[ChatList] Mounted, conversations:', conversations.length);
    refetchConversations();
  }, [refetchConversations, conversations.length]);

  const formatTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  const openConversation = useCallback((conv: Conversation) => {
    console.log('[ChatList] Opening conversation with:', conv.other_user?.username);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/modals/chat-conversation-modal',
      params: {
        otherUserId: conv.other_user?.id ?? '',
        otherUsername: conv.other_user?.username ?? conv.other_user?.display_name ?? 'User',
        otherAvatar: conv.other_user?.avatar_url ?? '',
      },
    });
  }, [router]);

  const renderConversation = useCallback(({ item }: { item: Conversation }) => {
    const displayName = item.other_user?.display_name || item.other_user?.username || 'User';
    const username = item.other_user?.username || 'user';
    const avatarUrl = item.other_user?.avatar_url;
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
      <TouchableOpacity
        style={s.convRow}
        activeOpacity={0.7}
        onPress={() => openConversation(item)}
        testID={`conv-${item.id}`}
      >
        <View style={s.convAvatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.convAvatar} />
          ) : (
            <View style={s.convAvatarPlaceholder}>
              <Text style={s.convAvatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={s.convContent}>
          <View style={s.convTopRow}>
            <Text style={s.convName} numberOfLines={1}>@{username}</Text>
            <Text style={s.convTime}>{formatTime(item.last_message_at)}</Text>
          </View>
          <Text style={s.convLastMsg} numberOfLines={1}>{item.last_message}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [openConversation]);

  return (
    <LinearGradient
      colors={['#EBF4FF', '#D6EAFF', '#C2DFFF', '#EBF4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={s.gradientContainer}
    >
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <GlassBackButton onPress={() => router.back()} />
          <Text style={s.headerTitle}>Chat</Text>
          <View style={s.headerSpacer} />
        </View>
      </SafeAreaView>

      {isLoadingConversations ? (
        <View style={s.centered}>
          <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={s.emptyState}>
          <MessageCircle size={40} color="rgba(0,0,0,0.2)" />
          <Text style={s.emptyTitle}>No conversations</Text>
          <Text style={s.emptySubtext}>Start a conversation by visiting someone's profile and tapping "Text"</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeTop: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  convRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  convAvatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden' as const,
    marginRight: 14,
  },
  convAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  convAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  convAvatarInitials: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  convContent: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 3,
  },
  convName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  convTime: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
  convLastMsg: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    lineHeight: 18,
  },
});
