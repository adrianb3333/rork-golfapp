import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

interface BlankCardProps extends ViewProps {
  children?: React.ReactNode;
}

export default function BlankCard({ children, style, ...props }: BlankCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
