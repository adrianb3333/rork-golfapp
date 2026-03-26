import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useRef, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import LiquidGlassCard from "@/components/reusables/LiquidGlassCard";
import LogicCard from "@/components/reusables/LogicCard";
import StatCard from "@/components/reusables/StatCard";
import { useUserData } from "@/hooks/useUserData";

export default function MentalGameModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };
  const { userData, updateMentalGame } = useUserData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const text = userData.mentalGame.preShotRoutine;

  const handleChangeText = useCallback((next: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateMentalGame(next);
    }, 500);
  }, [updateMentalGame]);

  return (
    <ImageBackground
      source={{
        uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2og1gfzbpfgrdjyzujhyg",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar hidden />

      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={28} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionHeader}>Pre-shot Routine</Text>

          <LiquidGlassCard>
            <TextInput
              defaultValue={text}
              onChangeText={handleChangeText}
              multiline
              textAlignVertical="top"
              placeholder="Write here..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.input}
            />
          </LiquidGlassCard>

          <Text style={styles.mainHeader}>My Self-Talk</Text>

          <LiquidGlassCard>
            <LogicCard label="Before Round" />
            <LogicCard label="During Round" />
            <LogicCard label="Before Action" />
          </LiquidGlassCard>

          <View style={styles.yellowLine} />

          <Text style={styles.mainHeader}>Confidence Flow</Text>

          <LiquidGlassCard>
            <Text style={styles.subHeader}>Preparation Of Shot</Text>
            <StatCard label="1. Judge / Assess SHOT" value="" />
            <StatCard label="2. Visualize SHOT" value="" />
            <StatCard label="3. Feel SHOT (practise swing)" value="" />

            <Text style={styles.subHeader}>Execution Of Shot</Text>
            <StatCard label="1. Setup of SHOT" value="" />
            <StatCard label="2. Trigger the Shot" value="" />
            <StatCard label="3. Commit 110% / Believe in the SHOT" value="" />
          </LiquidGlassCard>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#020d12",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 8,
  },
  mainHeader: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#FFD700",
    textAlign: "center",
    marginVertical: 12,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFD700",
    marginVertical: 8,
    textAlign: "center",
  },
  yellowLine: {
    height: 2,
    backgroundColor: "#FFD700",
    marginVertical: 16,
    borderRadius: 1,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 26,
    minHeight: 220,
  },
});
