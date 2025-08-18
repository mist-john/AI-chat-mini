'use client';

import { useEffect } from 'react';

export default function AutoTrainerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const initializeAutoTraining = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { startAutoTraining } = await import('../lib/autoTrainer');
        
        // Start the automatic training system when the app loads
        const autoTrainer = startAutoTraining();

        // Log that auto-training is active
        console.log('✅ Auto-training system activated - AI will train daily automatically');
        
        // Cleanup on unmount
        return () => {
          try {
            autoTrainer.stop();
          } catch (error) {
            console.warn('Error stopping auto-trainer:', error);
          }
        };
      } catch (error) {
        console.warn('Failed to initialize auto-training system:', error);
        // Don't crash the app if auto-training fails
      }
    };

    initializeAutoTraining();
  }, []);

  return <>{children}</>;
}
