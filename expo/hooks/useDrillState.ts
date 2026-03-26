import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface DrillHistory {
  totalMade: number;
  rounds: number;
}

export const useDrillState = (stepCount: number = 3) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const [history, setHistory] = useState<DrillHistory[]>(
    Array(stepCount).fill(null).map(() => ({ totalMade: 0, rounds: 0 }))
  );

  const saveScore = useCallback(async (drillName: string, score: number, stepLabel?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fullName = stepLabel ? `${drillName} - ${stepLabel}` : drillName;
      
      await supabase.from('golf_drills').insert([{
        user_id: user.id,
        drill_name: fullName,
        score
      }]);
    } catch (err) {
      console.error('Error saving drill:', err);
    }
  }, []);

  const updateScore = useCallback((stepIndex: number, scorePercent: number, madeCount: number) => {
    setScores(prev => {
      const newScores = [...prev];
      newScores[stepIndex] = scorePercent;
      return newScores;
    });
    
    setHistory(prev => {
      const newHistory = [...prev];
      newHistory[stepIndex] = {
        totalMade: newHistory[stepIndex].totalMade + madeCount,
        rounds: newHistory[stepIndex].rounds + 1
      };
      return newHistory;
    });
  }, []);

  const restart = useCallback(() => {
    setScores([]);
    setStep(0);
    setRoundCount(prev => prev + 1);
  }, []);

  return {
    step,
    setStep,
    scores,
    isStarted,
    setIsStarted,
    roundCount,
    history,
    saveScore,
    updateScore,
    restart
  };
};
