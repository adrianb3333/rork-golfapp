import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Target, Navigation, Wind, FileText, Database } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';
import { ScoringProvider, useScoring } from '@/contexts/ScoringContext';
import ScoreTab from './tabs/ScoreTab';
import GPSTab from './tabs/GPSTab';
import WindTab from './tabs/WindTab';
import InfoTab from './tabs/InfoTab';
import DataTab from './tabs/DataTab';
import ScoreBoard from '@/components/ScoBoa/ScoreBoard';

type PlayTab = 'score' | 'gps' | 'wind' | 'info' | 'data';

const GREEN_ACTIVE = '#3D954D';
const GREEN_INACTIVE = '#9BBFA2';

const tabConfig: { key: PlayTab; label: string; icon: React.ReactNode }[] = [
  { key: 'score', label: 'Score', icon: <Target size={20} /> },
  { key: 'gps', label: 'GPS', icon: <Navigation size={20} /> },
  { key: 'wind', label: 'Wind', icon: <Wind size={20} /> },
  { key: 'info', label: 'Info', icon: <FileText size={20} /> },
  { key: 'data', label: 'Data', icon: <Database size={20} /> },
];

function PlaySessionContent() {
  const [activeTab, setActiveTab] = useState<PlayTab>('score');
  const [gpsDistance, setGpsDistance] = useState<number>(0);
  const [gpsAdjustedDistance, setGpsAdjustedDistance] = useState<number>(0);
  const { minimizeSession } = useSession();
  const { showScoreboard, setShowScoreboard, currentHoleIndex, goToHole } = useScoring();
  const insets = useSafeAreaInsets();

  const handleGpsDistanceChange = useCallback((dist: number) => {
    setGpsDistance(dist);
  }, []);

  const handleGpsAdjustedDistanceChange = useCallback((dist: number) => {
    setGpsAdjustedDistance(dist);
  }, []);

  const handleGpsHoleChange = useCallback((index: number) => {
    console.log('[PlaySession] GPS hole changed to index:', index);
    goToHole(index);
  }, [goToHole]);

  const isScoreTab = activeTab === 'score';
  const isFullScreenTab = activeTab === 'wind' || activeTab === 'info' || activeTab === 'gps' || activeTab === 'data';

  const renderContent = () => {
    switch (activeTab) {
      case 'score': return <ScoreTab />;
      case 'gps': return <GPSTab onDistanceChange={handleGpsDistanceChange} onAdjustedDistanceChange={handleGpsAdjustedDistanceChange} externalHoleIndex={currentHoleIndex} onHoleIndexChange={handleGpsHoleChange} />;
      case 'wind': return <WindTab externalDistance={gpsDistance} externalAdjustedDistance={gpsAdjustedDistance} />;
      case 'info': return <InfoTab />;
      case 'data': return <DataTab />;
    }
  };

  return (
    <View style={styles.container}>
      {isScoreTab ? (
        <View style={[styles.scoreContainer, { paddingTop: insets.top }]}>
          {renderContent()}
        </View>
      ) : isFullScreenTab ? (
        <>
          <TouchableOpacity
            onPress={minimizeSession}
            style={[styles.minimizeButton, { top: insets.top + 4 }]}
          >
            <View style={styles.minimizeGlassCircle}>
              <ChevronDown size={28} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <View style={styles.fullScreenContent}>
            {renderContent()}
          </View>
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={minimizeSession}
            style={[styles.minimizeButton, { top: insets.top + 4 }]}
          >
            <View style={styles.minimizeGlassCircle}>
              <ChevronDown size={28} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <View style={[styles.content, { paddingTop: insets.top + 52, padding: 20 }]}>
            {renderContent()}
          </View>
        </>
      )}

      <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={isActive ? styles.tabActiveHighlight : undefined}>
                <View style={[{ alignItems: 'center' as const }, isActive ? styles.iconActive : styles.iconInactive]}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                    color: isActive ? GREEN_ACTIVE : GREEN_INACTIVE,
                  })}
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScoreBoard visible={showScoreboard} onClose={() => setShowScoreboard(false)} />
    </View>
  );
}

export default function PlaySessionTabs() {
  return (
    <ScoringProvider>
      <PlaySessionContent />
    </ScoringProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scoreContainer: {
    flex: 1,
  },
  minimizeButton: {
    position: 'absolute' as const,
    left: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  minimizeGlassCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fullScreenContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabActive: {},
  tabActiveHighlight: {
    backgroundColor: 'rgba(61,149,77,0.08)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  iconActive: {},
  iconInactive: {
    opacity: 0.5,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: GREEN_INACTIVE,
    fontWeight: '500' as const,
  },
  tabLabelActive: {
    color: GREEN_ACTIVE,
    fontWeight: '700' as const,
  },
});
