import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HoleInfo {
  number: number;
  par: number;
  index: number;
  distance: number;
}

export interface MockCourse {
  id: string;
  name: string;
  clubName: string;
  holes: HoleInfo[];
  totalPar: number;
}

export interface CourseLocation {
  latitude: number | null;
  longitude: number | null;
  address: string;
}

const DEFAULT_HOLES: HoleInfo[] = [
  { number: 1, par: 4, index: 1, distance: 350 },
  { number: 2, par: 4, index: 2, distance: 350 },
  { number: 3, par: 4, index: 3, distance: 350 },
  { number: 4, par: 3, index: 4, distance: 150 },
  { number: 5, par: 4, index: 5, distance: 350 },
  { number: 6, par: 4, index: 6, distance: 350 },
  { number: 7, par: 3, index: 7, distance: 150 },
  { number: 8, par: 5, index: 8, distance: 480 },
  { number: 9, par: 4, index: 9, distance: 380 },
  { number: 10, par: 4, index: 10, distance: 350 },
  { number: 11, par: 4, index: 11, distance: 350 },
  { number: 12, par: 4, index: 12, distance: 350 },
  { number: 13, par: 3, index: 13, distance: 150 },
  { number: 14, par: 5, index: 14, distance: 500 },
  { number: 15, par: 4, index: 15, distance: 370 },
  { number: 16, par: 4, index: 16, distance: 340 },
  { number: 17, par: 5, index: 17, distance: 490 },
  { number: 18, par: 4, index: 18, distance: 360 },
];

export const MOCK_COURSE: MockCourse = {
  id: 'default',
  name: 'Golf Course',
  clubName: 'Golf Club',
  holes: DEFAULT_HOLES,
  totalPar: DEFAULT_HOLES.reduce((sum, h) => sum + h.par, 0),
};

const STORAGE_KEY_COURSE_HOLES = 'play_setup_course_holes';
const STORAGE_KEY_COURSE = 'play_setup_selected_course';
const STORAGE_KEY_COURSE_LOCATION = 'play_setup_course_location';

export async function loadSelectedCourseHoles(): Promise<HoleInfo[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_COURSE_HOLES);
    if (stored) {
      const parsed = JSON.parse(stored) as { number: number; par: number; yardage: number; handicap: number }[];
      if (parsed.length > 0) {
        return parsed.map((h, idx) => ({
          number: h.number ?? idx + 1,
          par: h.par,
          index: h.handicap ?? idx + 1,
          distance: h.yardage ?? 0,
        }));
      }
    }
  } catch (e) {
    console.log('[courseData] Error loading course holes:', e);
  }
  return DEFAULT_HOLES;
}

export async function loadSelectedCourseName(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_COURSE);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.name ?? 'Golf Course';
    }
  } catch (e) {
    console.log('[courseData] Error loading course name:', e);
  }
  return 'Golf Course';
}

export async function loadCourseLocation(): Promise<CourseLocation | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_COURSE_LOCATION);
    if (stored) {
      return JSON.parse(stored) as CourseLocation;
    }
  } catch (e) {
    console.log('[courseData] Error loading course location:', e);
  }
  return null;
}

export function getHolesForOption(option: string, allHoles?: HoleInfo[]): HoleInfo[] {
  const holes = allHoles ?? DEFAULT_HOLES;
  switch (option) {
    case '9_first':
      return holes.filter((h) => h.number <= 9);
    case '9_back':
      return holes.filter((h) => h.number >= 10);
    case '18':
    default:
      return holes;
  }
}

export function getParForHoles(holes: HoleInfo[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}

export function getScoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double Bogey';
  if (diff === 3) return 'Triple Bogey';
  return `+${diff}`;
}

export function getToPar(totalScore: number, totalPar: number): string {
  const diff = totalScore - totalPar;
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}
