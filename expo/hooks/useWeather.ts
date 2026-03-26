import { useState, useEffect, useCallback } from 'react';
import { fetchGolfWeather, GolfWeatherData } from '../services/weatherApi';

export const useWeather = (lat: number | null, lon: number | null, targetHeading: number = 0) => {
  const [weather, setWeather] = useState<GolfWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (lat === null || lon === null) {
      setLoading(false);
      setError("Location not available");
      return;
    }
    setLoading(true);
    const result = await fetchGolfWeather(lat, lon, targetHeading);
    if (result) {
      setWeather(result);
      setError(null);
    } else {
      setError("Failed to fetch weather");
    }
    setLoading(false);
  }, [lat, lon, targetHeading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { weather, loading, error, refresh: loadData };
};
