import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createActor } from 'xstate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bleMachine } from '@/services/ble/bleMachine';
import type {
  SensorMapping,
  ShotPayload,
  PairingProgress,
  PlayModeState,
  PracticeModeState,
  UnpairingProgress,
} from '@/services/ble/bleTypes';

const MAPPINGS_STORAGE_KEY = 'ble_sensor_mappings';

export type BLEState =
  | 'idle'
  | 'pairing.scanning'
  | 'pairing.detected'
  | 'pairing.bonding'
  | 'pairing.bondSuccess'
  | 'pairing.awaitNext'
  | 'pairing.complete'
  | 'pairing.scanError'
  | 'pairing.bondError'
  | 'pairingVerification'
  | 'pairedComplete'
  | 'playMode.checkingBluetooth'
  | 'playMode.backgroundScanning'
  | 'playMode.processingShot'
  | 'playMode.btError'
  | 'practiceMode.active'
  | 'practiceMode.shotReceived'
  | 'practiceMode.drillComplete'
  | 'unpairing.resettingFirmware'
  | 'unpairing.removingBond'
  | 'unpairing.disconnecting'
  | 'unpairing.unpairSuccess'
  | 'unpairing.awaitNextUnpair'
  | 'unpairing.unpairComplete'
  | 'unpairing.unpairError';

function resolveStateString(stateValue: any): BLEState {
  if (typeof stateValue === 'string') return stateValue as BLEState;
  if (typeof stateValue === 'object') {
    const keys = Object.keys(stateValue);
    if (keys.length > 0) {
      const parent = keys[0];
      const child = stateValue[parent];
      if (typeof child === 'string') return `${parent}.${child}` as BLEState;
      return parent as BLEState;
    }
  }
  return 'idle';
}

