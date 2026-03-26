import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface FrostedGlassCardProps {
  children?: ReactNode;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  intensity?: number; // Control the strength of the blur (0-100)
}

const FrostedGlassCard: React.FC<FrostedGlassCardProps> = ({ 
  children, 
  style, 
  containerStyle,
  intensity = 30
}) => {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Outer Border Gradient */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.5)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBorder, style]}
      >
        {/* The Blur Effect Layer */}
        <BlurView intensity={intensity} tint="light" style={styles.innerContent}>
          {/* Main Tint & Liquid Shine */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.contentContainer}>
            {children}
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    backgroundColor: 'transparent',
    // Shadow to lift the white glass off the background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  gradientBorder: {
    padding: 1.5,
    borderRadius: 24,
    overflow: 'hidden',
  },
  innerContent: {
    borderRadius: 22,
    minHeight: 150,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Softens the blur for a "milky" look
  },
});

export default FrostedGlassCard;
