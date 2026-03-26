import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface Props {
  label: string;
  initialValue?: string;
  onChangeText?: (text: string) => void;
}

export default function LogicCard({ label, initialValue = '', onChangeText }: Props) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (text: string) => {
    setValue(text);
    if (onChangeText) onChangeText(text);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <BlurView intensity={15} tint="dark" style={styles.card}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder="Type here..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
        />
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 24,
    width: '100%',
  },
});
