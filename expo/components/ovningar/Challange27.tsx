// the ui for 27 challange putt drill
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { supabase } from '@/lib/supabase'; // Ensure this path is correct

const TOTAL_PUTTS_PER_ROUND = 9;
const BOXES_PER_ROW = 3;
const SIZE = 140; 
const STROKE_WIDTH = 12; 
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BUTTON_SIZE = 65; 

const COLORS = {
  blue: '#8ecae6', 
  yellow: '#f2cc8f', 
  red: '#e07a5f', 
  bg: '#000000', 
  textDim: 'rgba(255,255,255,0.5)',
};

const LADDER_DISTANCES = ['70cm', '1,2m', '1,7m'];

const getColor = (step: number) => {
  if (step === 0) return COLORS.blue; 
  if (step === 1) return COLORS.yellow; 
  return COLORS.red; 
};

const getGradientColors = (step: number) => {
  if (step === 0) return { start: '#ade8f4', end: COLORS.blue };
  if (step === 1) return { start: '#faedcd', end: COLORS.yellow };
  return { start: '#f4a261', end: COLORS.red };
};

interface LiquidGlassCardProps {
  header: string;
  step: number;
  onNext: (scorePercent: number, madeCount: number) => void;
  onBack: () => void;
  isLast?: boolean;
  roundCount: number;
  historyForStep: { totalMade: number, rounds: number };
}

