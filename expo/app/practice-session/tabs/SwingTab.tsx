import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  Pressable,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Plus, Columns2, Video, Clock, Trash2, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSessions } from '@/store/sessionStore';
import { useSwingStore } from '@/store/swingStore';
import { AnalysisSession } from '@/Types';

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 0) return `Today at ${time}`;
    if (diffDays === 1) return `Yesterday at ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
  } catch {
    return 'Recently';
  }
}

export default function SwingTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { sessions = [], addSession, removeSession } = useSessions();
  const { setVideoUri, setComparisonMode, clearAll } = useSwingStore();

  const pickAndAnalyze = useCallback(async (comparison: boolean) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;
      
      clearAll();
      const uri1 = result.assets[0].uri;
      setVideoUri(uri1, 0);

      let finalUris = [uri1];
      let finalComparisonMode = false;

      if (comparison) {
        const result2 = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: true,
          quality: 1,
        });

        if (!result2.canceled && result2.assets?.[0]) {
          const uri2 = result2.assets[0].uri;
          setVideoUri(uri2, 1);
          finalUris.push(uri2);
          finalComparisonMode = true;
        }
      }

      setComparisonMode(finalComparisonMode);
      addSession(finalUris);

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/modals/vid-modal');
    } catch (err) {
      Alert.alert('Error', 'Failed to pick video.');
    }
  }, [clearAll, setVideoUri, setComparisonMode, addSession, router]);

  const handleOpenSession = useCallback((session: AnalysisSession) => {
    clearAll();
    if (!session?.videoUris?.[0]) {
      Alert.alert('Missing video', 'This session does not have a valid video.');
      return;
    }
    
    setVideoUri(session.videoUris[0], 0);
    if (session.isComparison && session.videoUris[1]) {
      setVideoUri(session.videoUris[1], 1);
      setComparisonMode(true);
    } else {
      setComparisonMode(false);
    }
    router.push('/modals/vid-modal');
  }, [clearAll, setVideoUri, setComparisonMode, router]);

  const renderSession = useCallback(({ item }: { item: AnalysisSession }) => (
    <Pressable
      style={({ pressed }) => [styles.sessionCard, pressed && styles.sessionCardPressed]}
      onPress={() => handleOpenSession(item)}
    >
      <View style={styles.sessionIcon}>
        {item.isComparison ? <Columns2 size={18} color={Colors.accent} /> : <Video size={18} color={Colors.accent} />}
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle}>{item.isComparison ? 'Comparison' : 'Swing Analysis'}</Text>
        <Text style={styles.sessionDate}>{formatSessionDate(item.createdAt)}</Text>
      </View>
      <Pressable onPress={() => removeSession(item.id)} style={styles.deleteBtn}>
        <Trash2 size={14} color={Colors.textMuted} />
      </Pressable>
    </Pressable>
  ), [handleOpenSession, removeSession]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.headerTitle}>Swing Analyzer</Text></View>

      <FlatList
        data={Array.isArray(sessions) ? sessions : []}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.actionsSection}>
            <Pressable style={styles.uploadButton} onPress={() => pickAndAnalyze(false)}>
              <Plus size={24} color="#000" />
              <Text style={styles.uploadTitle}>New Analysis</Text>
            </Pressable>
            <Pressable style={styles.compareButton} onPress={() => pickAndAnalyze(true)}>
              <Columns2 size={22} color={Colors.accent} />
              <Text style={styles.compareTitle}>Compare Swings</Text>
            </Pressable>
            {sessions.length > 0 && <Text style={styles.sectionTitle}>History</Text>}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  actionsSection: { paddingTop: 20, gap: 12 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, borderRadius: 12, padding: 16, gap: 12 },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  compareButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  compareTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 20, textTransform: 'uppercase' },
  sessionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: Colors.border },
  sessionCardPressed: { opacity: 0.7 },
  sessionIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  sessionInfo: { flex: 1, marginLeft: 12 },
  sessionTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sessionDate: { fontSize: 12, color: Colors.textMuted },
  deleteBtn: { padding: 8 },
});