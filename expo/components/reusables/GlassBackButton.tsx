import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface GlassBackButtonProps {
  onPress: () => void;
  size?: number;
  iconSize?: number;
}

export default function GlassBackButton({ onPress, size = 44, iconSize = 24 }: GlassBackButtonProps) {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
      activeOpacity={0.7}
    >
      <ChevronLeft size={iconSize} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
