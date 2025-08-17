class AutoTrainer {
  private static instance: AutoTrainer;
  private isRunning: boolean = false;
  private lastTrainingTime: number = 0;
  private trainingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeTraining();
  }

  public static getInstance(): AutoTrainer {
    if (!AutoTrainer.instance) {
      AutoTrainer.instance = new AutoTrainer();
    }
    return AutoTrainer.instance;
  }

  private async initializeTraining() {
    // -----------------------------Check if we need to train on startup-----------------------------//
    await this.checkAndTrainIfNeeded();
    
    // -----------------------------Set up daily training interval (every 24 hours)-----------------------------//
    this.trainingInterval = setInterval(async () => {
      await this.performDailyTraining();
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    // -----------------------------Also check every hour to ensure we don't miss training-----------------------------//
    setInterval(async () => {
      await this.checkAndTrainIfNeeded();
    }, 60 * 60 * 1000); // 1 hour in milliseconds
  }

  private async checkAndTrainIfNeeded(): Promise<void> {
    try {
      // -----------------------------Only run in browser environment-----------------------------//
      if (typeof window === 'undefined') return;
      
      const response = await fetch('/api/training/auto-train', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && !data.status.isUpToDate) {
          console.log('Training is outdated, performing automatic training...');
          await this.performDailyTraining();
        }
      }
    } catch (error) {
      console.error('Error checking training status:', error);
    }
  }

  private async performDailyTraining(): Promise<void> {
    if (this.isRunning) {
      console.log('Training already in progress, skipping...');
      return;
    }

    // -----------------------------Only run in browser environment-----------------------------//
    if (typeof window === 'undefined') return;

    this.isRunning = true;
    console.log('Starting automatic daily training...');

    try {
      const response = await fetch('/api/training/auto-train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTO_TRAIN_SECRET || 'default-secret'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.lastTrainingTime = Date.now();
        console.log('Automatic daily training completed successfully:', data.message);
        
        // -----------------------------Store training completion in localStorage for UI feedback-----------------------------//
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastAutoTraining', new Date().toISOString());
          localStorage.setItem('autoTrainingStatus', 'success');
        }
      } else {
        throw new Error('Training request failed');
      }
    } catch (error) {
      console.error('Automatic training failed:', error);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('autoTrainingStatus', 'error');
      }
    } finally {
      this.isRunning = false;
    }
  }

  public async forceTraining(): Promise<void> {
    console.log('Force training requested...');
    await this.performDailyTraining();
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastTrainingTime: this.lastTrainingTime,
      isUpToDate: Date.now() - this.lastTrainingTime < 24 * 60 * 60 * 1000,
    };
  }

  public stop() {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = null;
    }
  }
}

// -----------------------------Export singleton instance-----------------------------//
export const autoTrainer = AutoTrainer.getInstance();

// -----------------------------Function to start auto-training (call this in your app)-----------------------------//
export function startAutoTraining() {
  console.log('Auto-training system started');
  return autoTrainer;
}

// -----------------------------Function to check training status-----------------------------//
export async function checkTrainingStatus() {
  try {
    const response = await fetch('/api/training/auto-train');
    if (response.ok) {
      const data = await response.json();
      return data.status;
    }
  } catch (error) {
    console.error('Error checking training status:', error);
  }
  return null;
}
