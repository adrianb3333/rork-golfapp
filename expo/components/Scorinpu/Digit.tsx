import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';


interface DigitProps {
  par: number;
  onSelectScore: (score: number) => void;
  onClear: () => void;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function Digit({ par, onSelectScore, onClear }: DigitProps) {
  const getLabelForDigit = (digit: number): string | null => {
    if (digit <= 0 || digit > 9) return null;
    const diff = digit - par;
    if (diff <= -3) return 'Albatross';
    if (diff === -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double Bogey';
    return null;
  };

  const isParDigit = (digit: number): boolean => digit === par;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {DIGITS.map((digit) => {
          const label = getLabelForDigit(digit);
          const isPar = isParDigit(digit);
          return (
            <TouchableOpacity
              key={digit}
              style={[styles.digitButton, isPar && styles.digitButtonPar]}
              onPress={() => onSelectScore(digit)}
              activeOpacity={0.6}
            >
              <Text style={[styles.digitText, isPar && styles.digitTextPar]}>{digit}</Text>
              {label ? (
                <Text style={[styles.digitLabel, isPar && styles.digitLabelPar]} numberOfLines={1}>
                  {label}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.bottomButton} onPress={onClear} activeOpacity={0.6}>
          <Text style={styles.bottomButtonText}>Rensa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButton} onPress={() => {}} activeOpacity={0.6}>
          <Text style={styles.bottomButtonText}>—</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => onSelectScore(10)}
          activeOpacity={0.6}
        >
          <Text style={styles.bottomButtonText}>10+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  digitButton: {
    width: '33.33%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  digitButtonPar: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  digitText: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#fff',
  },
  digitTextPar: {
    color: '#fff',
  },
  digitLabel: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  digitLabelPar: {
    color: '#CCCCCC',
  },
  bottomRow: {
    flexDirection: 'row',
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bottomButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
