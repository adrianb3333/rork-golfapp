import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface Props {
  value: string;
  onChange: (text: string) => void;
  label?: string;
}

export default function DistanceInput({ value, onChange, label = "Distance to target" }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.rubric}>{label}</Text>
      
      <BlurView intensity={20} tint="dark" style={styles.glassInputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          keyboardType="numeric"
          returnKeyType="done"
          maxLength={3}
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  rubric: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  glassInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  input: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'right', // Aligns numbers to the right as seen in your image
    padding: 0,
  },
});
