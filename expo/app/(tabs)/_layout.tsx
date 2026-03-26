import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/contexts/SessionContext';
import * as Haptics from 'expo-haptics';

function PlayTabIcon() {
  return (
    <View style={tabStyles.flatCircle}>
      <View style={tabStyles.shadowWrapGreen}>
        <LinearGradient
          colors={['#00F07A', '#1CD760', '#0DC94D', '#0AAF3E', '#078A30']}
          locations={[0, 0.2, 0.45, 0.7, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={tabStyles.gradientCircle}
        >
          <View style={tabStyles.innerHighlight}>
            <Text style={tabStyles.flatCircleText}>PLAY</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

function PracticeTabIcon() {
  return (
    <View style={tabStyles.flatCircle}>
      <View style={tabStyles.shadowWrapBlue}>
        <LinearGradient
          colors={['#00AAFF', '#0E94F0', '#0A7FE0', '#0768C8', '#044FA5']}
          locations={[0, 0.2, 0.45, 0.7, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={tabStyles.gradientCircle}
        >
          <View style={tabStyles.innerHighlight}>
            <Text style={tabStyles.flatCircleText}>PRACTICE</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { sessionState, startSetup } = useSession();
  const isMinimized = sessionState === 'minimized';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'transparent',

          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 0,
          height: 0,
        },
      }}
    >
      <Tabs.Screen
        name="play"
        options={{
          title: '',
          tabBarIcon: () => <PlayTabIcon />,
          href: isMinimized ? null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            startSetup('play');
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <User size={42} color={focused ? '#1A1A1A' : '#9E9E9E'} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: '',
          tabBarIcon: () => <PracticeTabIcon />,
          href: isMinimized ? null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            startSetup('practice');
          },
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  flatCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    marginTop: -14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  shadowWrapGreen: {
    width: 78,
    height: 78,
    borderRadius: 39,
    shadowColor: '#00E06A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 14,
  },
  shadowWrapBlue: {
    width: 78,
    height: 78,
    borderRadius: 39,
    shadowColor: '#0090FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 14,
  },
  gradientCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  innerHighlight: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.08)',
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  flatCircleText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
