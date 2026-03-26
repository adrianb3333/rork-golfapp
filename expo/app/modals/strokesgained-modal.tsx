import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSensor } from '@/contexts/SensorContext';
import SensorLockOverlay from '@/components/SensorLockOverlay';

type Segment = 'approach' | 'around';

interface BarData {
  label: string;
  value: number;
}

const APPROACH_DATA: BarData[] = [
  { label: "40 M", value: 0.3 },
  { label: "50 M", value: -0.1 },
  { label: "60 M", value: 0.5 },
  { label: "70 M", value: -0.4 },
  { label: "80 M", value: 0.2 },
  { label: "90 M", value: -0.6 },
  { label: "100 M", value: 0.1 },
  { label: "110 M", value: -0.3 },
  { label: "120 M", value: -0.2 },
];

const AROUND_DATA: BarData[] = [
  { label: "30 M", value: -0.2 },
  { label: "25 M", value: 0.4 },
  { label: "20 M", value: -0.5 },
  { label: "15 M", value: 0.1 },
  { label: "10 M", value: 0.6 },
  { label: "5 M", value: -0.1 },
  { label: "Edge", value: 0.3 },
];

function getBest(data: BarData[]): BarData {
  return data.reduce((best, d) => d.value > best.value ? d : best, data[0]);
}

function getWorst(data: BarData[]): BarData {
  return data.reduce((worst, d) => d.value < worst.value ? d : worst, data[0]);
}

function getMaxAbsValue(data: BarData[]): number {
  return Math.max(...data.map(d => Math.abs(d.value)), 0.1);
}

export default function StrokesGainedModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('approach');
  const { isPaired } = useSensor();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };

  const data = segment === 'approach' ? APPROACH_DATA : AROUND_DATA;
  const best = getBest(data);
  const worst = getWorst(data);
  const maxAbs = getMaxAbsValue(data);

  return (
    <View style={styles.background}>
      <StatusBar style="light" />
      {!isPaired && <SensorLockOverlay />}
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.backButton}>
            <ArrowLeft size={22} color="#F5F7F6" />
          </Pressable>
          <Text style={styles.headerTitle}>Strokes Gained</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.barsContainer}>
            {data.map((item, index) => {
              const isPositive = item.value >= 0;
              const barColor = isPositive ? '#22C55E' : '#EF4444';
              const barWidth = (Math.abs(item.value) / maxAbs) * 100;

              return (
                <View key={`${segment}-${index}`} style={styles.barRow}>
                  <Text style={styles.barLabel}>{item.label}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: barColor,
                          width: `${Math.max(barWidth, 8)}%`,
                          borderRadius: 6,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barValue, { color: barColor }]}>
                    {isPositive ? '+' : ''}{item.value.toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Best SG</Text>
              <Text style={styles.summaryDistance}>{best.label}</Text>
              <Text style={[styles.summaryValue, { color: '#22C55E' }]}>
                +{best.value.toFixed(1)}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Worst SG</Text>
              <Text style={styles.summaryDistance}>{worst.label}</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                {worst.value.toFixed(1)}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.segmentContainer}>
          <View style={styles.segmentControl}>
            <Pressable
              style={[styles.segmentButton, segment === 'around' && styles.segmentButtonActive]}
              onPress={() => setSegment('around')}
            >
              <Text style={[styles.segmentText, segment === 'around' && styles.segmentTextActive]}>
                Around the Green
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentButton, segment === 'approach' && styles.segmentButtonActive]}
              onPress={() => setSegment('approach')}
            >
              <Text style={[styles.segmentText, segment === 'approach' && styles.segmentTextActive]}>
                Approach the Green
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  headerSpacer: { width: 36 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  barsContainer: {
    gap: 10,
    marginTop: 8,
  },
  barRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 38,
    gap: 10,
  },
  barLabel: {
    width: 50,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#AAAAAA',
    textAlign: 'left' as const,
  },
  barTrack: {
    flex: 1,
    height: 28,
    backgroundColor: '#111111',
    borderRadius: 6,
    overflow: 'hidden' as const,
    justifyContent: 'center' as const,
  },
  barFill: {
    height: '100%' as const,
  },
  barValue: {
    width: 44,
    fontSize: 13,
    fontWeight: '700' as const,
    textAlign: 'right' as const,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 28,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center' as const,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666666',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  summaryDistance: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#000000',
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#222222',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666666',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
});
