import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useUserData, NotesState, SwingThoughtsData } from "@/hooks/useUserData";

type SectionKey = keyof SwingThoughtsData;

export default function SwingThoughtsModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };
  const { userData, updateSwingThoughts } = useUserData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const swingThoughts = userData.swingThoughts;

  const handleNoteChange = useCallback((sectionKey: SectionKey, pointKey: keyof NotesState, value: string) => {
    const newThoughts = {
      ...swingThoughts,
      [sectionKey]: {
        ...swingThoughts[sectionKey],
        [pointKey]: value,
      },
    };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateSwingThoughts(newThoughts);
    }, 500);
  }, [swingThoughts, updateSwingThoughts]);

  const sections: { title: string; key: SectionKey }[] = [
    { title: 'Driver', key: 'driver' },
    { title: 'Woods', key: 'woods' },
    { title: 'Irons', key: 'irons' },
    { title: 'Wedges', key: 'wedges' },
    { title: 'Chipping', key: 'chipping' },
    { title: 'Bunker', key: 'bunker' },
    { title: 'Putter', key: 'putter' },
  ];

  return (
    <View style={styles.background}>
      <StatusBar hidden={true} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={28} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Swing Thoughts</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <View key={section.key} style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <View style={styles.cardContainer}>
                <View style={styles.noteSection}>
                  <Text style={styles.numberLabel}>1:</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={swingThoughts[section.key].point1}
                    onChangeText={(text) => handleNoteChange(section.key, 'point1', text)}
                    placeholder="Enter your thoughts..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.noteSection}>
                  <Text style={styles.numberLabel}>2:</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={swingThoughts[section.key].point2}
                    onChangeText={(text) => handleNoteChange(section.key, 'point2', text)}
                    placeholder="Enter your thoughts..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.noteSection}>
                  <Text style={styles.numberLabel}>3:</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={swingThoughts[section.key].point3}
                    onChangeText={(text) => handleNoteChange(section.key, 'point3', text)}
                    placeholder="Enter your thoughts..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
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
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'flex-start' as const,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginRight: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#7CFC7C',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  cardContainer: {
    backgroundColor: '#151515',
    borderRadius: 14,
    padding: 18,
  },
  noteSection: {
    marginBottom: 24,
  },
  numberLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
