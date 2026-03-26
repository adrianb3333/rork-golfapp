import React, { useCallback, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUserData } from "@/hooks/useUserData";

const SECTIONS = [
  { id: 'offTheTee', label: 'Off the Tee' },
  { id: 'approachTheGreen', label: 'Approach the Green' },
  { id: 'aroundTheGreen', label: 'Around the Green' },
  { id: 'putting', label: 'Putting' },
];

export default function GolfIQModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };
  const { userData, updateGolfIQ } = useUserData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const golfIQNotes = userData.golfIQ;

  const handleNoteChange = useCallback((key: string, value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateGolfIQ(key, value);
    }, 500);
  }, [updateGolfIQ]);

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={28} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Golf IQ</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>Manage Yourself On The Course</Text>

          {SECTIONS.map((section) => (
            <View key={section.id} style={styles.inputCard}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <TextInput
                style={styles.inputBox}
                placeholder={`Your ${section.label.toLowerCase()} strategy...`}
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                textAlignVertical="top"
                defaultValue={golfIQNotes[section.id] || ''}
                onChangeText={(text) => handleNoteChange(section.id, text)}
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
    fontSize: 22,
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
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#7CFC7C',
    marginBottom: 12,
  },
  inputBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
