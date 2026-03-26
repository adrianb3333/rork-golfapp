import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, ScrollView, View, Pressable, Modal, Platform } from "react-native";
import { Clock, Thermometer, Timer } from 'lucide-react-native';
import { LinearGradient } from "expo-linear-gradient";
import LiquidGlassCard from "@/components/reusables/LiquidGlassCard";
import { useSession } from '@/contexts/SessionContext';
import { fetchGolfWeather } from '@/services/weatherApi';

import SwingThoughtsModal from "@/app/modals/swing-thoughts-modal";
import ClubModal from "@/app/modals/club-modal";
import MentalGameModal from "@/app/modals/mental-game-modal";
import GolfIQModal from "@/app/modals/golf-iq-modal";
import GeneralModal from "@/app/modals/general-modal";
import PreRoundModal from "@/app/modals/pre-round-modal";

type ModalKey = 'swing-thoughts' | 'club' | 'mental-game' | 'golf-iq' | 'general' | 'pre-round' | null;

const NOTES_DATA: { title: string; description: string; modalKey: ModalKey }[] = [
  { title: "Swing Thoughts", description: "Describe Every Detail Of Your Swing", modalKey: "swing-thoughts" },
  { title: "Mental Thinking & Strategies", description: "Your mental approach to the game", modalKey: "club" },
  { title: "Mental Game", description: '"Golf is 90% mental and 10% physical."', modalKey: "mental-game" },
  { title: "Golf IQ", description: "Manage Yourself On The Course", modalKey: "golf-iq" },
  { title: "General", description: "Your Own Focus", modalKey: "general" },
];

const PREPARATION_DATA = {
  title: "Terrain & Weather",
  description: "Understand how external factors affect your game",
  modalKey: "pre-round" as ModalKey,
};

export default function InfoTab() {
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const { sessionStartTime } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [temperature, setTemperature] = useState<number | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sessionStartTime) return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStartTime]);

  useEffect(() => {
    const loadTemp = async () => {
      try {
        if (Platform.OS !== 'web' || navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          const result = await fetchGolfWeather(position.coords.latitude, position.coords.longitude);
          if (result) setTemperature(result.temp);
        }
      } catch {
        const result = await fetchGolfWeather(59.33, 18.07);
        if (result) setTemperature(result.temp);
      }
    };
    void loadTemp();
  }, []);

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const closeModal = () => setActiveModal(null);

  const renderModal = () => {
    switch (activeModal) {
      case 'swing-thoughts': return <SwingThoughtsModal onClose={closeModal} />;
      case 'club': return <ClubModal onClose={closeModal} />;
      case 'mental-game': return <MentalGameModal onClose={closeModal} />;
      case 'golf-iq': return <GolfIQModal onClose={closeModal} />;
      case 'general': return <GeneralModal onClose={closeModal} />;
      case 'pre-round': return <PreRoundModal onClose={closeModal} />;
      default: return null;
    }
  };

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <Clock size={13} color="#FFFFFF" />
            <Text style={styles.miniStatValue}>{formatTime(currentTime)}</Text>
          </View>
          <View style={styles.miniStat}>
            <Thermometer size={13} color="#FFFFFF" />
            <Text style={styles.miniStatValue}>
              {temperature !== null ? `${temperature}°C` : '--°C'}
            </Text>
          </View>
          <View style={styles.miniStat}>
            <Timer size={13} color="#FFFFFF" />
            <Text style={styles.miniStatValue}>{formatElapsed(elapsed)}</Text>
          </View>
        </View>

        {NOTES_DATA.map((note, index) => (
          <Pressable
            key={index}
            onPress={() => setActiveModal(note.modalKey)}
            style={styles.cardContainer}
          >
            <LiquidGlassCard containerStyle={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{note.title}</Text>
                  <Text style={styles.cardDescription}>{note.description}</Text>
                </View>
              </View>
            </LiquidGlassCard>
          </Pressable>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>The External Factors</Text>

        <Pressable
          onPress={() => setActiveModal(PREPARATION_DATA.modalKey)}
          style={styles.cardContainer}
        >
          <LiquidGlassCard containerStyle={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{PREPARATION_DATA.title}</Text>
                <Text style={styles.cardDescription}>{PREPARATION_DATA.description}</Text>
              </View>
            </View>
          </LiquidGlassCard>
        </Pressable>
      </ScrollView>

      <Modal
        visible={activeModal !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        {renderModal()}
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 28, fontWeight: "700" as const, color: '#FFFFFF', marginBottom: 16, textAlign: 'center' as const },
  miniStatsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 6,
    marginBottom: 20,
  },
  miniStat: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  cardContainer: { marginBottom: 12 },
  card: { width: '100%' },
  cardContent: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 16 },
  textContainer: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: "700" as const, color: '#FFFFFF' },
  cardDescription: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
});
