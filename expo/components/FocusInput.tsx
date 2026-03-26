import React, { useState } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Plus, Trash2 } from "lucide-react-native";

interface FocusInputProps {
  initialName: string;
  initialContent: string;
  onSave: (name: string, content: string) => void;
  onAddNew: () => void;
  onDelete: () => void;
}

export default function FocusInput({
  initialName,
  initialContent,
  onSave,
  onAddNew,
  onDelete,
}: FocusInputProps) {
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(initialContent);

  const handleNameChange = (text: string) => {
    setName(text);
    onSave(text, content);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    onSave(name, text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Focus Name"
          placeholderTextColor="#6B7280"
        />
        <View style={styles.actions}>
          <TouchableOpacity onPress={onAddNew} style={styles.actionButton}>
            <Plus size={20} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={styles.contentInput}
        value={content}
        onChangeText={handleContentChange}
        placeholder="Focus content..."
        placeholderTextColor="#6B7280"
        multiline
        numberOfLines={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  contentInput: {
    fontSize: 16,
    color: '#D1D5DB',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
