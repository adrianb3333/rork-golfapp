import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { useChat, ChatMessage } from '@/contexts/ChatContext';
import * as Haptics from 'expo-haptics';

export default function ChatConversationModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ otherUserId: string; otherUsername: string; otherAvatar: string }>();
  const { userId, loadMessages, sendMessage, getOrCreateConversation, isSending } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const flatListRef = useRef<FlatList>(null);

  const otherUserId = params.otherUserId ?? '';
  const otherUsername = params.otherUsername ?? 'User';
  const otherAvatar = params.otherAvatar ?? '';
  const conversationId = getOrCreateConversation(otherUserId);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    console.log('[ChatConversation] Fetching messages for:', conversationId);
    try {
      const msgs = await loadMessages(conversationId);
      setMessages(msgs);
    } catch (err: any) {
      console.error('[ChatConversation] Error loading messages:', err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !otherUserId) return;
    console.log('[ChatConversation] Sending message:', trimmed);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    try {
      await sendMessage({ otherUserId, text: trimmed });
      const msgs = await loadMessages(conversationId);
      setMessages(msgs);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error('[ChatConversation] Send error:', err.message);
    }
  }, [inputText, otherUserId, sendMessage, loadMessages, conversationId]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id === userId;
    return (
      <View style={[s.messageBubbleRow, isMe ? s.messageBubbleRowRight : s.messageBubbleRowLeft]}>
        {!isMe && (
          otherAvatar ? (
            <Image source={{ uri: otherAvatar }} style={s.msgAvatar} />
          ) : (
            <View style={s.msgAvatarPlaceholder}>
              <User size={12} color="rgba(0,0,0,0.4)" />
            </View>
          )
        )}
        <View style={[s.messageBubble, isMe ? s.myBubble : s.theirBubble]}>
          <Text style={[s.messageText, isMe ? s.myMessageText : s.theirMessageText]}>{item.text}</Text>
          <Text style={[s.messageTime, isMe ? s.myMessageTime : s.theirMessageTime]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  }, [userId, otherAvatar]);

  const initials = (otherUsername || '?').slice(0, 2).toUpperCase();

  return (
    <LinearGradient
      colors={['#EBF4FF', '#D6EAFF', '#C2DFFF', '#EBF4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={s.container}
    >
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <GlassBackButton onPress={() => router.back()} />
          <View style={s.headerCenter}>
            {otherAvatar ? (
              <Image source={{ uri: otherAvatar }} style={s.headerAvatar} />
            ) : (
              <View style={s.headerAvatarPlaceholder}>
                <Text style={s.headerInitials}>{initials}</Text>
              </View>
            )}
            <Text style={s.headerTitle} numberOfLines={1}>@{otherUsername}</Text>
          </View>
          <View style={s.headerSpacer} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
          </View>
        ) : messages.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>No messages yet</Text>
            <Text style={s.emptySubtext}>Say hello to @{otherUsername}!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={s.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <SafeAreaView edges={['bottom']} style={s.inputSafeArea}>
          <View style={s.inputRow}>
            <TextInput
              style={s.textInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              returnKeyType="default"
              testID="chat-input"
            />
            <TouchableOpacity
              style={[s.sendButton, (!inputText.trim() || isSending) && s.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.7}
              testID="chat-send-button"
            >
              <Send size={18} color={inputText.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerInitials: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    maxWidth: 180,
  },
  headerSpacer: {
    width: 44,
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
    gap: 6,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.4)',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageBubbleRow: {
    flexDirection: 'row' as const,
    marginBottom: 10,
    alignItems: 'flex-end' as const,
  },
  messageBubbleRowRight: {
    justifyContent: 'flex-end' as const,
  },
  messageBubbleRowLeft: {
    justifyContent: 'flex-start' as const,
  },
  msgAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
  },
  msgAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%' as const,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: '#1A1A1A',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#1A1A1A',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right' as const,
  },
  theirMessageTime: {
    color: 'rgba(0,0,0,0.35)',
  },
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1A1A1A',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
