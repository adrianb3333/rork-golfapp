import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import {
  Minus,
  CircleIcon,
  Triangle,
  Pencil,
  Undo2,
  Trash2,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSwingStore } from '@/store/swingStore';
import { DrawingTool } from '@/Types';

const TOOLS: { id: DrawingTool; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'line', label: 'Line', icon: Minus, color: Colors.toolLine },
  { id: 'circle', label: 'Circle', icon: CircleIcon, color: Colors.toolCircle },
  { id: 'angle', label: 'Angle', icon: Triangle, color: Colors.toolAngle },
  { id: 'freehand', label: 'Draw', icon: Pencil, color: Colors.toolFreehand },
];

export default function DrawingToolbar() {
  const {
    currentTool,
    setCurrentTool,
    setCurrentColor,
    undoDrawing,
    clearDrawings,
    drawings = [],
  } = useSwingStore();

  const selectTool = useCallback(
    (tool: DrawingTool, color: string) => {
      if (currentTool === tool) {
        setCurrentTool('none');
      } else {
        setCurrentTool(tool);
        setCurrentColor(color);
      }
    },
    [currentTool, setCurrentTool, setCurrentColor]
  );

  const isActive = currentTool !== 'none';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TOOLS.map((tool) => {
          const selected = currentTool === tool.id;
          const Icon = tool.icon;
          return (
            <Pressable
              key={tool.id}
              style={({ pressed }) => [
                styles.toolButton,
                selected && { backgroundColor: tool.color + '20', borderColor: tool.color },
                pressed && styles.pressed,
              ]}
              onPress={() => selectTool(tool.id, tool.color)}
              testID={`tool-${tool.id}`}
            >
              <Icon
                size={18}
                color={selected ? tool.color : Colors.textSecondary}
                strokeWidth={selected ? 2.5 : 1.5}
              />
              <Text
                style={[
                  styles.toolLabel,
                  selected && { color: tool.color },
                ]}
              >
                {tool.label}
              </Text>
            </Pressable>
          );
        })}

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
            drawings.length === 0 && styles.disabled,
          ]}
          onPress={undoDrawing}
          disabled={drawings.length === 0}
          testID="undo-button"
        >
          <Undo2 size={18} color={drawings.length > 0 ? Colors.textPrimary : Colors.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
            drawings.length === 0 && styles.disabled,
          ]}
          onPress={clearDrawings}
          disabled={drawings.length === 0}
          testID="clear-button"
        >
          <Trash2 size={18} color={drawings.length > 0 ? Colors.error : Colors.textMuted} />
        </Pressable>

        {isActive && (
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            onPress={() => setCurrentTool('none')}
          >
            <X size={16} color={Colors.textPrimary} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scrollContent: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  toolButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
