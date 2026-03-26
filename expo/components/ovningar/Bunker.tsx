import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '@/lib/supabase';

const TOTAL_MAX_SHOTS = 10;
const SIZE = 100;
const STROKE_WIDTH = 8;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const COLORS = {
  sand: '#f2cc8f',
  white: '#ffffff',
  bg: '#000',
  border: '#1a1a1a',
  textDim: 'rgba(255,255,255,0.4)',
};

export default function BunkerDrill({ onBack, drillName = "Bunker Pro" }: { onBack: () => void, drillName?: string }) {
  const [isStarted, setIsStarted] = useState(false);
  const [round, setRound] = useState(1);
  // Indices represent [1m, 3m, 5m+]
  const [counts, setCounts] = useState([0, 0, 0]);
  const headers = ['1 Meter', '3 Meter', '5 Meter+'];

  const totalMade = counts.reduce((a, b) => a + b, 0);
  const remaining = TOTAL_MAX_SHOTS - totalMade;

  const saveToSupabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Inserting 3 separate entries for the granular data
      const entries = headers.map((header, index) => ({
        user_id: user.id,
        drill_name: `${drillName} - ${header}`,
        score: counts[index],
      }));

      await supabase.from('golf_drills').insert(entries);
      
      if (round < 3) {
        setRound(round + 1);
        setCounts([0, 0, 0]);
      } else {
        onBack(); // End session after 3 rounds
      }
    } catch (err) {
      console.error("Error saving bunker drill:", err);
    }
  };

  const updateCount = (index: number, val: number) => {
    const newCounts = [...counts];
    const diff = val - newCounts[index];
    if (totalMade + diff <= TOTAL_MAX_SHOTS && val >= 0) {
      newCounts[index] = val;
      setCounts(newCounts);
    }
  };

  if (!isStarted) {
    return (
      <View style={styles.startOverlay}>
        <Text style={styles.title}>Bunker Drill</Text>
        <Text style={styles.subtitle}>10 Total Balls per Round</Text>
        <Pressable onPress={() => setIsStarted(true)} style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Round {round}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack}><Text style={styles.backLink}>← Exit</Text></Pressable>
          <Text style={styles.roundLabel}>ROUND {round} / 3</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.svgContainer}>
            <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle stroke="#1a1a1a" fill="none" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE_WIDTH} />
              <Circle 
                stroke={COLORS.sand} fill="none" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} 
                strokeWidth={STROKE_WIDTH} strokeDasharray={CIRCUMFERENCE} 
                strokeDashoffset={CIRCUMFERENCE * (1 - totalMade / TOTAL_MAX_SHOTS)} 
                strokeLinecap="round" 
              />
            </Svg>
            <View style={styles.absoluteCenter}>
              <Text style={styles.centerNum}>{totalMade}</Text>
              <Text style={styles.centerSub}>/ 10</Text>
            </View>
          </View>
          <Text style={styles.instruction}>Distribute 10 makes across distances</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {headers.map((header, hIndex) => (
            <View key={hIndex} style={styles.drillSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{header}</Text>
                <Text style={styles.sectionCount}>{counts[hIndex]} Made</Text>
              </View>
              
              <View style={styles.grid}>
                {Array(10).fill(0).map((_, i) => {
                  const isActive = i < counts[hIndex];
                  const isLocked = !isActive && remaining === 0;

                  return (
                    <Pressable 
                      key={i} 
                      disabled={isLocked}
                      onPress={() => updateCount(hIndex, i + 1)}
                      style={[
                        styles.box, 
                        isActive && styles.boxFilled, 
                        isLocked && { opacity: 0.1 }
                      ]} 
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable 
            onPress={saveToSupabase} 
            disabled={totalMade === 0}
            style={[styles.nextButton, totalMade === 0 && { opacity: 0.3 }]}
          >
            <Text style={styles.nextText}>{round === 3 ? 'Complete Session' : 'Next Round'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, paddingHorizontal: 24 },
  startOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: COLORS.textDim, fontSize: 16, marginBottom: 40 },
  startButton: { borderWidth: 1, borderColor: COLORS.sand, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
  startButtonText: { color: COLORS.sand, fontSize: 18, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  backLink: { color: COLORS.textDim, fontSize: 14 },
  roundLabel: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  progressSection: { alignItems: 'center', marginVertical: 30 },
  svgContainer: { width: SIZE, height: SIZE, justifyContent: 'center', alignItems: 'center' },
  absoluteCenter: { position: 'absolute', alignItems: 'center' },
  centerNum: { color: '#fff', fontSize: 24, fontWeight: '800' },
  centerSub: { color: COLORS.textDim, fontSize: 10, fontWeight: '700' },
  instruction: { color: COLORS.textDim, fontSize: 12, marginTop: 15, fontWeight: '500' },
  scrollContent: { paddingBottom: 100 },
  drillSection: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionCount: { color: COLORS.sand, fontSize: 14, fontWeight: '600' },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    gap: 8
  },
  box: {
    width: '17.5%', // Calculated for 5 horizontal with gap
    aspectRatio: 1,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  boxFilled: {
    backgroundColor: COLORS.sand,
    borderColor: COLORS.sand,
  },
  footer: { position: 'absolute', bottom: 30, left: 24, right: 24 },
  nextButton: { backgroundColor: '#fff', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextText: { color: '#000', fontWeight: '800', fontSize: 16, textTransform: 'uppercase' },
});
