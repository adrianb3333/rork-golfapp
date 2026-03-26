import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

const BUFFER_SIZE = 5;
const CHANGE_THRESHOLD = 1;

function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0;
  let sinSum = 0;
  let cosSum = 0;
  for (const a of angles) {
    const rad = (a * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  let mean = (Math.atan2(sinSum / angles.length, cosSum / angles.length) * 180) / Math.PI;
  if (mean < 0) mean += 360;
  return mean;
}

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function useDeviceHeading() {
  const [heading, setHeading] = useState<number>(0);
  const bufferRef = useRef<number[]>([]);
  const lastEmittedRef = useRef<number>(0);

  const processHeading = useCallback((raw: number) => {
    const buf = bufferRef.current;
    buf.push(raw);
    if (buf.length > BUFFER_SIZE) buf.shift();

    const smoothed = circularMean(buf);

    if (angleDiff(smoothed, lastEmittedRef.current) >= CHANGE_THRESHOLD) {
      lastEmittedRef.current = smoothed;
      setHeading(smoothed);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('[useDeviceHeading] Web platform, using static 0 heading');
      return;
    }

    let sub: Location.LocationSubscription | null = null;

    const setup = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('[useDeviceHeading] Permission denied');
          return;
        }

        sub = await Location.watchHeadingAsync((data) => {
          if (data.trueHeading >= 0) {
            processHeading(data.trueHeading);
          } else if (data.magHeading >= 0) {
            processHeading(data.magHeading);
          }
        });

        console.log('[useDeviceHeading] Heading watch started');
      } catch (e) {
        console.error('[useDeviceHeading] Error:', e);
      }
    };

    setup();

    return () => {
      if (sub) {
        console.log('[useDeviceHeading] Cleaning up');
        sub.remove();
      }
    };
  }, [processHeading]);

  return heading;
}
