import { setup, assign, fromPromise } from 'xstate';
import type {
  BLEDevice,
  SensorMapping,
  ShotPayload,
  PairingProgress,
  PlayModeState,
  PracticeModeState,
  UnpairingProgress,
} from './bleTypes';
import {
  simulateScanForDevice,
  simulateBondDevice,
  simulateConnect,
  simulateEnableNotifications,
  simulateDisconnect,
  simulateParseShotData,
  simulateFirmwareReset,
  simulateAwaitFirmwareConfirmation,
  simulateRemoveOSBond,
  simulateCheckBluetoothPower,
} from './bleSimulator';

interface BLEMachineContext {
  bluetoothReady: boolean;
  sensorMappings: SensorMapping[];
  error: string | null;

  pairingClubs: { id: string; name: string }[];
  pairingIndex: number;
  pairingProgress: PairingProgress;
  detectedDevice: BLEDevice | null;

  playMode: PlayModeState;
  allPlayShots: ShotPayload[];

  practiceMode: PracticeModeState;

  unpairingClubs: { id: string; name: string }[];
  unpairingIndex: number;
  unpairingProgress: UnpairingProgress;
}

type BLEMachineEvent =
  | { type: 'START_PAIRING'; clubs: { id: string; name: string }[] }
  | { type: 'BOND_DEVICE' }
  | { type: 'PAIR_NEXT' }
  | { type: 'START_PLAY_MODE' }
  | { type: 'STOP_PLAY_MODE' }
  | { type: 'START_PRACTICE_MODE'; targetCount: number }
  | { type: 'STOP_PRACTICE_MODE' }
  | { type: 'START_UNPAIRING'; clubs: { id: string; name: string }[] }
  | { type: 'UNPAIR_NEXT' }
  | { type: 'CANCEL' }
  | { type: 'RETRY' };

const initialContext: BLEMachineContext = {
  bluetoothReady: false,
  sensorMappings: [],
  error: null,

  pairingClubs: [],
  pairingIndex: 0,
  pairingProgress: {
    totalClubs: 0,
    pairedCount: 0,
    currentClubId: null,
    currentClubName: null,
    detectedDevice: null,
  },
  detectedDevice: null,

  playMode: {
    connectedSensors: 0,
    totalSensors: 14,
    shotsReceived: 0,
    lastShot: null,
    isScanning: false,
  },
  allPlayShots: [],

  practiceMode: {
    targetCount: 0,
    remainingShots: 0,
    completedPairs: 0,
    shots: [],
    isComplete: false,
  },

  unpairingClubs: [],
  unpairingIndex: 0,
  unpairingProgress: {
    totalToUnpair: 0,
    unpairedCount: 0,
    currentClubId: null,
    currentClubName: null,
    currentStep: 'idle',
  },
};

const checkBluetooth = fromPromise(async () => {
  const ready = await simulateCheckBluetoothPower();
  if (!ready) throw new Error('Bluetooth not powered on');
  return ready;
});

const scanForDevice = fromPromise(async () => {
  return await simulateScanForDevice();
});

const bondDevice = fromPromise(async ({ input }: { input: { device: BLEDevice } }) => {
  const result = await simulateBondDevice(input.device);
  if (!result.success) throw new Error(result.error || 'Bond failed');
  return input.device;
});

const connectAndReceiveShot = fromPromise(async ({ input }: { input: { mappings: SensorMapping[] } }) => {
  const randomMapping = input.mappings[Math.floor(Math.random() * input.mappings.length)];
  if (!randomMapping) throw new Error('No sensor mappings available');

  await simulateConnect(randomMapping.deviceId);
  await simulateEnableNotifications(randomMapping.deviceId);

  const shot = simulateParseShotData(
    randomMapping.clubId,
    randomMapping.clubName,
    randomMapping.sensorSerialId,
  );

  await simulateDisconnect(randomMapping.deviceId);
  return shot;
});

const firmwareReset = fromPromise(async ({ input }: { input: { deviceId: string } }) => {
  await simulateFirmwareReset(input.deviceId);
  await simulateAwaitFirmwareConfirmation(input.deviceId);
  return true;
});

const removeOSBond = fromPromise(async ({ input }: { input: { deviceId: string } }) => {
  await simulateRemoveOSBond(input.deviceId);
  return true;
});

const disconnectDevice = fromPromise(async ({ input }: { input: { deviceId: string } }) => {
  await simulateDisconnect(input.deviceId);
  return true;
});

