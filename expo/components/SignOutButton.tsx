import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ViewStyle } from 'react-native';
import { supabase } from '../lib/supabase'; // Adjusted based on your file structure

interface SignOutButtonProps {
  style?: ViewStyle;
}

const SignOutButton = ({ style }: SignOutButtonProps) => {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Supabase clears the session automatically. 
      // Your App.js auth listener will handle the navigation switch.
      console.log('User signed out successfully');
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={handleSignOut}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>Sign Out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF3B30', // Standard "Destructive" Red
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignOutButton;
