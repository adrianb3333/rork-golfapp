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
import { ArrowLeft, Check } from 'lucide-react-native';
import type { CustomDrill } from './CreateDrillScreen';

export interface CustomSession {
  id: string;
  name: string;
  drillIds: string[];
  createdAt: number;
}

interface CreateSessionScreenProps {
  onBack: () => void;
  onSave: (session: CustomSession) => void;
  drills: CustomDrill[];
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

export default function CreateSessionScreen({ onBack, onSave, drills }: CreateSessionScreenProps) {
  const insets = useSafeAreaInsets();
  const [sessionName, setSessionName] = useState('');
  const [selectedDrillIds, setSelectedDrillIds] = useState<string[]>([]);

  const toggleDrill = (id: string) => {
    setSelectedDrillIds(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!sessionName.trim() || selectedDrillIds.length === 0) return;
    const session: CustomSession = {
      id: Date.now().toString(),
      name: sessionName.trim(),
      drillIds: selectedDrillIds,
      createdAt: Date.now(),
    };
    onSave(session);
  };

  const canSave = sessionName.trim().length > 0 && selectedDrillIds.length > 0;

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
          <Text style={styles.headerTitle}>Create Session</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>SESSION NAME</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Full Practice Round"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={sessionName}
              onChangeText={setSessionName}
              returnKeyType="done"
            />
          </View>

          <Text style={styles.sectionLabel}>
            SELECT DRILLS ({selectedDrillIds.length})
          </Text>

          {drills.length === 0 ? (
            <View style={styles.emptyDrills}>
              <Text style={styles.emptyDrillsText}>
                No drills created yet. Create drills first.
              </Text>
            </View>
          ) : (
            drills.map((drill) => {
              const isSelected = selectedDrillIds.includes(drill.id);
              return (
                <TouchableOpacity
                  key={drill.id}
                  style={styles.drillRow}
                  activeOpacity={0.7}
                  onPress={() => toggleDrill(drill.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <View style={styles.drillInfo}>
                    <Text style={styles.drillName}>{drill.name}</Text>
                    <Text style={styles.drillMeta}>
                      {drill.category} · {drill.rounds}R × {drill.targetsPerRound}T
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.5, marginTop: 28 }}
          >
            <View style={styles.saveButtonOuter}>
              <LinearGradient
                colors={['rgba(0,0,0,0.32)', 'rgba(0,0,0,0.22)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save Session</Text>
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
  drillRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCC',
    backgroundColor: '#F5F5F5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  drillInfo: {
    flex: 1,
    gap: 2,
  },
  drillName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  drillMeta: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(0,0,0,0.45)',
  },
  emptyDrills: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center' as const,
  },
  emptyDrillsText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  saveButtonOuter: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
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