export const bleMachine = setup({
  types: {
    context: {} as BLEMachineContext,
    events: {} as BLEMachineEvent,
  },
  actors: {
    checkBluetooth,
    scanForDevice,
    bondDevice,
    connectAndReceiveShot,
    firmwareReset,
    removeOSBond,
    disconnectDevice,
  },
}).createMachine({
  id: 'bleLogicEngine',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        START_PAIRING: {
          target: 'pairing',
          actions: assign({
            pairingClubs: ({ event }) => event.clubs,
            pairingIndex: () => 0,
            pairingProgress: ({ event }) => ({
              totalClubs: event.clubs.length,
              pairedCount: 0,
              currentClubId: event.clubs[0]?.id ?? null,
              currentClubName: event.clubs[0]?.name ?? null,
              detectedDevice: null,
            }),
            detectedDevice: () => null,
            error: () => null,
          }),
        },
        START_PLAY_MODE: {
          target: 'playMode.checkingBluetooth',
          actions: assign({
            error: () => null,
            playMode: ({ context }) => ({
              ...context.playMode,
              shotsReceived: 0,
              lastShot: null,
              isScanning: false,
            }),
            allPlayShots: () => [],
          }),
        },
        START_PRACTICE_MODE: {
          target: 'practiceMode.active',
          actions: assign({
            error: () => null,
            practiceMode: ({ event }) => ({
              targetCount: event.targetCount,
              remainingShots: event.targetCount * 2,
              completedPairs: 0,
              shots: [],
              isComplete: false,
            }),
          }),
        },
        START_UNPAIRING: {
          target: 'unpairing',
          actions: assign({
            unpairingClubs: ({ event }) => event.clubs,
            unpairingIndex: () => 0,
            unpairingProgress: ({ event }) => ({
              totalToUnpair: event.clubs.length,
              unpairedCount: 0,
              currentClubId: event.clubs[0]?.id ?? null,
              currentClubName: event.clubs[0]?.name ?? null,
              currentStep: 'idle' as const,
            }),
            error: () => null,
          }),
        },
      },
    },

    pairing: {
      initial: 'scanning',
      states: {
        scanning: {
          invoke: {
            src: 'scanForDevice',
            onDone: {
              target: 'detected',
              actions: assign({
                detectedDevice: ({ event }) => event.output,
                pairingProgress: ({ context, event }) => ({
                  ...context.pairingProgress,
                  detectedDevice: event.output,
                }),
              }),
            },
            onError: {
              target: 'scanError',
              actions: assign({
                error: ({ event }) => (event.error as Error).message,
              }),
            },
          },
        },

        detected: {
          on: {
            BOND_DEVICE: {
              target: 'bonding',
            },
            CANCEL: {
              target: '#bleLogicEngine.idle',
            },
          },
        },

        bonding: {
          invoke: {
            src: 'bondDevice',
            input: ({ context }) => ({ device: context.detectedDevice! }),
            onDone: {
              target: 'bondSuccess',
              actions: assign({
                sensorMappings: ({ context }) => {
                  const club = context.pairingClubs[context.pairingIndex];
                  const device = context.detectedDevice!;
                  const mapping: SensorMapping = {
                    sensorSerialId: device.serialId,
                    clubId: club?.id ?? '',
                    clubName: club?.name ?? '',
                    bondedAt: Date.now(),
                    deviceId: device.id,
                  };
                  console.log('[BLE-Machine] Mapped sensor', device.serialId, '->', club?.name);
                  return [...context.sensorMappings, mapping];
                },
                pairingProgress: ({ context }) => ({
                  ...context.pairingProgress,
                  pairedCount: context.pairingProgress.pairedCount + 1,
                }),
              }),
            },
            onError: {
              target: 'bondError',
              actions: assign({
                error: ({ event }) => (event.error as Error).message,
              }),
            },
          },
        },

        bondSuccess: {
          always: [
            {
              target: 'complete',
              guard: ({ context }) => context.pairingIndex + 1 >= context.pairingClubs.length,
            },
            {
              target: 'awaitNext',
            },
          ],
        },

        awaitNext: {
          on: {
            PAIR_NEXT: {
              target: 'scanning',
              actions: assign({
                pairingIndex: ({ context }) => context.pairingIndex + 1,
                detectedDevice: () => null,
                pairingProgress: ({ context }) => {
                  const nextIdx = context.pairingIndex + 1;
                  const nextClub = context.pairingClubs[nextIdx];
                  return {
                    ...context.pairingProgress,
                    currentClubId: nextClub?.id ?? null,
                    currentClubName: nextClub?.name ?? null,
                    detectedDevice: null,
                  };
                },
              }),
            },
            CANCEL: {
              target: '#bleLogicEngine.idle',
            },
          },
        },

        complete: {
          type: 'final' as const,
        },

        scanError: {
          on: {
            RETRY: { target: 'scanning' },
            CANCEL: { target: '#bleLogicEngine.idle' },
          },
        },

        bondError: {
          on: {
            RETRY: { target: 'scanning' },
            CANCEL: { target: '#bleLogicEngine.idle' },
          },
        },
      },

      onDone: {
        target: 'pairingVerification',
      },
    },

    pairingVerification: {
      always: [
        {
          target: 'pairedComplete',
          guard: ({ context }) =>
            context.sensorMappings.length >= context.pairingClubs.length,
        },
        {
          target: 'idle',
          actions: assign({
            error: () => 'Verification failed: not all sensors paired',
          }),
        },
      ],
    },

    pairedComplete: {
      on: {
        CANCEL: { target: 'idle' },
        START_PLAY_MODE: {
          target: 'playMode.checkingBluetooth',
          actions: assign({
            error: () => null,
            playMode: ({ context }) => ({
              ...context.playMode,
              shotsReceived: 0,
              lastShot: null,
              isScanning: false,
            }),
            allPlayShots: () => [],
          }),
        },
        START_PRACTICE_MODE: {
          target: 'practiceMode.active',
          actions: assign({
            error: () => null,
            practiceMode: ({ event }) => ({
              targetCount: event.targetCount,
              remainingShots: event.targetCount * 2,
              completedPairs: 0,
              shots: [],
              isComplete: false,
            }),
          }),
        },
        START_UNPAIRING: {
          target: 'unpairing',
          actions: assign({
            unpairingClubs: ({ event }) => event.clubs,
            unpairingIndex: () => 0,
            unpairingProgress: ({ event }) => ({
              totalToUnpair: event.clubs.length,
              unpairedCount: 0,
              currentClubId: event.clubs[0]?.id ?? null,
              currentClubName: event.clubs[0]?.name ?? null,
              currentStep: 'idle' as const,
            }),
            error: () => null,
          }),
        },
      },
    },

    playMode: {
      initial: 'checkingBluetooth',
      states: {
        checkingBluetooth: {
          invoke: {
            src: 'checkBluetooth',
            onDone: {
              target: 'backgroundScanning',
              actions: assign({
                bluetoothReady: () => true,
                playMode: ({ context }) => ({
                  ...context.playMode,
                  isScanning: true,
                }),
              }),
            },
            onError: {
              target: 'btError',
              actions: assign({
                error: () => 'Bluetooth is not powered on',
              }),
            },
          },
        },

        backgroundScanning: {
          invoke: {
            src: 'connectAndReceiveShot',
            input: ({ context }) => ({ mappings: context.sensorMappings }),
            onDone: {
              target: 'processingShot',
              actions: assign({
                playMode: ({ context, event }) => ({
                  ...context.playMode,
                  shotsReceived: context.playMode.shotsReceived + 1,
                  lastShot: {
                    ...event.output,
                    latitude: 0,
                    longitude: 0,
                    holeNumber: null,
                    distanceToPin: null,
                    isDuplicate: false,
                    shotType: 'play' as const,
                  },
                }),
                allPlayShots: ({ context, event }) => [...context.allPlayShots, event.output],
              }),
            },
            onError: {
              target: 'backgroundScanning',
            },
          },
          on: {
            STOP_PLAY_MODE: {
              target: '#bleLogicEngine.idle',
              actions: assign({
                playMode: ({ context }) => ({
                  ...context.playMode,
                  isScanning: false,
                }),
              }),
            },
          },
        },

        processingShot: {
          after: {
            500: {
              target: 'backgroundScanning',
            },
          },
          on: {
            STOP_PLAY_MODE: {
              target: '#bleLogicEngine.idle',
              actions: assign({
                playMode: ({ context }) => ({
                  ...context.playMode,
                  isScanning: false,
                }),
              }),
            },
          },
        },

        btError: {
          on: {
            RETRY: { target: 'checkingBluetooth' },
            STOP_PLAY_MODE: { target: '#bleLogicEngine.idle' },
          },
        },
      },
    },

    practiceMode: {
      initial: 'active',
      states: {
        active: {
          invoke: {
            src: 'connectAndReceiveShot',
            input: ({ context }) => ({ mappings: context.sensorMappings }),
            onDone: {
              target: 'shotReceived',
              actions: assign({
                practiceMode: ({ context, event }) => {
                  const remaining = context.practiceMode.remainingShots - 1;
                  const shots = [...context.practiceMode.shots, event.output];
                  const pairs = Math.floor(shots.length / 2);
                  return {
                    ...context.practiceMode,
                    remainingShots: remaining,
                    completedPairs: pairs,
                    shots,
                    isComplete: remaining <= 0,
                  };
                },
              }),
            },
            onError: {
              target: 'active',
            },
          },
          on: {
            STOP_PRACTICE_MODE: {
              target: 'drillComplete',
              actions: assign({
                practiceMode: ({ context }) => ({
                  ...context.practiceMode,
                  isComplete: true,
                }),
              }),
            },
          },
        },

        shotReceived: {
          always: [
            {
              target: 'drillComplete',
              guard: ({ context }) => context.practiceMode.remainingShots <= 0,
            },
            {
              target: 'active',
            },
          ],
        },

        drillComplete: {
          type: 'final' as const,
        },
      },
      onDone: {
        target: 'idle',
      },
    },

    unpairing: {
      initial: 'resettingFirmware',
      states: {
        resettingFirmware: {
          entry: assign({
            unpairingProgress: ({ context }) => ({
              ...context.unpairingProgress,
              currentStep: 'resetting_firmware' as const,
            }),
          }),
          invoke: {
            src: 'firmwareReset',
            input: ({ context }) => {
              const club = context.unpairingClubs[context.unpairingIndex];
              const mapping = context.sensorMappings.find((m) => m.clubId === club?.id);
              return { deviceId: mapping?.deviceId ?? '' };
            },
            onDone: {
              target: 'removingBond',
            },
            onError: {
              target: 'unpairError',
              actions: assign({
                error: ({ event }) => (event.error as Error).message,
              }),
            },
          },
        },

        removingBond: {
          entry: assign({
            unpairingProgress: ({ context }) => ({
              ...context.unpairingProgress,
              currentStep: 'removing_bond' as const,
            }),
          }),
          invoke: {
            src: 'removeOSBond',
            input: ({ context }) => {
              const club = context.unpairingClubs[context.unpairingIndex];
              const mapping = context.sensorMappings.find((m) => m.clubId === club?.id);
              return { deviceId: mapping?.deviceId ?? '' };
            },
            onDone: {
              target: 'disconnecting',
            },
            onError: {
              target: 'disconnecting',
            },
          },
        },

        disconnecting: {
          entry: assign({
            unpairingProgress: ({ context }) => ({
              ...context.unpairingProgress,
              currentStep: 'disconnecting' as const,
            }),
          }),
          invoke: {
            src: 'disconnectDevice',
            input: ({ context }) => {
              const club = context.unpairingClubs[context.unpairingIndex];
              const mapping = context.sensorMappings.find((m) => m.clubId === club?.id);
              return { deviceId: mapping?.deviceId ?? '' };
            },
            onDone: {
              target: 'unpairSuccess',
              actions: assign({
                sensorMappings: ({ context }) => {
                  const club = context.unpairingClubs[context.unpairingIndex];
                  return context.sensorMappings.filter((m) => m.clubId !== club?.id);
                },
                unpairingProgress: ({ context }) => ({
                  ...context.unpairingProgress,
                  unpairedCount: context.unpairingProgress.unpairedCount + 1,
                  currentStep: 'idle' as const,
                }),
              }),
            },
            onError: {
              target: 'unpairError',
              actions: assign({
                error: ({ event }) => (event.error as Error).message,
              }),
            },
          },
        },

        unpairSuccess: {
          always: [
            {
              target: 'unpairComplete',
              guard: ({ context }) =>
                context.unpairingIndex + 1 >= context.unpairingClubs.length,
            },
            {
              target: 'awaitNextUnpair',
            },
          ],
        },

        awaitNextUnpair: {
          on: {
            UNPAIR_NEXT: {
              target: 'resettingFirmware',
              actions: assign({
                unpairingIndex: ({ context }) => context.unpairingIndex + 1,
                unpairingProgress: ({ context }) => {
                  const nextIdx = context.unpairingIndex + 1;
                  const nextClub = context.unpairingClubs[nextIdx];
                  return {
                    ...context.unpairingProgress,
                    currentClubId: nextClub?.id ?? null,
                    currentClubName: nextClub?.name ?? null,
                    currentStep: 'idle' as const,
                  };
                },
              }),
            },
            CANCEL: { target: '#bleLogicEngine.idle' },
          },
        },

        unpairComplete: {
          type: 'final' as const,
        },

        unpairError: {
          on: {
            RETRY: { target: 'resettingFirmware' },
            CANCEL: { target: '#bleLogicEngine.idle' },
          },
        },
      },
      onDone: {
        target: 'idle',
      },
    },
  },
});

export type BLEMachineSnapshot = ReturnType<typeof bleMachine.getInitialSnapshot>;
