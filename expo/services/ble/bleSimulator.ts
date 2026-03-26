import type { BLEDevice, ShotPayload } from './bleTypes';
import {
  RSSI_THRESHOLD,
  SETTLING_DELAY_MS,
} from './bleConfig';

let simulatedDeviceCounter = 0;

function generateSerialId(): string {
  simulatedDeviceCounter++;
  const hex = simulatedDeviceCounter.toString(16).padStart(4, '0').toUpperCase();
  return `GC-SNS-${hex}`;
}

function generateDeviceId(): string {
  const chars = 'ABCDEF0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 2 === 0) id += ':';
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function simulateScanForDevice(): Promise<BLEDevice> {
  console.log('[BLE-SIM] Scanning for nearby sensor...');
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2000));

  const device: BLEDevice = {
    id: generateDeviceId(),
    serialId: generateSerialId(),
    name: `GolfersCrib Sensor`,
    rssi: randomBetween(RSSI_THRESHOLD + 5, -30),
    bonded: false,
    batteryLevel: randomBetween(60, 100),
  };

  console.log('[BLE-SIM] Device detected:', device.serialId, 'RSSI:', device.rssi);
  return device;
}

export async function simulateBondDevice(device: BLEDevice): Promise<{ success: boolean; error?: string }> {
  console.log('[BLE-SIM] Bonding with device:', device.serialId);
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

  if (Math.random() < 0.95) {
    console.log('[BLE-SIM] Bond successful for:', device.serialId);
    return { success: true };
  }

  console.log('[BLE-SIM] Bond failed for:', device.serialId);
  return { success: false, error: 'Simulated bond failure' };
}

export async function simulateConnect(deviceId: string): Promise<boolean> {
  console.log('[BLE-SIM] Connecting to device:', deviceId);
  await new Promise((r) => setTimeout(r, SETTLING_DELAY_MS + Math.random() * 300));
  console.log('[BLE-SIM] Connected to:', deviceId);
  return true;
}

export async function simulateEnableNotifications(deviceId: string): Promise<boolean> {
  console.log('[BLE-SIM] Enabling notifications on:', deviceId);
  await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
  console.log('[BLE-SIM] Notifications enabled on:', deviceId);
  return true;
}

export async function simulateDisconnect(deviceId: string): Promise<void> {
  console.log('[BLE-SIM] Disconnecting:', deviceId);
  await new Promise((r) => setTimeout(r, 100));
  console.log('[BLE-SIM] Disconnected:', deviceId);
}

export function simulateParseShotData(clubId: string, clubName: string, sensorSerialId: string): ShotPayload {
  const clubSpeeds: Record<string, [number, number]> = {
    'Driver': [95, 120],
    '3-Wood': [90, 110],
    '5-Wood': [85, 105],
    '4-Hybrid': [80, 100],
    '5-Iron': [75, 95],
    '6-Iron': [72, 92],
    '7-Iron': [68, 88],
    '8-Iron': [64, 84],
    '9-Iron': [60, 80],
    'PW': [55, 75],
    'GW': [50, 70],
    'SW': [45, 65],
    'LW': [40, 60],
    'Putter': [5, 15],
  };

  const [minSpeed, maxSpeed] = clubSpeeds[clubName] ?? [60, 80];
  const swingSpeed = randomBetween(minSpeed, maxSpeed);
  const impactAngle = randomBetween(-5, 5);
  const launchAngle = randomBetween(8, 30);
  const spinRate = randomBetween(1500, 8000);
  const carry = Math.round(swingSpeed * (1.8 + Math.random() * 0.4));
  const total = carry + randomBetween(5, 25);

  const rawBytes = new Uint8Array(20);
  rawBytes[0] = 0x5A;
  rawBytes[1] = swingSpeed;
  rawBytes[2] = impactAngle + 128;
  rawBytes[3] = launchAngle;

  const shot: ShotPayload = {
    sensorSerialId,
    clubId,
    clubName,
    rawBytes,
    timestamp: Date.now(),
    swingSpeed,
    impactAngle,
    launchAngle,
    spinRate,
    carry,
    total,
  };

  console.log('[BLE-SIM] Parsed shot:', clubName, swingSpeed + 'mph', carry + 'y carry');
  return shot;
}

export async function simulateFirmwareReset(deviceId: string): Promise<boolean> {
  console.log('[BLE-SIM] Sending firmware reset to:', deviceId);
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
  console.log('[BLE-SIM] Firmware reset sent to:', deviceId);
  return true;
}

export async function simulateAwaitFirmwareConfirmation(deviceId: string): Promise<boolean> {
  console.log('[BLE-SIM] Awaiting firmware confirmation from:', deviceId);
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
  console.log('[BLE-SIM] Firmware confirmation received from:', deviceId);
  return true;
}

export async function simulateRemoveOSBond(deviceId: string): Promise<boolean> {
  console.log('[BLE-SIM] Removing OS bond for:', deviceId);
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
  console.log('[BLE-SIM] OS bond removed for:', deviceId);
  return true;
}

export async function simulateCheckBluetoothPower(): Promise<boolean> {
  console.log('[BLE-SIM] Checking Bluetooth power state...');
  await new Promise((r) => setTimeout(r, 100));
  console.log('[BLE-SIM] Bluetooth is powered ON');
  return true;
}
