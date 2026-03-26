import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Circle, Layers } from 'lucide-react-native';
import type { CustomDrill } from './CreateDrillScreen';
import type { CustomSession } from './CreateSessionScreen';

export interface ScheduledItem {
  id: string;
  type: 'drill' | 'session';
  itemId: string;
  itemName: string;
  days: string[];
  createdAt: number;
}

interface CreateScheduleScreenProps {
  onBack: () => void;
  onSave: (item: ScheduledItem) => void;
  drills: CustomDrill[];
  sessions: CustomSession[];
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CreateScheduleScreen({ onBack, onSave, drills, sessions }: CreateScheduleScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [type, setType] = useState<'drill' | 'session'>('drill');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const items = type === 'drill' ? drills : sessions;

  const handleSave = () => {
    if (selectedDays.length === 0 || !selectedItemId) return;
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;
    const scheduled: ScheduledItem = {
      id: Date.now().toString(),
      type,
      itemId: selectedItemId,
      itemName: item.name,
      days: selectedDays,
      createdAt: Date.now(),
    };
    onSave(scheduled);
  };

  const canSave = selectedDays.length > 0 && selectedItemId !== null;

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
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
        <Text style={styles.headerTitle}>Create Schedule</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>DAY OF THE WEEK</Text>
        <View style={styles.daysRow}>
          {DAYS.map((day) => {
            const isSelected = selectedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                onPress={() => toggleDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>TYPE</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'drill' && styles.typeButtonActive]}
            onPress={() => { setType('drill'); setSelectedItemId(null); }}
            activeOpacity={0.7}
          >
            <Circle
              size={16}
              color={type === 'drill' ? '#FFFFFF' : '#333'}
              fill={type === 'drill' ? '#FFFFFF' : 'transparent'}
              strokeWidth={2}
            />
            <Text style={[styles.typeText, type === 'drill' && styles.typeTextActive]}>
              Drill
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'session' && styles.typeButtonActive]}
            onPress={() => { setType('session'); setSelectedItemId(null); }}
            activeOpacity={0.7}
          >
            <Layers
              size={16}
              color={type === 'session' ? '#FFFFFF' : '#333'}
              strokeWidth={2}
            />
            <Text style={[styles.typeText, type === 'session' && styles.typeTextActive]}>
              Session
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>
          SELECT {type === 'drill' ? 'DRILL' : 'SESSION'}
        </Text>

        {items.length === 0 ? (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>
              No {type === 'drill' ? 'drills' : 'sessions'} created yet.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const isSelected = selectedItemId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                activeOpacity={0.7}
                onPress={() => setSelectedItemId(item.id)}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
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
              <Text style={styles.saveButtonText}>Schedule</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  daysRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  dayChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 54,
    alignItems: 'center' as const,
  },
  dayChipSelected: {
    backgroundColor: '#2E7D32',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#333',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  typeRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  typeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
    gap: 8,
    flex: 1,
    justifyContent: 'center' as const,
  },
  typeButtonActive: {
    backgroundColor: '#2E7D32',
  },
  typeText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#333',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  itemRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 8,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCC',
    backgroundColor: '#F5F5F5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  radioSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F5F5F5',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  emptyItems: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center' as const,
  },
  emptyItemsText: {
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
