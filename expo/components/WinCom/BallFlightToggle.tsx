import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

type FlightOption = 'Low' | 'Normal' | 'High';

interface Props {
  selected: FlightOption;
  onSelect: (value: FlightOption) => void;
}

export default function BallFlightToggle({ selected, onSelect }: Props) {
  const options: FlightOption[] = ['Low', 'Normal', 'High'];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ball Flight</Text>
      
      <BlurView intensity={20} tint="dark" style={styles.glassWrapper}>
        {options.map((option) => {
          const isActive = selected === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onSelect(option)}
              activeOpacity={0.7}
              style={[
                styles.optionButton,
                isActive && styles.activeButton
              ]}
            >
              <Text style={[
                styles.optionText,
                isActive ? styles.activeText : styles.inactiveText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  glassWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    // Subtle shadow for the "lifted" glass look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeText: {
    color: '#ffffff',
  },
  inactiveText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
