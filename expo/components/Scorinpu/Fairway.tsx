import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Check, ArrowLeft, ArrowRight } from 'lucide-react-native';
import type { FairwayHit, PuttDistance } from '@/contexts/ScoringContext';

interface FairwayProps {
  initialFairway: FairwayHit | null;
  initialPutts: number;
  initialPuttDistance: PuttDistance | null;
  onNext: (fairway: FairwayHit, putts: number, puttDistance: PuttDistance | null) => void;
  onPrevious: () => void;
}

const PUTT_DISTANCES: PuttDistance[] = ['<1', '1-2', '2-4', '4-8', '8+'];

export default function Fairway({ initialFairway, initialPutts, initialPuttDistance, onNext, onPrevious }: FairwayProps) {
  const [fairway, setFairway] = useState<FairwayHit | null>(initialFairway);
  const [putts, setPutts] = useState<number>(initialPutts);
  const [puttDistance, setPuttDistance] = useState<PuttDistance | null>(initialPuttDistance);

  useEffect(() => {
    setFairway(initialFairway);
    setPutts(initialPutts);
    setPuttDistance(initialPuttDistance);
  }, [initialFairway, initialPutts, initialPuttDistance]);

  const handleNext = () => {
    if (!fairway) return;
    onNext(fairway, putts, puttDistance);
  };

  const decrementPutts = () => setPutts((prev) => Math.max(0, prev - 1));
  const incrementPutts = () => setPutts((prev) => Math.min(9, prev + 1));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Fairwayträff</Text>
        <View style={styles.fairwayRow}>
          <TouchableOpacity
            style={[styles.fairwayBtn, fairway === 'left' && styles.fairwayBtnActive]}
            onPress={() => setFairway('left')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={fairway === 'left' ? '#fff' : '#ccc'} />
            <Text style={[styles.fairwayBtnText, fairway === 'left' && styles.fairwayBtnTextActive]}>
              Miss Vänster
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fairwayBtn, fairway === 'hit' && styles.fairwayBtnActive]}
            onPress={() => setFairway('hit')}
            activeOpacity={0.7}
          >
            <Check size={20} color={fairway === 'hit' ? '#fff' : '#ccc'} />
            <Text style={[styles.fairwayBtnText, fairway === 'hit' && styles.fairwayBtnTextActive]}>
              Träff
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fairwayBtn, fairway === 'right' && styles.fairwayBtnActive]}
            onPress={() => setFairway('right')}
            activeOpacity={0.7}
          >
            <ArrowRight size={20} color={fairway === 'right' ? '#fff' : '#ccc'} />
            <Text style={[styles.fairwayBtnText, fairway === 'right' && styles.fairwayBtnTextActive]}>
              Miss Höger
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Puttar</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity style={styles.counterBtn} onPress={decrementPutts} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{putts}</Text>
          <TouchableOpacity style={styles.counterBtn} onPress={incrementPutts} activeOpacity={0.7}>
            <ChevronRight size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Första puttlängden (m)</Text>
        <View style={styles.distanceRow}>
          {PUTT_DISTANCES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.distanceBtn, puttDistance === d && styles.distanceBtnActive]}
              onPress={() => setPuttDistance(d)}
              activeOpacity={0.7}
            >
              <Text style={[styles.distanceBtnText, puttDistance === d && styles.distanceBtnTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.prevBtn} onPress={onPrevious} activeOpacity={0.7}>
          <Text style={styles.prevBtnText}>Föregående</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !fairway && styles.nextBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.7}
          disabled={!fairway}
        >
          <Text style={styles.nextBtnText}>Nästa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  fairwayRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  fairwayBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 95,
    gap: 4,
  },
  fairwayBtnActive: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  fairwayBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#aaa',
    marginTop: 2,
  },
  fairwayBtnTextActive: {
    color: '#fff',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  counterValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    minWidth: 40,
    textAlign: 'center',
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  distanceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  distanceBtnActive: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  distanceBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#aaa',
  },
  distanceBtnTextActive: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  prevBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
