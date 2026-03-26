import React, { useCallback } from "react";
import { StyleSheet, Text, ImageBackground, ScrollView, Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Plus } from "lucide-react-native"; 
import FocusInput from '@/components/FocusInput'; 
import { useUserData, FocusData } from "@/hooks/useUserData";

export default function GeneralModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };
  const { userData, updateGeneral } = useUserData();

  const focuses = userData.general.focuses;

  const handleSave = useCallback((id: number, name: string, content: string) => {
    const updated = focuses.map(f => (f.id === id ? { ...f, name, content } : f));
    updateGeneral(updated);
  }, [focuses, updateGeneral]);

  const handleAddNew = useCallback(() => {
    const newFocus: FocusData = { id: Date.now(), name: 'My Focus', content: '' };
    updateGeneral([...focuses, newFocus]);
  }, [focuses, updateGeneral]);

  const handleDelete = useCallback((id: number) => {
    const filtered = focuses.filter(f => f.id !== id);
    updateGeneral(filtered);
  }, [focuses, updateGeneral]);

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2og1gfzbpfgrdjyzujhyg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <Pressable onPress={handleClose} style={styles.floatingCloseButton}>
          <X size={28} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {focuses.length === 0 && (
            <TouchableOpacity 
              style={styles.emptyAddButton} 
              onPress={handleAddNew}
            >
              <Plus size={32} color="#FFD700" />
              <Text style={styles.emptyAddText}>Add Focus</Text>
            </TouchableOpacity>
          )}

          {focuses.map(focus => (
            <FocusInput
              key={focus.id}
              initialName={focus.name}
              initialContent={focus.content}
              onSave={(name, content) => handleSave(focus.id, name, content)}
              onAddNew={handleAddNew}
              onDelete={() => handleDelete(focus.id)} 
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#020d12' },
  container: { flex: 1 },
  floatingCloseButton: { 
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  scrollContent: { 
    padding: 16, 
    paddingTop: 60,
    gap: 16 
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyAddText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
});
