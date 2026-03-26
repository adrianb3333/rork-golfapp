import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, User, MessageCircle, Users, Check, X as XIcon } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile, UserProfile, CrewInvite } from '@/contexts/ProfileContext';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileCard from '@/components/ProfileCard';
import * as Haptics from 'expo-haptics';
import { useChat } from '@/contexts/ChatContext';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'general' | 'crew_invite';
  message: string;
  username: string;
  timestamp: string;
  read: boolean;
  userProfile: UserProfile | null;
  crewInvite?: CrewInvite;
}

export default function NotificationsModal() {
  const router = useRouter();
  const { followers, isFollowing, toggleFollow, pendingCrewInvites, acceptCrewInvite, declineCrewInvite, crewColor } = useProfile();
  const { hasUnreadChats, markChatsRead } = useChat();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileCardUser, setProfileCardUser] = useState<UserProfile | null>(null);
  const [profileCardVisible, setProfileCardVisible] = useState<boolean>(false);

  useEffect(() => {
    const crewNotifs: Notification[] = pendingCrewInvites.map((invite) => ({
      id: `crew-${invite.id}`,
      type: 'crew_invite' as const,
      message: `invited you to join ${invite.crewName} as ${invite.role}`,
      username: invite.crewName,
      timestamp: new Date(invite.createdAt).toISOString(),
      read: false,
      userProfile: null,
      crewInvite: invite,
    }));

    const followNotifs: Notification[] = followers.map((f, idx) => ({
      id: f.id || `notif-${idx}`,
      type: 'follow' as const,
      message: `started following you`,
      username: f.display_name || f.username || 'Someone',
      timestamp: new Date(Date.now() - idx * 3600000 * (idx + 1)).toISOString(),
      read: idx > 1,
      userProfile: f,
    }));

    setNotifications([...crewNotifs, ...followNotifs]);
    setLoading(false);
  }, [followers, pendingCrewInvites]);

  const handleAcceptCrewInvite = useCallback(async (inviteId: string) => {
    console.log('[Notifications] Accepting crew invite:', inviteId);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await acceptCrewInvite(inviteId);
  }, [acceptCrewInvite]);

  const handleDeclineCrewInvite = useCallback(async (inviteId: string) => {
    console.log('[Notifications] Declining crew invite:', inviteId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await declineCrewInvite(inviteId);
  }, [declineCrewInvite]);

  const openProfileCard = useCallback((user: UserProfile | null) => {
    if (!user) return;
    console.log('[Notifications] Opening profile card for:', user.username);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileCardUser(user);
    setProfileCardVisible(true);
  }, []);

  const handleToggleFollow = useCallback(async (targetUserId: string) => {
    console.log('[Notifications] Toggle follow:', targetUserId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleFollow(targetUserId);
    } catch (err: any) {
      console.error('[Notifications] Toggle follow error:', err.message);
    }
  }, [toggleFollow]);

  const formatTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  const markAsRead = useCallback((notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  }, []);

  const handleNotificationPress = useCallback((item: Notification) => {
    if (!item.read) {
      console.log('[Notifications] Marking as read:', item.id);
      markAsRead(item.id);
    }
    openProfileCard(item.userProfile);
  }, [markAsRead, openProfileCard]);

  const renderNotification = ({ item }: { item: Notification }) => {
    if (item.type === 'crew_invite' && item.crewInvite) {
      const invite = item.crewInvite;
      const bgColor = crewColor && crewColor !== '#1A1A1A' ? crewColor : '#1A1A1A';
      return (
        <View style={[s.crewInviteCard, { backgroundColor: bgColor }]}>
          <View style={s.crewInviteTop}>
            <View style={s.crewInviteIconWrap}>
              <Users size={18} color="#FFFFFF" />
            </View>
            <View style={s.crewInviteContent}>
              <Text style={s.crewInviteTitle}>Crew Invite</Text>
              <Text style={s.crewInviteMessage}>
                Join <Text style={s.crewInviteBold}>{invite.crewName}</Text> as {invite.role}
              </Text>
            </View>
          </View>
          <View style={s.crewInviteButtons}>
            <TouchableOpacity
              style={s.crewDeclineBtn}
              onPress={() => void handleDeclineCrewInvite(invite.id)}
              activeOpacity={0.7}
            >
              <XIcon size={14} color="#1A1A1A" />
              <Text style={s.crewDeclineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleAcceptCrewInvite(invite.id)}
              activeOpacity={0.7}
              style={s.crewAcceptBtnOuter}
            >
              <LinearGradient
                colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.crewAcceptBtn}
              >
                <Check size={14} color="#FFFFFF" />
                <Text style={s.crewAcceptBtnText}>Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[s.notifRow, !item.read && s.notifUnread]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={s.notifIconWrap}>
          {item.userProfile?.avatar_url ? (
            <Image source={{ uri: item.userProfile.avatar_url }} style={s.notifAvatar} />
          ) : (
            <View style={s.notifAvatarPlaceholder}>
              <User size={16} color="rgba(0,0,0,0.35)" />
            </View>
          )}
        </View>
        <View style={s.notifContent}>
          <Text style={s.notifText}>
            <Text style={s.notifUsername}>{item.username}</Text>
            {' '}{item.message}
          </Text>
          <Text style={s.notifTime}>{formatTime(item.timestamp)}</Text>
        </View>
        {!item.read && <View style={s.unreadDot} />}
      </TouchableOpacity>
    );
  };

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
          <Text style={s.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={s.chatIconButton}
            activeOpacity={0.7}
            onPress={() => {
              console.log('[Notifications] Opening chat list');
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              markChatsRead();
              router.push('/modals/chat-list-modal');
            }}
            testID="notifications-chat-icon"
          >
            <MessageCircle size={22} color="#1A1A1A" strokeWidth={2} />
            {hasUnreadChats && <View style={s.chatUnreadDot} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.emptyState}>
          <Bell size={40} color="rgba(0,0,0,0.2)" />
          <Text style={s.emptyTitle}>No notifications</Text>
          <Text style={s.emptySubtext}>When someone follows you or interacts, it will show up here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ProfileCard
        visible={profileCardVisible}
        onClose={() => {
          setProfileCardVisible(false);
          setProfileCardUser(null);
        }}
        onNavigateAway={() => {
          router.back();
        }}
        user={profileCardUser}
        isFollowingUser={profileCardUser ? isFollowing(profileCardUser.id) : false}
        onToggleFollow={profileCardUser ? () => handleToggleFollow(profileCardUser.id) : undefined}
      />
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
  chatIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  notifRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  notifUnread: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden' as const,
    marginRight: 14,
  },
  notifAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notifAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  notifUsername: {
    fontWeight: '700' as const,
    color: '#000000',
  },
  notifTime: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  chatUnreadDot: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  crewInviteCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  crewInviteTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 14,
  },
  crewInviteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  crewInviteContent: {
    flex: 1,
  },
  crewInviteTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  crewInviteMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  crewInviteBold: {
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  crewInviteButtons: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  crewDeclineBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
  },
  crewDeclineBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  crewAcceptBtnOuter: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  crewAcceptBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  crewAcceptBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
