import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const BAG_STORAGE_KEY = 'user_golf_bag';

interface BagClubCategory {
  name: string;
  clubs: string[];
}

const ALL_CLUB_CATEGORIES: BagClubCategory[] = [
  {
    name: 'Woods',
    clubs: ['Dr', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w', '10w', '11w', '12w', '13w', '14w', '15w'],
  },
  {
    name: 'Hybrids',
    clubs: ['1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h'],
  },
  {
    name: 'Irons',
    clubs: ['1i', '2i', '3i', '4i', '5i', '6i', '7i', '8i', '9i', '10i', '11i', '12i', '13i', '14i', '15i'],
  },
  {
    name: 'Wedges',
    clubs: ['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw', '50°', '51°', '52°', '53°', '54°', '55°', '56°', '57°', '58°', '60°', '62°', '64°'],
  },
];

export { ALL_CLUB_CATEGORIES };

export const [BagProvider, useBag] = createContextHook(() => {
  const [bagClubs, setBagClubs] = useState<string[]>([]);
  const [hasBag, setHasBag] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(BAG_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          console.log('[BagContext] Loaded bag from storage:', parsed.length, 'clubs');
          setBagClubs(parsed);
          setHasBag(true);
        } else {
          console.log('[BagContext] No bag found in storage');
        }
      } catch (e: any) {
        console.log('[BagContext] Error loading bag:', e.message);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const saveBag = useCallback(async (clubs: string[]) => {
    const fullBag = clubs.includes('Pu') ? clubs : ['Pu', ...clubs];
    console.log('[BagContext] Saving bag:', fullBag.length, 'clubs');
    try {
      await AsyncStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(fullBag));
      setBagClubs(fullBag);
      setHasBag(true);
    } catch (e: any) {
      console.log('[BagContext] Error saving bag:', e.message);
    }
  }, []);

  const getOrderedBagClubs = useCallback((): string[] => {
    if (bagClubs.length === 0) return [];
    const ordered: string[] = [];
    if (bagClubs.includes('Pu')) ordered.push('Pu');

    const categoryOrder = ['Woods', 'Hybrids', 'Irons', 'Wedges'];
    for (const catName of categoryOrder) {
      const cat = ALL_CLUB_CATEGORIES.find((c) => c.name === catName);
      if (cat) {
        for (const club of cat.clubs) {
          if (bagClubs.includes(club)) {
            ordered.push(club);
          }
        }
      }
    }
    return ordered;
  }, [bagClubs]);

  return useMemo(() => ({
    bagClubs,
    hasBag,
    isLoading,
    saveBag,
    getOrderedBagClubs,
  }), [bagClubs, hasBag, isLoading, saveBag, getOrderedBagClubs]);
});
