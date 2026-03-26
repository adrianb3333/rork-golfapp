import React, { useCallback, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUserData } from "@/hooks/useUserData";

export default function ClubModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };
  const { userData, updateClubNotes } = useUserData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mentalNotes = userData.clubNotes['mentalThinking'] || { point1: '', point2: '', point3: '' };

  const handleNoteChange = useCallback((pointKey: 'point1' | 'point2' | 'point3', value: string) => {
    const currentNotes = userData.clubNotes['mentalThinking'] || { point1: '', point2: '', point3: '' };
    const newNotes = { ...currentNotes, [pointKey]: value };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateClubNotes('mentalThinking', newNotes);
    }, 500);
  }, [userData.clubNotes, updateClubNotes]);

  const inputs: { label: string; key: 'point1' | 'point2' | 'point3' }[] = [
    { label: '1', key: 'point1' },
    { label: '2', key: 'point2' },
    { label: '3', key: 'point3' },
  ];

  return (
    <View style={styles.background}>
      <StatusBar hidden />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={28} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Mental Thinking & Strategies</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>Write down your mental strategies and key thoughts</Text>

          {inputs.map((input) => (
            <View key={input.key} style={styles.inputCard}>
              <Text style={styles.inputLabel}>{input.label}:</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="Write your thoughts..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                textAlignVertical="top"
                defaultValue={mentalNotes[input.key]}
                onChangeText={(text) => handleNoteChange(input.key, text)}
              />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginRight: 44,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    marginBottom: 30,
  },
  inputCard: {
    backgroundColor: '#151515',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#7CFC7C',
    marginBottom: 10,
  },
  inputBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
