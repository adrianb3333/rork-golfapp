import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface Props {
  adjustedDistance: number;
  originalDistance: number;
  windAdjustment: number;
  tempAdjustment: number;
  crosswindDrift: number;
}

export default function AdjustedDistance({ 
  adjustedDistance, 
  originalDistance,
  windAdjustment,
  tempAdjustment,
  crosswindDrift 
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.rubric}>Adjusted Distance</Text>
      
      <BlurView intensity={20} tint="dark" style={styles.glassWrapper}>
        <View style={styles.mainResult}>
          <Text style={styles.adjustedValue}>{adjustedDistance.toFixed(1)}</Text>
          <Text style={styles.unit}>m</Text>
        </View>
        
        <View style={styles.breakdown}>
          {windAdjustment !== 0 && (
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Wind:</Text>
              <Text style={[styles.breakdownValue, windAdjustment > 0 ? styles.positive : styles.negative]}>
                {windAdjustment > 0 ? '+' : ''}{windAdjustment.toFixed(1)}m
              </Text>
            </View>
          )}
          
          {tempAdjustment !== 0 && (
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Temp:</Text>
              <Text style={[styles.breakdownValue, tempAdjustment > 0 ? styles.positive : styles.negative]}>
                {tempAdjustment > 0 ? '+' : ''}{tempAdjustment.toFixed(1)}m
              </Text>
            </View>
          )}
          
          {crosswindDrift > 0 && (
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Drift:</Text>
              <Text style={styles.breakdownValue}>
                {crosswindDrift.toFixed(1)}m
              </Text>
            </View>
          )}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  rubric: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  glassWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  mainResult: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  adjustedValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  unit: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 4,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  breakdownValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  positive: {
    color: '#fbbf24',
  },
  negative: {
    color: '#60a5fa',
  },
});