const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  header,
  step,
  onNext,
  onBack,
  isLast = false,
  roundCount,
  historyForStep,
}) => {
  const [rowScores, setRowScores] = useState<number[]>([0, 0, 0]);
  const [modalVisible, setModalVisible] = useState(false);
  const currentColor = getColor(step);
  const gradColors = getGradientColors(step);

  useEffect(() => {
    setRowScores([0, 0, 0]);
  }, [step]);

  const scaleAnimations = useRef(
    Array(TOTAL_PUTTS_PER_ROUND).fill(0).map(() => new Animated.Value(1))
  ).current;

  const handlePress = (rowIndex: number, boxIndex: number) => {
    const newScores = [...rowScores];
    const clickedValue = boxIndex + 1;

    if (newScores[rowIndex] === clickedValue) {
      newScores[rowIndex] = clickedValue - 1;
    } else {
      newScores[rowIndex] = clickedValue;
    }
    setRowScores(newScores);
  };

  const currentMade = rowScores.reduce((a, b) => a + b, 0);
  const percentage = (currentMade / TOTAL_PUTTS_PER_ROUND) * 100;

  const liveTotalMade = historyForStep.totalMade + currentMade;
  const liveTotalRounds = historyForStep.rounds + 1;
  const avgMade = liveTotalMade / liveTotalRounds;
  const avgPercentage = (avgMade / TOTAL_PUTTS_PER_ROUND) * 100;

  const CircularProgress = ({ percent, colorOverride }: { percent: number, colorOverride?: string }) => {
    const strokeDashoffset = CIRCUMFERENCE * (1 - percent / 100);
    return (
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id={`grad-${step}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradColors.start} />
            <Stop offset="100%" stopColor={gradColors.end} />
          </SvgLinearGradient>
        </Defs>
        <Circle stroke="#1a1a1a" fill="none" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE_WIDTH} />
        <Circle 
            stroke={colorOverride || `url(#grad-${step})`} 
            fill="none" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} 
            strokeWidth={STROKE_WIDTH} strokeDasharray={CIRCUMFERENCE} 
            strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
        />
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.innerContent}>
        <Pressable onPress={onBack} style={styles.internalBackButton}>
          <Text style={styles.internalBackText}>← Quit Drill</Text>
        </Pressable>

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { color: '#fff' }]}>{header}</Text>
          <Pressable onPress={() => setModalVisible(true)} style={[styles.helpButton, { borderColor: currentColor }]}>
            <Text style={[styles.helpText, { color: currentColor }]}>?</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.ladderGrid}>
            {LADDER_DISTANCES.map((distLabel, rowIndex) => (
              <View key={distLabel} style={styles.ladderRow}>
                <Text style={styles.ladderDistanceLabel}>3 Putts: {distLabel}</Text>
                <View style={styles.ladderTrio}>
                  {[0, 1, 2].map((boxIndex) => {
                    const globalIdx = rowIndex * BOXES_PER_ROW + boxIndex;
                    const isChecked = rowScores[rowIndex] > boxIndex;
                    return (
                      <Pressable 
                        key={globalIdx} 
                        onPress={() => handlePress(rowIndex, boxIndex)}
                        onPressIn={() => Animated.spring(scaleAnimations[globalIdx], { toValue: 0.9, useNativeDriver: true }).start()}
                        onPressOut={() => Animated.spring(scaleAnimations[globalIdx], { toValue: 1, useNativeDriver: true }).start()}
                      >
                        <Animated.View style={[
                          styles.button, 
                          { width: BUTTON_SIZE, height: BUTTON_SIZE }, 
                          isChecked && { borderColor: currentColor, backgroundColor: `${currentColor}20`, borderWidth: 2 },
                          { transform: [{ scale: scaleAnimations[globalIdx] }] }
                        ]}>
                          {isChecked ? (
                            <Text style={[styles.checkMark, { color: currentColor }]}>●</Text>
                          ) : (
                            <Text style={styles.buttonNumber}>{boxIndex + 1}</Text>
                          )}
                        </Animated.View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.scoreSummary}>
            <Text style={{ color: COLORS.textDim, fontSize: 16 }}>Made: <Text style={{ color: '#fff', fontWeight: '700' }}>{currentMade}</Text> / 9</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <CircularProgress percent={percentage} />
              <Text style={styles.percentText}>{Math.round(percentage)}%</Text>
              <Text style={styles.statLabel}>Current</Text>
            </View>
            <View style={styles.statBox}>
              <CircularProgress percent={avgPercentage} colorOverride="rgba(255,255,255,0.1)" />
              <Text style={[styles.percentText, { color: COLORS.textDim }]}>{avgMade.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Made</Text>
            </View>
          </View>

          <Pressable 
            onPress={() => onNext(percentage, currentMade)} 
            style={[styles.nextButton, { backgroundColor: currentColor }]}
          >
            <Text style={styles.nextButtonText}>{isLast ? 'Finish Drill' : 'Next Round'}</Text>
          </Pressable>
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
                <Text style={[styles.modalTitle, { color: currentColor }]}>27 Challenge</Text>
                <Text style={styles.modalText}>Complete 3 putts at each distance. Tapping the third box in a row marks all three as successful.</Text>
                <Pressable onPress={() => setModalVisible(false)} style={[styles.modalCloseButton, { backgroundColor: currentColor }]}>
                    <Text style={{ color: '#000', fontWeight: '700' }}>Got it</Text>
                </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const ResultsCard: React.FC<{ scores: number[]; avgs: number[]; onBack: () => void; onRestart: () => void }> = ({ scores, avgs, onBack, onRestart }) => {
  const labels = ['Round 1', 'Round 2', 'Round 3'];
  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.innerContent}>
        <Text style={[styles.headerText, { color: '#fff', marginTop: 40 }]}>Session Summary</Text>
        <View style={{ marginTop: 30 }}>
            {scores.map((score, index) => (
                <View key={index} style={styles.resultRow}>
                    <Text style={styles.scoreLabel}>{labels[index]}</Text>
                    <View style={styles.barContainer}>
                        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: getColor(index) }]} />
                    </View>
                    <Text style={[styles.scorePercent, { color: getColor(index) }]}>{Math.round(score)}%</Text>
                </View>
            ))}
        </View>

        <View style={styles.overallCard}>
            <Text style={styles.overallTitle}>Session Averages (Made)</Text>
            <View style={styles.overallGrid}>
                {avgs.map((avg, i) => (
                    <View key={i} style={{ alignItems: 'center' }}>
                        <Text style={{ color: getColor(i), fontSize: 28, fontWeight: '800' }}>{avg.toFixed(1)}</Text>
                        <Text style={{ color: COLORS.textDim, fontSize: 10 }}>R{i+1}</Text>
                    </View>
                ))}
            </View>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: 30 }}>
          <Pressable onPress={onRestart} style={[styles.actionButton, { backgroundColor: '#fff' }]}>
            <Text style={{ color: '#000', fontWeight: '700' }}>Restart Drill</Text>
          </Pressable>
          <Pressable onPress={onBack} style={[styles.actionButton, { marginTop: 12, borderColor: '#333' }]}>
            <Text style={{ color: '#fff' }}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default function Challenge27({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [history, setHistory] = useState([{ totalMade: 0, rounds: 0 }, { totalMade: 0, rounds: 0 }, { totalMade: 0, rounds: 0 }]);

  // --- FIXED SUPABASE LOGIC ---
  const saveToSupabase = async (finalMade: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('golf_drills')
        .insert([
          { 
            user_id: user.id, 
            drill_name: `27 Challenge - Round ${step + 1}`, 
            score: finalMade 
          }
        ]);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase Save Error:", err);
    }
  };
  // -----------------------------

  if (!isStarted) {
    return (
      <View style={styles.startOverlay}>
        <Pressable onPress={() => setIsStarted(true)} style={styles.startBtn}>
          <Text style={{ color: COLORS.blue, fontSize: 22, fontWeight: '600' }}>Start 27 Challenge</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {step < 3 ? (
        <LiquidGlassCard 
          header={`Round ${step + 1}`} 
          step={step} 
          onNext={(score, made) => {
            const s = [...scores]; s[step] = score; setScores(s);
            const h = [...history]; h[step] = { totalMade: h[step].totalMade + made, rounds: h[step].rounds + 1 }; setHistory(h);
            
            saveToSupabase(made); // Send data to Supabase

            if (step < 2) setStep(step + 1); else setStep(3);
          }} 
          onBack={onBack} 
          isLast={step === 2} 
          roundCount={1}
          historyForStep={history[step]}
        />
      ) : (
        <ResultsCard 
          scores={scores} 
          avgs={history.map(h => h.rounds === 0 ? 0 : h.totalMade / h.rounds)}
          onBack={onBack} 
          onRestart={() => { setScores([]); setStep(0); }} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1, backgroundColor: COLORS.bg },
  innerContent: { flex: 1, paddingHorizontal: 25 },
  internalBackButton: { marginTop: 10, marginBottom: 20 },
  internalBackText: { color: COLORS.textDim, fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerText: { fontSize: 32, fontWeight: '800' },
  ladderGrid: { gap: 20 },
  ladderRow: { gap: 10 },
  ladderDistanceLabel: { color: COLORS.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  ladderTrio: { flexDirection: 'row', gap: 12 },
  button: { backgroundColor: '#0a0a0a', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  buttonNumber: { color: 'rgba(255,255,255,0.2)', fontSize: 18, fontWeight: '600' },
  checkMark: { fontSize: 26 },
  scoreSummary: { alignItems: 'center', marginVertical: 25 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  statBox: { alignItems: 'center', justifyContent: 'center' },
  percentText: { position: 'absolute', color: '#fff', fontSize: 20, fontWeight: '700', top: 55 },
  statLabel: { color: COLORS.textDim, fontSize: 12, marginTop: 10, fontWeight: '600' },
  nextButton: { height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  nextButtonText: { color: '#000', fontSize: 16, fontWeight: '700', textTransform: 'uppercase' },
  helpButton: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  helpText: { fontWeight: '700' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: '#111', padding: 30, borderRadius: 25, borderWidth: 1, borderColor: '#222' },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  modalText: { color: COLORS.textDim, lineHeight: 22, fontSize: 16 },
  modalCloseButton: { marginTop: 25, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  scoreLabel: { color: '#fff', width: 70, fontSize: 14 },
  barContainer: { flex: 1, height: 8, backgroundColor: '#111', borderRadius: 4, marginHorizontal: 15 },
  barFill: { height: '100%', borderRadius: 4 },
  scorePercent: { width: 45, textAlign: 'right', fontWeight: '700' },
  overallCard: { backgroundColor: '#0a0a0a', padding: 25, borderRadius: 20, marginTop: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  overallTitle: { color: COLORS.textDim, textAlign: 'center', fontSize: 12, marginBottom: 20, textTransform: 'uppercase' },
  overallGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  actionButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  startOverlay: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  startBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 40, borderWidth: 1, borderColor: COLORS.blue },
});
