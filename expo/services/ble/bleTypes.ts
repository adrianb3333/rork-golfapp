export const BLE_SERVICE_UUID = '0000180D-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_SHOT_DATA = '00002A37-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_FIRMWARE_RESET = '00002A38-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_BATTERY = '00002A19-0000-1000-8000-00805F9B34FB';

export const SETTLING_DELAY_MS = 200;
export const SCAN_TIMEOUT_MS = 15000;
export const BOND_TIMEOUT_MS = 10000;
export const RSSI_THRESHOLD = -55;
export const GPS_DUPLICATE_DISTANCE_M = 3;

export interface BLEDevice {
  id: string;
  serialId: string;
  name: string;
  rssi: number;
  bonded: boolean;
  batteryLevel: number;
}

export interface SensorMapping {
  sensorSerialId: string;
  clubId: string;
  clubName: string;
  bondedAt: number;
  deviceId: string;
}

export interface ShotPayload {
  sensorSerialId: string;
  clubId: string;
  clubName: string;
  rawBytes: Uint8Array;
  timestamp: number;
  swingSpeed: number;
  impactAngle: number;
  launchAngle: number;
  spinRate: number;
  carry: number;
  total: number;
}

export interface EnrichedShot extends ShotPayload {
  latitude: number;
  longitude: number;
  holeNumber: number | null;
  distanceToPin: number | null;
  isDuplicate: boolean;
  shotType: 'play' | 'practice';
}

export interface PairingProgress {
  totalClubs: number;
  pairedCount: number;
  currentClubId: string | null;
  currentClubName: string | null;
  detectedDevice: BLEDevice | null;
}

export interface PlayModeState {
  connectedSensors: number;
  totalSensors: number;
  shotsReceived: number;
  lastShot: EnrichedShot | null;
  isScanning: boolean;
}

export interface PracticeModeState {
  targetCount: number;
  remainingShots: number;
  completedPairs: number;
  shots: ShotPayload[];
  isComplete: boolean;
}

export interface UnpairingProgress {
  totalToUnpair: number;
  unpairedCount: number;
  currentClubId: string | null;
  currentClubName: string | null;
  currentStep: 'idle' | 'resetting_firmware' | 'awaiting_confirmation' | 'removing_bond' | 'disconnecting';
}

export type BLEMachineEvent =
  | { type: 'START_PAIRING'; clubs: { id: string; name: string }[] }
  | { type: 'DEVICE_DETECTED'; device: BLEDevice }
  | { type: 'BOND_DEVICE'; clubId: string; clubName: string }
  | { type: 'BOND_SUCCESS'; sensorSerialId: string; deviceId: string }
  | { type: 'BOND_FAILURE'; error: string }
  | { type: 'PAIR_NEXT' }
  | { type: 'PAIRING_COMPLETE' }
  | { type: 'START_PLAY_MODE' }
  | { type: 'DEVICE_CONNECTED'; deviceId: string }
  | { type: 'NOTIFICATIONS_ENABLED'; deviceId: string }
  | { type: 'DATA_RECEIVED'; payload: ShotPayload }
  | { type: 'TERMINATE_LINK'; deviceId: string }
  | { type: 'STOP_PLAY_MODE' }
  | { type: 'START_PRACTICE_MODE'; targetCount: number }
  | { type: 'PRACTICE_SHOT_RECEIVED'; payload: ShotPayload }
  | { type: 'DRILL_COMPLETE' }
  | { type: 'STOP_PRACTICE_MODE' }
  | { type: 'START_UNPAIRING'; clubs: { id: string; name: string }[] }
  | { type: 'UNPAIR_NEXT' }
  | { type: 'FIRMWARE_RESET_SENT' }
  | { type: 'FIRMWARE_RESET_CONFIRMED' }
  | { type: 'OS_BOND_REMOVED' }
  | { type: 'DEVICE_DISCONNECTED' }
  | { type: 'UNPAIR_COMPLETE' }
  | { type: 'CANCEL' }
  | { type: 'ERROR'; error: string }
  | { type: 'BT_POWER_ON' }
  | { type: 'BT_POWER_OFF' };
