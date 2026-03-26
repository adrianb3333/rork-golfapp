import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Flag, Plus, X, Check, User, Search } from 'lucide-react-native';
import { useProfile, UserProfile } from '@/contexts/ProfileContext';
import { useBattle } from '@/contexts/BattleContext';
import * as Haptics from 'expo-haptics';

interface BattleScreenProps {
  onBack: () => void;
  onBattleStart?: () => void;
  onRequestSetPin?: (onPinDone: () => void) => void;
}

const ROUNDS_OPTIONS = [1, 2, 3, 4, 5];
const SHOTS_OPTIONS = [5, 10, 15, 20, 25, 30];

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

export default function BattleScreen({ onBack, onBattleStart, onRequestSetPin }: BattleScreenProps) {
  const insets = useSafeAreaInsets();
  const [battleName, setBattleName] = useState('');
  const [selectedRounds, setSelectedRounds] = useState(3);
  const [selectedShots, setSelectedShots] = useState(10);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinSet, setPinSet] = useState(false);
  const [showNameWarning, setShowNameWarning] = useState(false);
  const [showPinWarning, setShowPinWarning] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));

  const { following, allUsers, isLoadingAllUsers, userId } = useProfile();
  const { sendInvite, startBattleDirectly } = useBattle();

  const totalShots = selectedRounds * selectedShots;

  const friendsList = useMemo(() => {
    if (following.length > 0) return following;
    return allUsers.filter(u => u.id !== userId);
  }, [following, allUsers, userId]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friendsList;
    const q = searchQuery.toLowerCase();
    return friendsList.filter(u =>
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  }, [friendsList, searchQuery]);

  const handleSelectOpponent = useCallback((user: UserProfile) => {
    setSelectedOpponent(user);
    setShowFriendPicker(false);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleSetPin = useCallback(() => {
    console.log('[BattleScreen] Set Pin pressed');
    if (onRequestSetPin) {
      onRequestSetPin(() => {
        console.log('[BattleScreen] Pin set callback received');
        setPinSet(true);
        setShowPinWarning(false);
      });
    } else {
      setPinSet(true);
      setShowPinWarning(false);
    }
  }, [onRequestSetPin]);

  const handleStartBattle = useCallback(async () => {
    if (!battleName.trim()) {
      setShowNameWarning(true);
      triggerShake();
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setShowNameWarning(false);

    if (!pinSet) {
      setShowPinWarning(true);
      triggerShake();
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setShowPinWarning(false);

    if (!selectedOpponent) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const name = battleName.trim();

    await sendInvite({
      toUserId: selectedOpponent.id,
      battleName: name,
      rounds: selectedRounds,
      shotsPerRound: selectedShots,
      toUsername: selectedOpponent.username,
      toDisplayName: selectedOpponent.display_name,
      toAvatarUrl: selectedOpponent.avatar_url,
    });

    await startBattleDirectly({
      battleName: name,
      opponentId: selectedOpponent.id,
      opponentUsername: selectedOpponent.username,
      opponentDisplayName: selectedOpponent.display_name,
      opponentAvatarUrl: selectedOpponent.avatar_url,
      rounds: selectedRounds,
      shotsPerRound: selectedShots,
    });

    console.log('[BattleScreen] Battle started, navigating to drill screen');
    onBattleStart?.();
  }, [selectedOpponent, battleName, selectedRounds, selectedShots, sendInvite, startBattleDirectly, onBattleStart, pinSet, triggerShake]);

  const renderFriendItem = useCallback(({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={pickerStyles.friendItem}
      onPress={() => handleSelectOpponent(item)}
      activeOpacity={0.7}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={pickerStyles.avatar} />
      ) : (
        <View style={pickerStyles.avatarPlaceholder}>
          <User size={18} color="rgba(0,0,0,0.4)" />
        </View>
      )}
      <View style={pickerStyles.friendInfo}>
        <Text style={pickerStyles.friendName}>{item.display_name}</Text>
        <Text style={pickerStyles.friendUsername}>@{item.username}</Text>
      </View>
      <View style={pickerStyles.selectCircle}>
        <Plus size={16} color="#C0392B" />
      </View>
    </TouchableOpacity>
  ), [handleSelectOpponent]);

  const canStart = !!selectedOpponent && battleName.trim().length > 0 && pinSet;

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backCircle}>
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Battle</Text>
          <View style={styles.headerSpacer} />
        </View>

        {(showNameWarning || showPinWarning) && (
          <Animated.View style={[styles.warningBanner, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.warningText}>
              {showNameWarning ? 'Please name your battle!' : 'Set Pin before starting Battle!'}
            </Text>
          </Animated.View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleRow}>
            <View style={styles.titleTextBlock}>
              <Text style={styles.pageTitle}>Battle Settings</Text>
              <Text style={styles.pageSubtitle}>Set up a head-to-head challenge</Text>
            </View>
            <TouchableOpacity
              style={[styles.setPinButton, pinSet && styles.setPinButtonActive]}
              activeOpacity={0.7}
              onPress={handleSetPin}
            >
              <Flag size={16} color="#FFFFFF" />
              <Text style={styles.setPinText}>{pinSet ? 'Pin Set' : 'Set Pin'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <View style={styles.nameInputBlock}>
              <Text style={styles.sectionLabel}>BATTLE NAME *</Text>
              <View style={[styles.inputWrapper, showNameWarning && !battleName.trim() && styles.inputWrapperError]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Iron Showdown"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={battleName}
                  onChangeText={(text) => {
                    setBattleName(text);
                    if (text.trim()) setShowNameWarning(false);
                  }}
                  returnKeyType="done"
                />
              </View>
            </View>
            <View style={styles.challengerBlock}>
              <Text style={styles.sectionLabel}>CHALLENGER</Text>
              {selectedOpponent ? (
                <TouchableOpacity
                  style={styles.selectedChallengerBtn}
                  onPress={() => setShowFriendPicker(true)}
                  activeOpacity={0.7}
                >
                  {selectedOpponent.avatar_url ? (
                    <Image source={{ uri: selectedOpponent.avatar_url }} style={styles.selectedAvatar} />
                  ) : (
                    <View style={styles.selectedAvatarPlaceholder}>
                      <User size={14} color="#FFF" />
                    </View>
                  )}
                  <Text style={styles.selectedName} numberOfLines={1}>
                    {selectedOpponent.display_name}
                  </Text>
                  <Check size={14} color="#2E7D32" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addChallengerBtn}
                  onPress={() => setShowFriendPicker(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color="#C0392B" />
                  <Text style={styles.addChallengerText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.sectionLabel}>ROUNDS</Text>
          <View style={styles.optionRow}>
            {ROUNDS_OPTIONS.map((val) => {
              const isSelected = selectedRounds === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionChip, isSelected && styles.optionChipSelectedRed]}
                  onPress={() => setSelectedRounds(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>TOTAL SHOTS</Text>
          <View style={styles.optionRow}>
            {SHOTS_OPTIONS.map((val) => {
              const isSelected = selectedShots === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionChip, isSelected && styles.optionChipSelectedRed]}
                  onPress={() => setSelectedShots(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryInner}>
                <Text style={styles.summaryLabel}>SUMMARY</Text>
                <Text style={styles.summaryText}>
                  {selectedRounds} rounds x {selectedShots} shots = {totalShots} total shots per player
                </Text>
                {selectedOpponent && (
                  <Text style={styles.summaryOpponent}>
                    vs {selectedOpponent.display_name}
                  </Text>
                )}
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, pinSet ? styles.statusGreen : styles.statusRed]} />
                  <Text style={styles.statusText}>{pinSet ? 'Pin set' : 'Pin required'}</Text>
                  <View style={[styles.statusDot, battleName.trim() ? styles.statusGreen : styles.statusRed]} />
                  <Text style={styles.statusText}>{battleName.trim() ? 'Named' : 'Name required'}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity
            onPress={handleStartBattle}
            activeOpacity={0.8}
            disabled={!selectedOpponent}
            style={{ opacity: selectedOpponent ? 1 : 0.45 }}
          >
            <View style={styles.startButtonOuter}>
              <LinearGradient
                colors={canStart ? ['#C0392B', '#A93226'] : ['rgba(192,57,43,0.5)', 'rgba(169,50,38,0.5)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Start Battle</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showFriendPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFriendPicker(false)}
      >
        <View style={pickerStyles.overlay}>
          <View style={[pickerStyles.container, { paddingTop: insets.top + 12 }]}>
            <View style={pickerStyles.header}>
              <Text style={pickerStyles.title}>Select Challenger</Text>
              <TouchableOpacity onPress={() => setShowFriendPicker(false)} activeOpacity={0.7}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={pickerStyles.searchBar}>
              <Search size={16} color="rgba(0,0,0,0.4)" />
              <TextInput
                style={pickerStyles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="rgba(0,0,0,0.35)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {following.length > 0 && (
              <Text style={pickerStyles.sectionLabel}>FRIENDS & FOLLOWING</Text>
            )}
            {following.length === 0 && (
              <Text style={pickerStyles.sectionLabel}>ALL USERS</Text>
            )}

            {isLoadingAllUsers ? (
              <View style={pickerStyles.loadingWrap}>
                <ActivityIndicator size="large" color="#0059B2" />
                <Text style={pickerStyles.loadingText}>Loading users...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredFriends}
                keyExtractor={(item) => item.id}
                renderItem={renderFriendItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={pickerStyles.listContent}
                ListEmptyComponent={
                  <View style={pickerStyles.emptyWrap}>
                    <User size={32} color="rgba(0,0,0,0.2)" />
                    <Text style={pickerStyles.emptyText}>No users found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginTop: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    padding: 0,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 10,
  },
  friendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  friendUsername: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
    marginTop: 1,
  },
  selectCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#C0392B',
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingWrap: {
    paddingTop: 40,
    alignItems: 'center' as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  emptyWrap: {
    paddingTop: 40,
    alignItems: 'center' as const,
    gap: 10,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.4)',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {},
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 38,
  },
  warningBanner: {
    backgroundColor: 'rgba(255,243,205,0.9)',
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#856404',
    textAlign: 'center' as const,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  titleTextBlock: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  setPinButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  setPinButtonActive: {
    backgroundColor: '#1B5E20',
  },
  setPinText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 8,
  },
  nameInputBlock: {
    flex: 1,
  },
  challengerBlock: {
    width: 130,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 24,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  inputWrapperError: {
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addChallengerBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    gap: 6,
    borderWidth: 2,
    borderColor: '#C0392B',
    borderStyle: 'dashed' as const,
  },
  addChallengerText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#C0392B',
  },
  selectedChallengerBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  selectedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectedAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectedName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  optionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    minWidth: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionChipSelectedRed: {
    backgroundColor: '#C0392B',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginTop: 28,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  summaryGradient: {
    borderRadius: 16,
  },
  summaryInner: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 15,
    padding: 18,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  summaryOpponent: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 12,
    flexWrap: 'wrap' as const,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusGreen: {
    backgroundColor: '#22C55E',
  },
  statusRed: {
    backgroundColor: '#FF5252',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    marginRight: 8,
  },
  startButtonOuter: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  startButton: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
  },
});
