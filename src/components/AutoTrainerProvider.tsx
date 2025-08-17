'use client';

import { useEffect } from 'react';
import { startAutoTraining } from '../lib/autoTrainer';

export default function AutoTrainerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Start the automatic training system when the app loads
    const autoTrainer = startAutoTraining();
    
    // Log that auto-training is active
    console.log('🤖 Auto-training system activated - AI will train daily automatically');
    
    // Cleanup on unmount
    return () => {
      autoTrainer.stop();
    };
  }, []);

  return <>{children}</>;
}
