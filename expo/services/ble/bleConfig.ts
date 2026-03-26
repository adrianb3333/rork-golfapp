// ============================================================
// BLE CONFIGURATION — SINGLE SOURCE OF TRUTH
// ============================================================
// When you receive real sensors, update the values below.
// Flip USE_SIMULATOR to false to switch from simulated BLE
// to the real react-native-ble-plx library.
// ============================================================

// ---- MODE TOGGLE ----
// true  = uses bleSimulator.ts (no real hardware needed)
// false = uses react-native-ble-plx (requires dev build)
export const USE_SIMULATOR = true;

// ---- GOLFER'S CRIB SENSOR SERVICE & CHARACTERISTICS ----
// Replace these with your real sensor firmware UUIDs
export const BLE_SERVICE_UUID = '0000180D-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_SHOT_DATA = '00002A37-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_FIRMWARE_RESET = '00002A38-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_BATTERY = '00002A19-0000-1000-8000-00805F9B34FB';

// ---- SCAN / CONNECTION TUNING ----
export const SETTLING_DELAY_MS = 200;
export const SCAN_TIMEOUT_MS = 15000;
export const BOND_TIMEOUT_MS = 10000;
export const RSSI_THRESHOLD = -55;

// ---- PLAY MODE ----
export const GPS_DUPLICATE_DISTANCE_M = 3;

// ---- SENSOR COUNTS ----
export const TOTAL_SENSORS = 14;

// ---- DEVICE NAME PREFIX (used to filter scan results) ----
export const DEVICE_NAME_PREFIX = 'GolfersCrib';

// ---- LOGGING ----
export const BLE_DEBUG = __DEV__;