export const [BLEProvider, useBLE] = createContextHook(() => {
  const actorRef = useRef(createActor(bleMachine));
  const [currentState, setCurrentState] = useState<BLEState>('idle');
  const [sensorMappings, setSensorMappings] = useState<SensorMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pairingProgress, setPairingProgress] = useState<PairingProgress>({
    totalClubs: 0,
    pairedCount: 0,
    currentClubId: null,
    currentClubName: null,
    detectedDevice: null,
  });
  const [playMode, setPlayMode] = useState<PlayModeState>({
    connectedSensors: 0,
    totalSensors: 14,
    shotsReceived: 0,
    lastShot: null,
    isScanning: false,
  });
  const [practiceMode, setPracticeMode] = useState<PracticeModeState>({
    targetCount: 0,
    remainingShots: 0,
    completedPairs: 0,
    shots: [],
    isComplete: false,
  });
  const [unpairingProgress, setUnpairingProgress] = useState<UnpairingProgress>({
    totalToUnpair: 0,
    unpairedCount: 0,
    currentClubId: null,
    currentClubName: null,
    currentStep: 'idle',
  });
  const [allPlayShots, setAllPlayShots] = useState<ShotPayload[]>([]);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const actor = actorRef.current;

    const loadMappings = async () => {
      try {
        const stored = await AsyncStorage.getItem(MAPPINGS_STORAGE_KEY);
        if (stored) {
          const mappings: SensorMapping[] = JSON.parse(stored);
          console.log('[BLE] Restored', mappings.length, 'sensor mappings from storage');
          setSensorMappings(mappings);
        }
      } catch (e) {
        console.log('[BLE] Error loading stored mappings:', e);
      }
      setInitialized(true);
    };

    const subscription = actor.subscribe((snapshot) => {
      const stateStr = resolveStateString(snapshot.value);
      console.log('[BLE] State:', stateStr);
      setCurrentState(stateStr);
      setError(snapshot.context.error);
      setPairingProgress(snapshot.context.pairingProgress);
      setPlayMode(snapshot.context.playMode);
      setPracticeMode(snapshot.context.practiceMode);
      setUnpairingProgress(snapshot.context.unpairingProgress);
      setAllPlayShots(snapshot.context.allPlayShots);

      const newMappings = snapshot.context.sensorMappings;
      setSensorMappings(newMappings);
      AsyncStorage.setItem(MAPPINGS_STORAGE_KEY, JSON.stringify(newMappings)).catch(() => {});
    });

    actor.start();
    void loadMappings();

    return () => {
      subscription.unsubscribe();
      actor.stop();
    };
  }, []);

  const startPairing = useCallback((clubs: { id: string; name: string }[]) => {
    console.log('[BLE] Starting pairing for', clubs.length, 'clubs');
    actorRef.current.send({ type: 'START_PAIRING', clubs });
  }, []);

  const bondDetectedDevice = useCallback(() => {
    console.log('[BLE] Bonding detected device');
    actorRef.current.send({ type: 'BOND_DEVICE' });
  }, []);

  const pairNext = useCallback(() => {
    console.log('[BLE] Moving to next club');
    actorRef.current.send({ type: 'PAIR_NEXT' });
  }, []);

  const startPlayMode = useCallback(() => {
    console.log('[BLE] Starting play mode');
    actorRef.current.send({ type: 'START_PLAY_MODE' });
  }, []);

  const stopPlayMode = useCallback(() => {
    console.log('[BLE] Stopping play mode');
    actorRef.current.send({ type: 'STOP_PLAY_MODE' });
  }, []);

  const startPracticeMode = useCallback((targetCount: number) => {
    console.log('[BLE] Starting practice mode, targets:', targetCount);
    actorRef.current.send({ type: 'START_PRACTICE_MODE', targetCount });
  }, []);

  const stopPracticeMode = useCallback(() => {
    console.log('[BLE] Stopping practice mode');
    actorRef.current.send({ type: 'STOP_PRACTICE_MODE' });
  }, []);

  const startUnpairing = useCallback((clubs: { id: string; name: string }[]) => {
    console.log('[BLE] Starting unpairing for', clubs.length, 'clubs');
    actorRef.current.send({ type: 'START_UNPAIRING', clubs });
  }, []);

  const unpairNext = useCallback(() => {
    console.log('[BLE] Moving to next unpair');
    actorRef.current.send({ type: 'UNPAIR_NEXT' });
  }, []);

  const cancel = useCallback(() => {
    console.log('[BLE] Cancelling current operation');
    actorRef.current.send({ type: 'CANCEL' });
  }, []);

  const retry = useCallback(() => {
    console.log('[BLE] Retrying');
    actorRef.current.send({ type: 'RETRY' });
  }, []);

  const isPairing = currentState.startsWith('pairing');
  const isPlayActive = currentState.startsWith('playMode');
  const isPracticeActive = currentState.startsWith('practiceMode');
  const isUnpairing = currentState.startsWith('unpairing');
  const isPairedComplete = currentState === 'pairedComplete' || sensorMappings.length >= 14;

  return useMemo(() => ({
    currentState,
    sensorMappings,
    error,
    pairingProgress,
    playMode,
    practiceMode,
    unpairingProgress,
    allPlayShots,
    initialized,
    isPairing,
    isPlayActive,
    isPracticeActive,
    isUnpairing,
    isPairedComplete,
    startPairing,
    bondDetectedDevice,
    pairNext,
    startPlayMode,
    stopPlayMode,
    startPracticeMode,
    stopPracticeMode,
    startUnpairing,
    unpairNext,
    cancel,
    retry,
  }), [
    currentState, sensorMappings, error, pairingProgress, playMode,
    practiceMode, unpairingProgress, allPlayShots, initialized,
    isPairing, isPlayActive, isPracticeActive, isUnpairing, isPairedComplete,
    startPairing, bondDetectedDevice, pairNext, startPlayMode, stopPlayMode,
    startPracticeMode, stopPracticeMode, startUnpairing, unpairNext, cancel, retry,
  ]);
});
