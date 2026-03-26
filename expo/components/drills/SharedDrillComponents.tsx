import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const SIZE = 140;
const STROKE_WIDTH = 12;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const DRILL_COLORS = {
  blue: '#8ecae6',
  yellow: '#f2cc8f',
  red: '#e07a5f',
  bg: '#000000',
  card: '#111111',
  textDim: 'rgba(255,255,255,0.5)',
} as const;

export const getStepColor = (step: number) => {
  if (step === 0) return DRILL_COLORS.blue;
  if (step === 1) return DRILL_COLORS.yellow;
  return DRILL_COLORS.red;
};

export const getGradientColors = (step: number) => {
  if (step === 0) return { start: '#ade8f4', end: DRILL_COLORS.blue };
  if (step === 1) return { start: '#faedcd', end: DRILL_COLORS.yellow };
  return { start: '#f4a261', end: DRILL_COLORS.red };
};

interface CircularProgressProps {
  percent: number;
  step: number;
  colorOverride?: string;
}

export const CircularProgress = React.memo<CircularProgressProps>(({ percent, step, colorOverride }) => {
  const strokeDashoffset = CIRCUMFERENCE * (1 - percent / 100);
  const gradColors = getGradientColors(step);

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
});

CircularProgress.displayName = 'CircularProgress';

interface DrillHeaderProps {
  onBack: () => void;
  title: string;
  currentColor: string;
  onHelpPress: () => void;
}

export const DrillHeader = React.memo<DrillHeaderProps>(({ onBack, title, currentColor, onHelpPress }) => (
  <>
    <Pressable onPress={onBack} style={sharedStyles.backButton}>
      <Text style={sharedStyles.backText}>← Back to Drills</Text>
    </Pressable>
    <View style={sharedStyles.headerRow}>
      <Text style={sharedStyles.headerText}>{title}</Text>
      <Pressable onPress={onHelpPress} style={[sharedStyles.helpButton, { borderColor: currentColor }]}>
        <Text style={[sharedStyles.helpText, { color: currentColor }]}>?</Text>
      </Pressable>
    </View>
  </>
));

DrillHeader.displayName = 'DrillHeader';

interface ScoreDisplayProps {
  label: string;
  current: number;
  total: number;
  color: string;
}

export const ScoreDisplay = React.memo<ScoreDisplayProps>(({ label, current, total, color }) => (
  <View style={sharedStyles.scoreContainer}>
    <Text style={sharedStyles.scoreText}>
      {label}: <Text style={{ color, fontWeight: '700' }}>{current}</Text> / {total}
    </Text>
  </View>
));

ScoreDisplay.displayName = 'ScoreDisplay';

interface StartScreenProps {
  onStart: () => void;
  title: string;
}

export const StartScreen = React.memo<StartScreenProps>(({ onStart, title }) => (
  <View style={sharedStyles.startOverlay}>
    <Pressable onPress={onStart} style={sharedStyles.startButtonContainer}>
      <View style={[sharedStyles.startDrillBorder, { borderColor: DRILL_COLORS.blue }]}>
        <Text style={[sharedStyles.startDrillText, { color: DRILL_COLORS.blue }]}>{title}</Text>
      </View>
      <Text style={sharedStyles.dateText}>{new Date().toDateString()}</Text>
    </Pressable>
  </View>
));

StartScreen.displayName = 'StartScreen';

export const sharedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DRILL_COLORS.bg },
  content: { flex: 1, paddingHorizontal: 24 },
  backButton: { marginTop: 10, marginBottom: 20 },
  backText: { color: DRILL_COLORS.textDim, fontSize: 14, fontWeight: '500' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerText: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, color: '#fff' },
  helpButton: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', borderWidth: 1 },
  helpText: { fontWeight: '600', fontSize: 16 },
  scoreContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  scoreText: { color: DRILL_COLORS.textDim, fontSize: 18 },
  startOverlay: { flex: 1, backgroundColor: DRILL_COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  startButtonContainer: { alignItems: 'center' },
  startDrillBorder: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 40 },
  startDrillText: { fontSize: 24, fontWeight: '600', letterSpacing: 1 },
  dateText: { fontSize: 14, marginTop: 15, fontWeight: '400', color: DRILL_COLORS.textDim },
  button: { backgroundColor: '#0a0a0a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  checkMark: { fontWeight: '400' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#0a0a0a', borderRadius: 24, borderWidth: 1, borderColor: '#1a1a1a' },
  modalTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  modalText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },
  modalCloseButton: { marginTop: 24, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
