import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export interface SensorDrill {
  id: string;
  name: string;
  category: string;
  rounds: number;
  targetsPerRound: number;
  totalShots: number;
  isSensorDrill: true;
  createdAt: number;
}

interface CreateSensorDrillScreenProps {
  onBack: () => void;
  onSave: (drill: SensorDrill) => void;
}

const CATEGORIES = [
  { label: 'Putting', color: '#2D6A4F' },
  { label: 'Wedges', color: '#E76F51' },
  { label: 'Irons', color: '#7B2CBF' },
  { label: 'Woods', color: '#40916C' },
];

const ROUNDS_OPTIONS = [1, 2, 3, 4, 5];
const TARGETS_OPTIONS = [5, 7, 10, 12, 15, 20];

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

export default function CreateSensorDrillScreen({ onBack, onSave }: CreateSensorDrillScreenProps) {
  const insets = useSafeAreaInsets();
  const [drillName, setDrillName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Putting');
  const [selectedRounds, setSelectedRounds] = useState(3);
  const [selectedTargets, setSelectedTargets] = useState(10);

  const totalShots = selectedRounds * selectedTargets;

  const handleSave = () => {
    if (!drillName.trim()) return;
    const drill: SensorDrill = {
      id: Date.now().toString(),
      name: drillName.trim(),
      category: selectedCategory,
      rounds: selectedRounds,
      targetsPerRound: selectedTargets,
      totalShots,
      isSensorDrill: true,
      createdAt: Date.now(),
    };
    onSave(drill);
  };

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backCircle}>
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Sensor Drill</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.pageTitle}>New Sensor Drill</Text>
          <Text style={styles.pageSubtitle}>Create a drill using sensor data</Text>

          <Text style={styles.sectionLabel}>DRILL NAME</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Long Putts"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={drillName}
              onChangeText={setDrillName}
              returnKeyType="done"
            />
          </View>

          <Text style={styles.sectionLabel}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat.label)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>ROUNDS</Text>
          <View style={styles.optionRow}>
            {ROUNDS_OPTIONS.map((val) => {
              const isSelected = selectedRounds === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                  onPress={() => setSelectedRounds(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>TARGETS PER ROUND</Text>
          <View style={styles.optionRow}>
            {TARGETS_OPTIONS.map((val) => {
              const isSelected = selectedTargets === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                  onPress={() => setSelectedTargets(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.previewCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewGradient}
            >
              <View style={styles.previewInner}>
                <Text style={styles.previewLabel}>PREVIEW</Text>
                <Text style={styles.previewText}>
                  {selectedRounds} rounds x {selectedTargets} targets = {totalShots} total shots
                </Text>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!drillName.trim()}
            style={{ opacity: drillName.trim() ? 1 : 0.5 }}
          >
            <View style={styles.saveButtonOuter}>
              <LinearGradient
                colors={['#2E7D32', '#1B5E20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save Sensor Drill</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {},
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 24,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: '#1B5E20',
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  chipTextSelected: {
    color: '#1B5E20',
    fontWeight: '700' as const,
  },
  optionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    minWidth: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionChipSelected: {
    backgroundColor: '#2E7D32',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  previewCard: {
    marginTop: 28,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  previewGradient: {
    borderRadius: 16,
  },
  previewInner: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 15,
    padding: 18,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  previewText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  saveButtonOuter: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  saveButton: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
  },
});
