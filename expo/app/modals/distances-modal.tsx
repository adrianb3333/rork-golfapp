import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

interface DistanceData {
  label: string;
  strokesGained: number;
  mostUsedClub: string;
  bestClub: string;
}

const DISTANCES_DATA: DistanceData[] = [
  { label: "Edge", strokesGained: 0.3, mostUsedClub: "SW", bestClub: "LW" },
  { label: "10 M", strokesGained: -0.1, mostUsedClub: "SW", bestClub: "SW" },
  { label: "20 M", strokesGained: 0.4, mostUsedClub: "SW", bestClub: "GW" },
  { label: "30 M", strokesGained: -0.5, mostUsedClub: "GW", bestClub: "SW" },
  { label: "40 M", strokesGained: 0.2, mostUsedClub: "GW", bestClub: "GW" },
  { label: "50 M", strokesGained: -0.3, mostUsedClub: "PW", bestClub: "GW" },
  { label: "60 M", strokesGained: 0.5, mostUsedClub: "PW", bestClub: "PW" },
  { label: "70 M", strokesGained: -0.4, mostUsedClub: "9i", bestClub: "PW" },
  { label: "80 M", strokesGained: 0.1, mostUsedClub: "9i", bestClub: "9i" },
  { label: "90 M", strokesGained: -0.6, mostUsedClub: "8i", bestClub: "9i" },
  { label: "100 M", strokesGained: 0.3, mostUsedClub: "8i", bestClub: "8i" },
  { label: "110 M", strokesGained: -0.2, mostUsedClub: "7i", bestClub: "7i" },
  { label: "120 M", strokesGained: 0.6, mostUsedClub: "7i", bestClub: "6i" },
];

function getBest(data: DistanceData[]): DistanceData {
  return data.reduce((best, d) => d.strokesGained > best.strokesGained ? d : best, data[0]);
}

function getWorst(data: DistanceData[]): DistanceData {
  return data.reduce((worst, d) => d.strokesGained < worst.strokesGained ? d : worst, data[0]);
}

function getMaxAbsValue(data: DistanceData[]): number {
  return Math.max(...data.map(d => Math.abs(d.strokesGained)), 0.1);
}

export default function DistancesModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };

  const best = getBest(DISTANCES_DATA);
  const worst = getWorst(DISTANCES_DATA);
  const maxAbs = getMaxAbsValue(DISTANCES_DATA);

  return (
    <View style={styles.background}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.backButton}>
            <ArrowLeft size={22} color="#F5F7F6" />
          </Pressable>
          <Text style={styles.headerTitle}>Distances</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.columnHeaders}>
            <Text style={styles.colHeaderDistance}>Dist.</Text>
            <Text style={styles.colHeaderBar}>SG</Text>
            <Text style={styles.colHeaderClub}>Used / Best</Text>
          </View>

          <View style={styles.barsContainer}>
            {DISTANCES_DATA.map((item, index) => {
              const isPositive = item.strokesGained >= 0;
              const barColor = isPositive ? '#22C55E' : '#EF4444';
              const barWidth = (Math.abs(item.strokesGained) / maxAbs) * 100;

              return (
                <View key={index} style={styles.barRow}>
                  <Text style={styles.barLabel}>{item.label}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: barColor,
                          width: `${Math.max(barWidth, 8)}%`,
                          borderRadius: 5,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barValue, { color: barColor }]}>
                    {isPositive ? '+' : ''}{item.strokesGained.toFixed(1)}
                  </Text>
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubUsed}>{item.mostUsedClub}</Text>
                    <Text style={styles.clubDivider}>/</Text>
                    <Text style={styles.clubBest}>{item.bestClub}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Best SG</Text>
              <Text style={styles.summaryDistance}>{best.label}</Text>
              <Text style={[styles.summaryValue, { color: '#22C55E' }]}>
                +{best.strokesGained.toFixed(1)}
              </Text>
              <Text style={styles.summaryClub}>{best.bestClub}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Worst SG</Text>
              <Text style={styles.summaryDistance}>{worst.label}</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                {worst.strokesGained.toFixed(1)}
              </Text>
              <Text style={styles.summaryClub}>{worst.mostUsedClub}</Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#888' }]} />
              <Text style={styles.legendText}>Most Used Club</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendText}>Best Performing Club</Text>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: { padding: 16, paddingBottom: 80 },
  columnHeaders: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  colHeaderDistance: {
    width: 46,
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#555555',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  colHeaderBar: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#555555',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  colHeaderClub: {
    width: 72,
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#555555',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    textAlign: 'right' as const,
  },
  barsContainer: {
    gap: 6,
    marginTop: 6,
  },
  barRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 34,
    gap: 6,
  },
  barLabel: {
    width: 46,
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#AAAAAA',
    textAlign: 'left' as const,
  },
  barTrack: {
    flex: 1,
    height: 24,
    backgroundColor: '#111111',
    borderRadius: 5,
    overflow: 'hidden' as const,
    justifyContent: 'center' as const,
  },
  barFill: {
    height: '100%' as const,
  },
  barValue: {
    width: 36,
    fontSize: 12,
    fontWeight: '700' as const,
    textAlign: 'right' as const,
  },
  clubInfo: {
    width: 62,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    gap: 3,
  },
  clubUsed: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#888888',
  },
  clubDivider: {
    fontSize: 11,
    color: '#444444',
  },
  clubBest: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#22C55E',
  },
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
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
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#666666',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  summaryDistance: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginTop: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  summaryClub: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#888888',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 20,
    marginTop: 18,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500' as const,
  },
});
