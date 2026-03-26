import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export type AppSection = 'mygame' | 'data-overview' | 'community' | 'crew' | 'weather';

export const [AppNavigationProvider, useAppNavigation] = createContextHook(() => {
  const [currentSection, setCurrentSection] = useState<AppSection>('mygame');
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);
  const [dataOverviewInitialTab, setDataOverviewInitialTab] = useState<string | null>(null);
  const [dataOverviewInitialStatsSegment, setDataOverviewInitialStatsSegment] = useState<'round' | 'practice' | null>(null);
  const [communityInitialTab, setCommunityInitialTab] = useState<string | null>(null);

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  const navigateTo = useCallback((section: AppSection, options?: { initialTab?: string; initialStatsSegment?: 'round' | 'practice'; communityTab?: string }) => {
    console.log('[AppNav] Navigating to:', section, options);
    if (options?.initialTab) {
      setDataOverviewInitialTab(options.initialTab);
    }
    if (options?.initialStatsSegment) {
      setDataOverviewInitialStatsSegment(options.initialStatsSegment);
    }
    if (options?.communityTab) {
      setCommunityInitialTab(options.communityTab);
    }
    setCurrentSection(section);
    setSidebarVisible(false);
  }, []);

  const clearDataOverviewInitialTab = useCallback(() => {
    setDataOverviewInitialTab(null);
  }, []);

  const clearDataOverviewInitialStatsSegment = useCallback(() => {
    setDataOverviewInitialStatsSegment(null);
  }, []);

  const clearCommunityInitialTab = useCallback(() => {
    setCommunityInitialTab(null);
  }, []);

  return useMemo(() => ({
    currentSection,
    sidebarVisible,
    openSidebar,
    closeSidebar,
    navigateTo,
    dataOverviewInitialTab,
    clearDataOverviewInitialTab,
    dataOverviewInitialStatsSegment,
    clearDataOverviewInitialStatsSegment,
    communityInitialTab,
    clearCommunityInitialTab,
  }), [
    currentSection,
    sidebarVisible,
    openSidebar,
    closeSidebar,
    navigateTo,
    dataOverviewInitialTab,
    clearDataOverviewInitialTab,
    dataOverviewInitialStatsSegment,
    clearDataOverviewInitialStatsSegment,
    communityInitialTab,
    clearCommunityInitialTab,
  ]);
});
