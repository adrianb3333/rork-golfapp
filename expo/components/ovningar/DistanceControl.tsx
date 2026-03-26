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
import { supabase } from '@/lib/supabase';

const BUTTON_COUNT = 10;
const SIZE = 140; 
const STROKE_WIDTH = 12; 
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BUTTON_SIZE = 60; 

const COLORS = {
  blue: '#8ecae6', 
  yellow: '#f2cc8f', 
  red: '#e07a5f', 
  bg: '#000000', 
  card: '#111111', 
  textDim: 'rgba(255,255,255,0.5)',
};

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

interface DistanceControlCardProps {
  header: string;
  step: number;
  onNext: (scorePercent: number, madeCount: number) => void;
  onBack: () => void;
  isLast?: boolean;
  roundCount: number;
  historyForStep: { totalMade: number, rounds: number };
}

const DistanceControlCard: React.FC<DistanceControlCardProps> = ({
  header,
  step,
  onNext,
  onBack,
  isLast = false,
  roundCount,
  historyForStep,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [modalVisible, setModalVisible] = useState(false);
  const currentColor = getColor(step);
  const gradColors = getGradientColors(step);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [step]);

  const scaleAnimations = useRef(
    Array(BUTTON_COUNT).fill(0).map(() => new Animated.Value(1))
  ).current;

  const onPressIn = (index: number) => {
    Animated.spring(scaleAnimations[index], { toValue: 0.9, useNativeDriver: true }).start();
  };

  const onPressOut = (index: number) => {
    Animated.spring(scaleAnimations[index], { toValue: 1, useNativeDriver: true }).start();
  };

  const currentMade = selectedIndex + 1;
  const percentage = selectedIndex === -1 ? 0 : (currentMade / BUTTON_COUNT) * 100;

  const liveTotalMade = historyForStep.totalMade + currentMade;
  const liveTotalRounds = historyForStep.rounds + 1;
  const avgMade = liveTotalMade / liveTotalRounds;
  const avgPercentage = (avgMade / BUTTON_COUNT) * 100;

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
            fill="none" 
            cx={SIZE / 2} 
            cy={SIZE / 2} 
            r={RADIUS} 
            strokeWidth={STROKE_WIDTH} 
            strokeDasharray={CIRCUMFERENCE} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
        />
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.innerContent}>
        <Pressable onPress={onBack} style={styles.internalBackButton}>
          <Text style={styles.internalBackText}>← Back to Drills</Text>
        </Pressable>

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { color: '#fff' }]}>{header}</Text>
          <Pressable onPress={() => setModalVisible(true)} style={[styles.helpButton, { backgroundColor: '#111', borderWidth: 1, borderColor: currentColor }]}>
            <Text style={[styles.helpText, { color: currentColor }]}>?</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.buttonsContainer}>
            {Array(BUTTON_COUNT).fill(0).map((_, i) => {
              const checked = selectedIndex >= i;
              return (
                <Pressable key={`${step}-${i}`} onPress={() => setSelectedIndex(i)} onPressIn={() => onPressIn(i)} onPressOut={() => onPressOut(i)} style={{ marginBottom: 16 }}>
                  <Animated.View style={[
                    styles.button, 
                    { width: BUTTON_SIZE, height: BUTTON_SIZE }, 
                    checked && { borderColor: currentColor, backgroundColor: `${currentColor}15`, borderWidth: 1.5 }, 
                    { transform: [{ scale: scaleAnimations[i] }] }
                  ]}>
                    {checked ? (
                      <Text style={[styles.checkMark, { fontSize: 24, color: currentColor }]}>●</Text>
                    ) : (
                      <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: '500' }}>{i + 1}</Text>
                    )}
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.countTextContainer}>
            <Text style={{ color: COLORS.textDim, fontSize: 18 }}>
              Score: <Text style={{ color: currentColor, fontWeight: '700' }}>{selectedIndex === -1 ? 0 : currentMade}</Text> / {BUTTON_COUNT}
            </Text>
          </View>

          <View style={[styles.loaderRow, { marginBottom: 30 }]}>
            <View style={styles.circularLoaderContainer}>
              <CircularProgress percent={percentage} />
              <Text style={[styles.percentText, { fontSize: 28, color: '#fff' }]}>{Math.round(percentage)}%</Text>
            </View>
            <View style={styles.loaderLabels}>
              <Text style={[styles.scoreAvgText, { fontSize: 20, marginBottom: 2 }]}>Current</Text>
              <Text style={{ color: COLORS.textDim, fontSize: 14, marginBottom: 12 }}>Round {roundCount}</Text>
              <Pressable 
                disabled={selectedIndex === -1} 
                onPress={() => onNext(percentage, currentMade)} 
                style={[styles.nextButton, selectedIndex === -1 && { opacity: 0.2 }, { backgroundColor: currentColor }]}
              >
                <Text style={[styles.nextButtonText, { color: '#000' }]}>{isLast ? 'Complete' : 'Next'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.loaderRow}>
            <View style={styles.circularLoaderContainer}>
              <CircularProgress percent={avgPercentage} colorOverride="rgba(255,255,255,0.1)" />
              <Text style={[styles.percentText, { fontSize: 22, color: COLORS.textDim }]}>{avgMade.toFixed(1)}</Text>
            </View>
            <View style={styles.loaderLabels}>
              <Text style={[styles.scoreAvgText, { fontSize: 20, color: COLORS.textDim }]}>Average</Text>
              <Text style={{ color: currentColor, fontSize: 13, fontWeight: '500' }}>Live Performance</Text>
            </View>
          </View>
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
                <ScrollView contentContainerStyle={{ padding: 24 }}>
                  <Text style={[styles.modalTitle, { color: currentColor }]}>Distance Control</Text>
                  <Text style={styles.modalText}>Improve distance control and consistency at {header} range.</Text>
                  <Pressable onPress={() => setModalVisible(false)} style={[styles.modalCloseButton, { backgroundColor: currentColor }]}>
                      <Text style={{ color: '#000', fontWeight: '700' }}>Got it</Text>
                  </Pressable>
                </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const ResultsCard: React.FC<{ scores: number[]; avgs: number[]; onBack: () => void; onRestart: () => void }> = ({ scores, avgs, onBack, onRestart }) => {
  const labels = ['135m', '165m', '185m'];
  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.innerContent}>
        <Pressable onPress={onBack} style={styles.internalBackButton}>
          <Text style={styles.internalBackText}>← Done</Text>
        </Pressable>
        
        <Text style={[styles.headerText, { marginBottom: 8, color: '#fff' }]}>Session Summary</Text>
        <Text style={{ color: COLORS.textDim, marginBottom: 32, fontSize: 16 }}>Great work today.</Text>

        {scores.map((score, index) => {
          const rowColor = getColor(index);
          return (
            <View key={index} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Text style={styles.scoreLabel}>{labels[index]}</Text>
                <Text style={[styles.scorePercent, { color: rowColor }]}>{Math.round(score)}%</Text>
              </View>
              <View style={styles.horizontalBarBackground}>
                <View style={[styles.horizontalBarFill, { width: `${score}%`, backgroundColor: rowColor }]} />
              </View>
            </View>
          );
        })}
        
        <View style={styles.avgCard}>
          <Text style={styles.avgCardTitle}>Overall Average</Text>
          <View style={styles.resultsAvgRow}>
            {labels.map((label, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={styles.miniLabel}>{label}</Text> 
                <Text style={{ color: getColor(i), fontSize: 26, fontWeight: '800' }}>
                  {avgs[i].toFixed(1)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '700' }}>MADE</Text>
              </View>
            ))}
          </View>
        </View>

        <div style={{ marginTop: 'auto', paddingBottom: 20 }}>
          <Pressable onPress={onRestart} style={[styles.actionButton, { backgroundColor: '#fff', borderColor: '#fff' }]}>
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>Practice Again</Text>
          </Pressable>

          <Pressable onPress={onBack} style={[styles.actionButton, { marginTop: 12, borderColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Finish Session</Text>
          </Pressable>
        </div>
      </View>
    </SafeAreaView>
  );
};

export default function DistanceControl({ onBack, drillName = "Distance Control" }: { onBack: () => void, drillName?: string }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const [history, setHistory] = useState([
    { totalMade: 0, rounds: 0 },
    { totalMade: 0, rounds: 0 },
    { totalMade: 0, rounds: 0 }
  ]);

  const headers = ['135m', '165m', '185m'];

  const saveToSupabase = async (finalMade: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('golf_drills')
        .insert([
          { 
            user_id: user.id, 
            drill_name: `${drillName} - ${headers[step]}`, 
            score: finalMade 
          },
        ]);
      if (error) throw error;
    } catch (err) {
      console.error("Error saving drill:", err);
    }
  };

  if (!isStarted) {
    const date = new Date();
    return (
      <View style={styles.startOverlay}>
        <Pressable onPress={() => setIsStarted(true)} style={styles.startButtonContainer}>
          <View style={[styles.startDrillBorder, { borderColor: COLORS.blue }]}>
            <Text style={[styles.startDrillText, { color: COLORS.blue }]}>Start Drill</Text>
          </View>
          <Text style={[styles.dateText, { color: COLORS.textDim }]}>{date.toDateString()}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {step < 3 ? (
        <DistanceControlCard 
          header={headers[step]} 
          step={step} 
          onNext={(score, made) => {
            const s = [...scores]; s[step] = score; setScores(s);
            const h = [...history]; h[step] = { totalMade: h[step].totalMade + made, rounds: h[step].rounds + 1 }; setHistory(h);
            
            saveToSupabase(made); 

            if (step < 2) {
              setStep(step + 1);
            } else {
              setStep(3);
            }
          }} 
          onBack={onBack} 
          isLast={step === 2} 
          roundCount={roundCount}
          historyForStep={history[step]}
        />
      ) : (
        <ResultsCard 
          scores={scores} 
          avgs={history.map(h => h.rounds === 0 ? 0 : h.totalMade / h.rounds)}
          onBack={onBack} 
          onRestart={() => { setScores([]); setStep(0); setRoundCount(r => r + 1); }} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1, backgroundColor: COLORS.bg },
  innerContent: { flex: 1, paddingHorizontal: 24 },
  internalBackButton: { marginTop: 10, marginBottom: 20 },
  internalBackText: { color: COLORS.textDim, fontSize: 14, fontWeight: '500' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerText: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  buttonsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  button: { backgroundColor: '#0a0a0a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  checkMark: { fontWeight: '400' },
  countTextContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  loaderRow: { flexDirection: 'row', alignItems: 'center' },
  circularLoaderContainer: { width: SIZE, height: SIZE, justifyContent: 'center', alignItems: 'center' },
  loaderLabels: { flex: 1, marginLeft: 24 },
  percentText: { position: 'absolute', fontWeight: '600' },
  scoreAvgText: { color: '#fff', fontWeight: '600' },
  nextButton: { borderRadius: 30, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start' },
  nextButtonText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 14 },
  helpButton: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  helpText: { fontWeight: '600', fontSize: 16 },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#0a0a0a', borderRadius: 24, borderWidth: 1, borderColor: '#1a1a1a' },
  modalTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  modalText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },
  modalCloseButton: { marginTop: 24, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  horizontalBarBackground: { width: '100%', height: 6, backgroundColor: '#111', borderRadius: 3, marginTop: 10 },
  horizontalBarFill: { height: '100%', borderRadius: 3 },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '500' },
  scorePercent: { fontWeight: '700', fontSize: 18 },
  avgCard: { backgroundColor: '#0a0a0a', borderRadius: 24, padding: 24, marginTop: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  avgCardTitle: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20, textAlign: 'center', opacity: 0.4 },
  resultsAvgRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  miniLabel: { color: COLORS.textDim, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  actionButton: { width: '100%', alignItems: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  startOverlay: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  startButtonContainer: { alignItems: 'center' },
  startDrillBorder: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 40 },
  startDrillText: { fontSize: 24, fontWeight: '600', letterSpacing: 1 },
  dateText: { fontSize: 14, marginTop: 15, fontWeight: '400' },
});
