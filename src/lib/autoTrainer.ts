// -----------------------------Enhanced AutoTrainer with robust error handling and retry mechanisms-----------------------------//

interface TrainingStatus {
  isRunning: boolean;
  lastTrainingTime: number;
  isUpToDate: boolean;
  lastError?: string;
  retryCount: number;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'never_trained';
}

class AutoTrainer {
  private static instance: AutoTrainer;
  private isRunning: boolean = false;
  private lastTrainingTime: number = 0;
  private trainingInterval: NodeJS.Timeout | null = null;
  private lastError: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5 seconds

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

    // -----------------------------Emergency recovery check every 6 hours-----------------------------//
    setInterval(async () => {
      await this.emergencyRecoveryCheck();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
  }

  private async emergencyRecoveryCheck(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      
      const response = await fetch('/api/training/auto-train', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.status.healthStatus === 'critical') {
          console.warn('Training system is in critical state, attempting emergency recovery...');
          await this.performDailyTraining();
        }
      }
    } catch (error) {
      console.error('Emergency recovery check failed:', error);
    }
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
      } else {
        throw new Error(`Status check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error checking training status:', error);
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
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
        this.lastError = null;
        this.retryCount = 0;
        
        console.log('Automatic daily training completed successfully:', data.message);
        
        // -----------------------------Store training completion in localStorage for UI feedback-----------------------------//
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastAutoTraining', new Date().toISOString());
          localStorage.setItem('autoTrainingStatus', 'success');
          localStorage.setItem('trainingSteps', JSON.stringify(data.trainingSteps || []));
          localStorage.removeItem('lastTrainingError');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Training request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Automatic training failed:', errorMessage);
      
      this.lastError = errorMessage;
      this.retryCount++;
      
      // -----------------------------Attempt retry if under max retries-----------------------------//
      if (this.retryCount < this.maxRetries) {
        console.log(`Training failed, retrying in ${this.retryDelay / 1000} seconds... (Attempt ${this.retryCount + 1}/${this.maxRetries})`);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('autoTrainingStatus', 'retrying');
          localStorage.setItem('lastTrainingError', errorMessage);
          localStorage.setItem('retryCount', this.retryCount.toString());
        }
        
        // Schedule retry
        setTimeout(() => {
          this.performDailyTraining();
        }, this.retryDelay);
        
        // Increase delay for next retry (exponential backoff)
        this.retryDelay *= 2;
      } else {
        console.error(`Training failed after ${this.maxRetries} attempts. Giving up.`);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('autoTrainingStatus', 'failed');
          localStorage.setItem('lastTrainingError', errorMessage);
          localStorage.setItem('retryCount', this.maxRetries.toString());
        }
      }
    } finally {
      if (this.retryCount >= this.maxRetries) {
        this.isRunning = false;
      }
    }
  }

  public async forceTraining(): Promise<void> {
    console.log('Force training requested...');
    this.retryCount = 0;
    this.retryDelay = 5000;
    await this.performDailyTraining();
  }

  public async resetTrainingState(): Promise<void> {
    console.log('Resetting training state...');
    this.retryCount = 0;
    this.retryDelay = 5000;
    this.lastError = null;
    this.isRunning = false;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('autoTrainingStatus');
      localStorage.removeItem('lastTrainingError');
      localStorage.removeItem('retryCount');
      localStorage.removeItem('trainingSteps');
    }
  }

  public getStatus(): TrainingStatus {
    const now = Date.now();
    const timeSinceLastTraining = this.lastTrainingTime > 0 ? now - this.lastTrainingTime : null;
    
    let healthStatus: 'healthy' | 'warning' | 'critical' | 'never_trained' = 'healthy';
    
    if (!this.lastTrainingTime) {
      healthStatus = 'never_trained';
    } else if (timeSinceLastTraining && timeSinceLastTraining > 48 * 60 * 60 * 1000) {
      healthStatus = 'critical';
    } else if (timeSinceLastTraining && timeSinceLastTraining > 24 * 60 * 60 * 1000) {
      healthStatus = 'warning';
    }

    return {
      isRunning: this.isRunning,
      lastTrainingTime: this.lastTrainingTime,
      isUpToDate: timeSinceLastTraining ? timeSinceLastTraining < 24 * 60 * 60 * 1000 : false,
      lastError: this.lastError || undefined,
      retryCount: this.retryCount,
      healthStatus
    };
  }

  public stop() {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = null;
    }
  }

  public getRetryInfo() {
    return {
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      canRetry: this.retryCount < this.maxRetries
    };
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
    } else {
      throw new Error(`Status check failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error checking training status:', error);
    return null;
  }
}

// -----------------------------Function to get detailed training information-----------------------------//
export function getDetailedTrainingInfo() {
  if (typeof window === 'undefined') return null;
  
  try {
    const lastTraining = localStorage.getItem('lastAutoTraining');
    const status = localStorage.getItem('autoTrainingStatus');
    const error = localStorage.getItem('lastTrainingError');
    const retryCount = localStorage.getItem('retryCount');
    const steps = localStorage.getItem('trainingSteps');
    
    return {
      lastTraining: lastTraining ? new Date(lastTraining) : null,
      status: status || 'unknown',
      error: error || null,
      retryCount: retryCount ? parseInt(retryCount) : 0,
      steps: steps ? JSON.parse(steps) : [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting detailed training info:', error);
    return null;
  }
}
