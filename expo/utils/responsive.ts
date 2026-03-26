import { Dimensions, PixelRatio } from 'react-native';

const { width: DESIGN_WIDTH, height: DESIGN_HEIGHT } = { width: 375, height: 812 };

const { width: INITIAL_WIDTH, height: INITIAL_HEIGHT } = Dimensions.get('window');

const widthScale = INITIAL_WIDTH / DESIGN_WIDTH;
const heightScale = INITIAL_HEIGHT / DESIGN_HEIGHT;

export function wp(size: number): number {
  return PixelRatio.roundToNearestPixel(size * widthScale);
}

export function hp(size: number): number {
  return PixelRatio.roundToNearestPixel(size * heightScale);
}

export function fp(size: number): number {
  const scale = Math.min(widthScale, 1.3);
  return PixelRatio.roundToNearestPixel(size * Math.max(scale, 0.8));
}

export function sp(size: number): number {
  return PixelRatio.roundToNearestPixel(size * widthScale);
}

export function getScreenWidth(): number {
  return Dimensions.get('window').width;
}

export function getScreenHeight(): number {
  return Dimensions.get('window').height;
}

export const isSmallDevice = INITIAL_WIDTH < 375;
export const isMediumDevice = INITIAL_WIDTH >= 375 && INITIAL_WIDTH < 414;
export const isLargeDevice = INITIAL_WIDTH >= 414;

export function clampSize(size: number, min: number, max: number): number {
  return Math.min(Math.max(size, min), max);
}
