import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SENSOR_PAIRED_KEY = 'sensor_is_paired';
const SENSOR_CLUBS_KEY = 'sensor_paired_clubs';
const REQUIRED_SENSOR_COUNT = 14;

export const [SensorProvider, useSensor] = createContextHook(() => {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [pairedClubs, setPairedClubs] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const [pairedRaw, clubsRaw] = await Promise.all([
          AsyncStorage.getItem(SENSOR_PAIRED_KEY),
          AsyncStorage.getItem(SENSOR_CLUBS_KEY),
        ]);
        if (clubsRaw) {
          const clubs: string[] = JSON.parse(clubsRaw);
          setPairedClubs(clubs);
          console.log('[Sensor] Restored paired clubs from storage:', clubs.length);
          const fullyPaired = clubs.length >= REQUIRED_SENSOR_COUNT;
          setIsPaired(fullyPaired);
          if (fullyPaired) {
            AsyncStorage.setItem(SENSOR_PAIRED_KEY, 'true').catch(() => {});
          } else {
            AsyncStorage.setItem(SENSOR_PAIRED_KEY, 'false').catch(() => {});
          }
        } else if (pairedRaw === 'true') {
          setIsPaired(true);
          console.log('[Sensor] Restored paired state from storage (legacy)');
        }
      } catch (e) {
        console.log('[Sensor] Error loading persisted state:', e);
      } finally {
        setLoaded(true);
      }
    };
    void loadState();
  }, []);

  const markPaired = useCallback((clubs?: string[]) => {
    console.log('[Sensor] Marking sensors as paired (persisted)');
    if (clubs && clubs.length > 0) {
      setPairedClubs(clubs);
      AsyncStorage.setItem(SENSOR_CLUBS_KEY, JSON.stringify(clubs)).catch(() => {});
      console.log('[Sensor] Saved paired clubs:', clubs.length);
      const fullyPaired = clubs.length >= REQUIRED_SENSOR_COUNT;
      setIsPaired(fullyPaired);
      AsyncStorage.setItem(SENSOR_PAIRED_KEY, fullyPaired ? 'true' : 'false').catch(() => {});
    } else {
      setIsPaired(true);
      AsyncStorage.setItem(SENSOR_PAIRED_KEY, 'true').catch(() => {});
    }
  }, []);

  const addPairedClubs = useCallback((newClubs: string[]) => {
    setPairedClubs((prev) => {
      const combined = [...prev];
      for (const c of newClubs) {
        if (!combined.includes(c)) {
          combined.push(c);
        }
      }
      console.log('[Sensor] Added clubs, total now:', combined.length);
      AsyncStorage.setItem(SENSOR_CLUBS_KEY, JSON.stringify(combined)).catch(() => {});
      const fullyPaired = combined.length >= REQUIRED_SENSOR_COUNT;
      setIsPaired(fullyPaired);
      AsyncStorage.setItem(SENSOR_PAIRED_KEY, fullyPaired ? 'true' : 'false').catch(() => {});
      return combined;
    });
  }, []);

  const unpairClubs = useCallback((clubsToRemove: string[]) => {
    setPairedClubs((prev) => {
      const remaining = prev.filter((c) => !clubsToRemove.includes(c));
      console.log('[Sensor] Unpaired clubs, remaining:', remaining.length);
      AsyncStorage.setItem(SENSOR_CLUBS_KEY, JSON.stringify(remaining)).catch(() => {});
      const fullyPaired = remaining.length >= REQUIRED_SENSOR_COUNT;
      setIsPaired(fullyPaired);
      AsyncStorage.setItem(SENSOR_PAIRED_KEY, fullyPaired ? 'true' : 'false').catch(() => {});
      return remaining;
    });
  }, []);

  const resetPairing = useCallback(() => {
    console.log('[Sensor] Resetting sensor pairing (clearing storage)');
    setIsPaired(false);
    setPairedClubs([]);
    AsyncStorage.multiRemove([SENSOR_PAIRED_KEY, SENSOR_CLUBS_KEY]).catch(() => {});
  }, []);

  const isFullyPaired = useMemo(() => pairedClubs.length >= REQUIRED_SENSOR_COUNT, [pairedClubs]);
  const missingCount = useMemo(() => Math.max(0, REQUIRED_SENSOR_COUNT - pairedClubs.length), [pairedClubs]);

  return useMemo(() => ({
    isPaired,
    isFullyPaired,
    pairedClubs,
    loaded,
    missingCount,
    markPaired,
    addPairedClubs,
    unpairClubs,
    resetPairing,
  }), [isPaired, isFullyPaired, pairedClubs, loaded, missingCount, markPaired, addPairedClubs, unpairClubs, resetPairing]);
});
