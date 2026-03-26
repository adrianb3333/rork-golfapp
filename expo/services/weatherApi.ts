const API_KEY = 'ac48bcd050d84bb9816175607260401';
const BASE_URL = 'https://api.weatherapi.com/v1/current.json';

export interface GolfWeatherData {
  location: string;
  temp: number;
  windMs: number;
  gustMs: number;
  windDeg: number;
  windDir: string;
  seaLevel: number;
  pressureMb: number;
  headTail: number;
  cross: number;
  lastUpdated: string;
}

export const fetchGolfWeather = async (
  lat: number,
  lon: number,
  targetHeading: number = 0
): Promise<GolfWeatherData | null> => {
  try {
    const query = `${lat},${lon}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${BASE_URL}?key=${API_KEY}&q=${query}&aqi=no`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('weatherAPI HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    // Basic Measures
    const windMs = parseFloat((data.current.wind_kph / 3.6).toFixed(1));
    const gustMs = parseFloat((data.current.gust_kph / 3.6).toFixed(1));
    const windDeg = data.current.wind_degree;
    
    // Sea Level Calculation (Estimate based on pressure in meters)
    // Standard pressure is 1013.25 mb. 1mb drop is roughly 9 meters.
    const seaLevelEstimate = Math.round((1013.25 - data.current.pressure_mb) * 9);

    // Wind vector decomposition is now done on-device in real-time
    // using decomposeWind() from golfCalculations.ts.
    // We still compute a default here for consumers that don't track heading.
    const relativeAngleRad = ((windDeg - targetHeading) * Math.PI) / 180;
    const headTail = parseFloat((windMs * Math.cos(relativeAngleRad)).toFixed(1));
    const cross = parseFloat((windMs * Math.sin(relativeAngleRad)).toFixed(1));

    return {
      location: data.location.name,
      temp: Math.round(data.current.temp_c),
      windMs,
      gustMs,
      windDeg,
      windDir: data.current.wind_dir,
      seaLevel: seaLevelEstimate,
      pressureMb: data.current.pressure_mb,
      headTail,
      cross,
      lastUpdated: data.current.last_updated.split(' ')[1],
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.log('weatherAPI error: Request timed out');
    } else {
      console.log('weatherAPI error:', error?.message || error);
    }
    return null;
  }
};
