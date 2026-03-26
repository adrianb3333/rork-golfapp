import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation, AppSection } from '@/contexts/AppNavigationContext';
import { useProfile } from '@/contexts/ProfileContext';
import { wp, fp, getScreenWidth } from '@/utils/responsive';

const SIDEBAR_WIDTH = getScreenWidth() * 0.75;

interface SidebarItem {
  key: AppSection;
  label: string;
  icon: React.ReactNode;
  subItems?: string[];
}

const sections: SidebarItem[] = [
  {
    key: 'mygame',
    label: 'MyGame',
    icon: null,
    subItems: ['Profile', 'PLAY', 'PRACTICE'],
  },
  {
    key: 'data-overview',
    label: 'Data Overview',
    icon: null,
    subItems: ['Stats', 'SG', 'Shots', 'Details', 'Video'],
  },
  {
    key: 'community',
    label: 'Community',
    icon: null,
    subItems: ['Tour', 'Affiliate', 'Entertainment'],
  },
];

export default function Sidebar() {
  const { sidebarVisible, closeSidebar, navigateTo, currentSection } = useAppNavigation();
  const { isCoachMode } = useProfile();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (sidebarVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 20,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sidebarVisible, slideAnim, overlayAnim]);

  return (
    <Modal
      visible={sidebarVisible}
      transparent
      animationType="none"
      onRequestClose={closeSidebar}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlayAnim },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={closeSidebar}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sidebar,
            {
              width: SIDEBAR_WIDTH,
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Image source={require('@/assets/images/golferscrib-logo.png')} style={styles.sidebarLogo} resizeMode="contain" />
            <TouchableOpacity onPress={closeSidebar} style={styles.glassCloseBtn} activeOpacity={0.7}>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionsList}>
            {sections.map((section) => {
              const isActive = currentSection === section.key;
              return (
                <TouchableOpacity
                  key={section.key}
                  style={[styles.sectionItem, isActive && styles.sectionItemActive]}
                  onPress={() => navigateTo(section.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionRow}>
                    <View style={styles.sectionInfo}>
                      <Text style={[styles.sectionLabel, isActive && styles.sectionLabelActive]}>
                        {section.label}
                      </Text>
                    </View>
                  </View>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}

            {isCoachMode && (
              <>
                <View style={styles.crewDivider} />
                {(() => {
                  const isCrewActive = currentSection === 'crew';
                  return (
                    <TouchableOpacity
                      style={[styles.sectionItem, isCrewActive && styles.sectionItemActive]}
                      onPress={() => navigateTo('crew')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sectionRow}>
                        <View style={styles.sectionInfo}>
                          <Text style={[styles.sectionLabel, isCrewActive && styles.sectionLabelActive]}>
                            Crew
                          </Text>
                        </View>
                      </View>
                      {isCrewActive && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                  );
                })()}
              </>
            )}
          </View>

          <View style={styles.weatherSection}>
            <TouchableOpacity
              style={styles.weatherItem}
              onPress={() => navigateTo('weather')}
              activeOpacity={0.7}
            >
              <Text style={styles.weatherLabel}>Weather Data 🧭</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>Golf App v1.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sidebar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E8E8E8',
    justifyContent: 'space-between' as const,
  },
  sidebarHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sidebarLogo: {
    width: wp(140),
    height: wp(36),
  },
  glassCloseBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionsList: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  sectionItem: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  sectionItemActive: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 14,
  },

  sectionInfo: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: fp(16),
    fontWeight: '700' as const,
    color: '#999999',
  },
  sectionLabelActive: {
    color: '#1A1A1A',
  },

  activeIndicator: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: '#1A1A1A',
  },
  sidebarFooter: {
    paddingHorizontal: 20,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center' as const,
  },
  crewDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 16,
    marginVertical: 10,
  },
  weatherSection: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  weatherItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  weatherLabel: {
    fontSize: fp(16),
    fontWeight: '700' as const,
    color: '#999999',
  },
});
