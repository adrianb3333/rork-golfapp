import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/contexts/ProfileContext';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: [string, string];
  last_message: string;
  last_message_at: string;
  other_user: UserProfile | null;
}

const STORAGE_KEY = 'chat_conversations';
const MESSAGES_KEY = 'chat_messages';
const UNREAD_CHAT_KEY = 'chat_unread_flag';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function getConversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join('_');
}

function useChatState() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [hasUnreadChats, setHasUnreadChats] = useState<boolean>(false);

  useEffect(() => {
    void AsyncStorage.getItem(UNREAD_CHAT_KEY).then((val) => {
      if (val === 'true') setHasUnreadChats(true);
    });
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const conversationsQuery = useQuery({
    queryKey: ['conversations', userId],
    queryFn: async (): Promise<Conversation[]> => {
      if (!userId) return [];
      console.log('[ChatContext] Loading conversations for:', userId);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const all: Conversation[] = stored ? JSON.parse(stored) : [];
      const mine = all.filter(c => c.participant_ids.includes(userId));

      const otherIds = mine.map(c => c.participant_ids.find(id => id !== userId)).filter(Boolean) as string[];
      if (otherIds.length === 0) return mine;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', otherIds);

      const profileMap = new Map<string, UserProfile>();
      (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p as UserProfile));

      return mine.map(c => {
        const otherId = c.participant_ids.find(id => id !== userId) ?? '';
        return { ...c, other_user: profileMap.get(otherId) ?? null };
      }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    },
    enabled: !!userId,
  });

  const loadMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    console.log('[ChatContext] Loading messages for conversation:', conversationId);
    const stored = await AsyncStorage.getItem(MESSAGES_KEY);
    const all: ChatMessage[] = stored ? JSON.parse(stored) : [];
    return all
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ otherUserId, text }: { otherUserId: string; text: string }) => {
      if (!userId) throw new Error('Not authenticated');
      console.log('[ChatContext] Sending message to:', otherUserId);

      const convId = getConversationId(userId, otherUserId);
      const now = new Date().toISOString();

      const message: ChatMessage = {
        id: generateId(),
        conversation_id: convId,
        sender_id: userId,
        text,
        created_at: now,
      };

      const storedMsgs = await AsyncStorage.getItem(MESSAGES_KEY);
      const allMsgs: ChatMessage[] = storedMsgs ? JSON.parse(storedMsgs) : [];
      allMsgs.push(message);
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(allMsgs));

      const storedConvs = await AsyncStorage.getItem(STORAGE_KEY);
      const allConvs: Conversation[] = storedConvs ? JSON.parse(storedConvs) : [];
      const existingIdx = allConvs.findIndex(c => c.id === convId);

      if (existingIdx >= 0) {
        allConvs[existingIdx].last_message = text;
        allConvs[existingIdx].last_message_at = now;
      } else {
        allConvs.push({
          id: convId,
          participant_ids: [userId, otherUserId].sort() as [string, string],
          last_message: text,
          last_message_at: now,
          other_user: null,
        });
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allConvs));

      setHasUnreadChats(true);
      await AsyncStorage.setItem(UNREAD_CHAT_KEY, 'true');

      return message;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
    },
  });

  const getOrCreateConversation = useCallback((otherUserId: string): string => {
    if (!userId) return '';
    return getConversationId(userId, otherUserId);
  }, [userId]);

  const refetchConversations = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
  }, [queryClient, userId]);

  const markChatsRead = useCallback(() => {
    console.log('[ChatContext] Marking chats as read');
    setHasUnreadChats(false);
    void AsyncStorage.setItem(UNREAD_CHAT_KEY, 'false');
  }, []);

  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data]);

  return useMemo(() => ({
    userId,
    conversations,
    isLoadingConversations: conversationsQuery.isLoading,
    loadMessages,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    getOrCreateConversation,
    refetchConversations,
    hasUnreadChats,
    markChatsRead,
  }), [userId, conversations, conversationsQuery.isLoading, loadMessages, sendMessageMutation.mutateAsync, sendMessageMutation.isPending, getOrCreateConversation, refetchConversations, hasUnreadChats, markChatsRead]);
}

export const [ChatProvider, useChat] = createContextHook(useChatState);
