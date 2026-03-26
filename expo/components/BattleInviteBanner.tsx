import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Swords, User } from 'lucide-react-native';
import { useBattle, BattleInvite } from '@/contexts/BattleContext';
import { useSession } from '@/contexts/SessionContext';
import * as Haptics from 'expo-haptics';

export default function BattleInviteBanner() {
  const insets = useSafeAreaInsets();
  const { pendingInvites, acceptInvite, declineInvite, shouldNavigateToPractice, clearNavigateToPractice, activeBattle } = useBattle();
  const { startBattlePractice } = useSession();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const currentInvite = pendingInvites.length > 0 ? pendingInvites[0] : null;

  useEffect(() => {
    if (currentInvite) {
      console.log('[BattleInviteBanner] Showing invite from:', currentInvite.from_display_name);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 12,
        tension: 65,
      }).start();
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [currentInvite, slideAnim]);

  useEffect(() => {
    if (shouldNavigateToPractice && activeBattle) {
      console.log('[BattleInviteBanner] Navigating to practice for battle:', activeBattle.battle_name);
      clearNavigateToPractice();
      setTimeout(() => {
        startBattlePractice();
      }, 300);
    }
  }, [shouldNavigateToPractice, activeBattle, clearNavigateToPractice, startBattlePractice]);

  const handleAccept = useCallback(async (invite: BattleInvite) => {
    console.log('[BattleInviteBanner] Accepting invite:', invite.id);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await acceptInvite(invite.id);
  }, [acceptInvite]);

  const handleDecline = useCallback(async (invite: BattleInvite) => {
    console.log('[BattleInviteBanner] Declining invite:', invite.id);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await declineInvite(invite.id);
  }, [declineInvite]);

  if (!currentInvite) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#1C8CFF', '#1075E3', '#0059B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bannerCard}
      >
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Swords size={20} color="#FFFFFF" />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.headerText}>Battle Invite</Text>
            <Text style={styles.fromText} numberOfLines={1}>
              {currentInvite.from_display_name} challenged you!
            </Text>
          </View>
          {currentInvite.from_avatar_url ? (
            <Image source={{ uri: currentInvite.from_avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={16} color="rgba(255,255,255,0.6)" />
            </View>
          )}
        </View>

        <Text style={styles.detailsText}>
          {currentInvite.battle_name} · {currentInvite.rounds} rounds · {currentInvite.shots_per_round} shots
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => void handleDecline(currentInvite)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF1C1C', '#E31010', '#B20000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => void handleAccept(currentInvite)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  bannerCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textBlock: {
    flex: 1,
  },
  headerText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  fromText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  acceptBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  btnGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
