const API_BASE = 'https://api.golfcourseapi.com/v1';
const API_KEY = '4C5IEPDN323SRT23367YBA6DP4';

export interface GolfCourseSearchResult {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface GolfCourseHole {
  par: number;
  yardage: number;
  handicap: number;
}

export interface GolfCourseTee {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  bogey_rating: number;
  total_yards: number;
  total_meters: number;
  number_of_holes: number;
  par_total: number;
  holes: GolfCourseHole[];
}

export interface GolfCourseDetail {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  tees: {
    female?: GolfCourseTee[];
    male?: GolfCourseTee[];
  };
}

export async function searchGolfCourses(query: string): Promise<GolfCourseSearchResult[]> {
  try {
    console.log('[GolfCourseAPI] Searching for:', query);
    const response = await fetch(`${API_BASE}/search?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Key ${API_KEY}`,
      },
    });
    if (!response.ok) {
      console.log('[GolfCourseAPI] Search error:', response.status);
      return [];
    }
    const data = await response.json();
    console.log('[GolfCourseAPI] Search results:', data.courses?.length ?? 0);
    return data.courses ?? [];
  } catch (e) {
    console.log('[GolfCourseAPI] Search error:', e);
    return [];
  }
}

export async function getGolfCourseDetail(courseId: number): Promise<GolfCourseDetail | null> {
  try {
    console.log('[GolfCourseAPI] Fetching course detail:', courseId);
    const response = await fetch(`${API_BASE}/courses/${courseId}`, {
      headers: {
        'Authorization': `Key ${API_KEY}`,
      },
    });
    if (!response.ok) {
      console.log('[GolfCourseAPI] Detail error:', response.status);
      return null;
    }
    const data = await response.json();
    console.log('[GolfCourseAPI] Got course detail:', data.course?.course_name);
    return data.course ?? null;
  } catch (e) {
    console.log('[GolfCourseAPI] Detail error:', e);
    return null;
  }
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineDistanceKm(lat1, lon1, lat2, lon2);
}

export async function searchNearbyCourses(lat: number, lon: number): Promise<GolfCourseSearchResult[]> {
  try {
    console.log('[GolfCourseAPI] Searching nearby courses for:', lat, lon);
    const geoResp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`,
      { headers: { 'User-Agent': 'GolfersCrib/1.0' } }
    );
    const geoData = await geoResp.json();
    const city = geoData.address?.city || geoData.address?.town || geoData.address?.municipality || geoData.address?.village || '';
    const state = geoData.address?.state || '';
    const country = geoData.address?.country || '';
    console.log('[GolfCourseAPI] Reverse geocoded to:', city, state, country);

    let results: GolfCourseSearchResult[] = [];

    if (city) {
      results = await searchGolfCourses(city);
      console.log('[GolfCourseAPI] City search results:', results.length);
    }

    if (results.length === 0 && state) {
      results = await searchGolfCourses(state);
      console.log('[GolfCourseAPI] State search results:', results.length);
    }

    if (results.length === 0 && country) {
      results = await searchGolfCourses(country);
      console.log('[GolfCourseAPI] Country search results:', results.length);
    }

    if (results.length === 0) {
      results = await searchGolfCourses('golf club');
      console.log('[GolfCourseAPI] Fallback search results:', results.length);
    }

    results.sort((a, b) => {
      const distA = haversineDistanceKm(lat, lon, a.location?.latitude ?? 0, a.location?.longitude ?? 0);
      const distB = haversineDistanceKm(lat, lon, b.location?.latitude ?? 0, b.location?.longitude ?? 0);
      return distA - distB;
    });

    return results;
  } catch (e) {
    console.log('[GolfCourseAPI] Nearby search error:', e);
    return [];
  }
}

export function getDefaultMaleTee(course: GolfCourseDetail): GolfCourseTee | null {
  const maleTees = course.tees?.male;
  if (maleTees && maleTees.length > 0) {
    return maleTees[0];
  }
  const femaleTees = course.tees?.female;
  if (femaleTees && femaleTees.length > 0) {
    return femaleTees[0];
  }
  return null;
}
