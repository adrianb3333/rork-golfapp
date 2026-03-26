import React, { useState } from "react";
import { StyleSheet, Text, ScrollView, View, Pressable, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LiquidGlassCard from "@/components/reusables/LiquidGlassCard";

import SwingThoughtsModal from "@/app/modals/swing-thoughts-modal";
import ClubModal from "@/app/modals/club-modal";
import MentalGameModal from "@/app/modals/mental-game-modal";
import GolfIQModal from "@/app/modals/golf-iq-modal";
import GeneralModal from "@/app/modals/general-modal";
import PreRoundModal from "@/app/modals/pre-round-modal";
import DistancesModal from "@/app/modals/distances-modal";
import StrokesGainedModal from "@/app/modals/strokesgained-modal";

type ModalKey = 'swing-thoughts' | 'club' | 'mental-game' | 'golf-iq' | 'general' | 'pre-round' | 'distances' | 'strokesgained' | null;

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

const CLUB_DATA_BUTTONS: { title: string; modalKey: ModalKey }[] = [
  { title: "Distances", modalKey: "distances" },
  { title: "Strokes Gained", modalKey: "strokesgained" },
];

export default function NotesScreen() {
  const [activeModal, setActiveModal] = useState<ModalKey>(null);

  const closeModal = () => setActiveModal(null);

  const renderModal = () => {
    switch (activeModal) {
      case 'swing-thoughts': return <SwingThoughtsModal onClose={closeModal} />;
      case 'club': return <ClubModal onClose={closeModal} />;
      case 'mental-game': return <MentalGameModal onClose={closeModal} />;
      case 'golf-iq': return <GolfIQModal onClose={closeModal} />;
      case 'general': return <GeneralModal onClose={closeModal} />;
      case 'pre-round': return <PreRoundModal onClose={closeModal} />;
      case 'distances': return <DistancesModal onClose={closeModal} />;
      case 'strokesgained': return <StrokesGainedModal onClose={closeModal} />;
      default: return null;
    }
  };

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.clubDataSection}>
            <View style={styles.clubDataHeaderRow}>
              <Text style={styles.clubDataHeader}>Club DATA</Text>
              <Text style={styles.clubDataSubtext}>(Sensors Needed)</Text>
            </View>
            <View style={styles.clubDataButtons}>
              {CLUB_DATA_BUTTONS.map((btn, index) => (
                <Pressable
                  key={index}
                  style={styles.clubDataButton}
                  onPress={() => setActiveModal(btn.modalKey)}
                >
                  <Text style={styles.clubDataButtonTitle}>{btn.title}</Text>
                </Pressable>
              ))}
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, flexGrow: 1 },
  sectionTitle: { fontSize: 28, fontWeight: "700" as const, color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  clubDataSection: {
    marginBottom: 20,
  },
  clubDataHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginBottom: 10,
    gap: 6,
  },
  clubDataHeader: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  clubDataSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500' as const,
  },
  clubDataButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  clubDataButton: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  clubDataButtonTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  cardContainer: { marginBottom: 12 },
  card: { width: '100%' },
  cardContent: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 16 },
  textContainer: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: "700" as const, color: '#FFFFFF' },
  cardDescription: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
});
