import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LiquidGlassCardProps {
  children?: ReactNode;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({ 
  children, 
  style, 
  containerStyle 
}) => {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Outer Border Glow/Edge */}
      <LinearGradient
        colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.4)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBorder, style]}
      >
        {/* Main Dark Body */}
        <View style={styles.innerContent}>
          {/* Top Diagonal Shine (The "Glass" reflection) */}
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  gradientBorder: {
    padding: 1.5, // This creates the thin "lit" edge
    borderRadius: 24,
  },
  innerContent: {
    backgroundColor: '#1a1a1a', // Dark liquid base
    borderRadius: 22,
    padding: 20,
    minHeight: 150,
    overflow: 'hidden',
    justifyContent: 'center',
  },
});

export default LiquidGlassCard;
