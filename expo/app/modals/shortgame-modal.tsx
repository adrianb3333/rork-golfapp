import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function ShortGameModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };

  return (
    <View style={styles.background}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.backButton}>
            <ArrowLeft size={22} color="#F5F7F6" />
          </Pressable>
          <Text style={styles.headerTitle}>Short Game</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.placeholderSection}>
            <Text style={styles.placeholderTitle}>Short Game Data</Text>
            <Text style={styles.placeholderDesc}>Sensor data will populate your short game statistics here.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#020d12' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2a22',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  headerSpacer: { width: 36 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  placeholderSection: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222222',
    alignItems: 'center' as const,
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  placeholderDesc: {
    fontSize: 14,
    color: '#8A9B90',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
