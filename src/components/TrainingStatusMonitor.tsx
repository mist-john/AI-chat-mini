'use client';

import React, { useState, useEffect } from 'react';

interface TrainingStatus {
  isRunning: boolean;
  lastTrainingTime: number;
  isUpToDate: boolean;
  lastError?: string;
  retryCount: number;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'never_trained';
}

export default function TrainingStatusMonitor() {
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const initializeTrainingMonitor = async () => {
      try {
        setIsLoading(true);
        
        // Dynamic import to avoid SSR issues
        const { startAutoTraining } = await import('@/lib/autoTrainer');
        const autoTrainer = startAutoTraining();
        
        const updateStatus = () => {
          try {
            const currentStatus = autoTrainer.getStatus();
            setStatus(currentStatus);
          } catch (error) {
            console.warn('Failed to get training status:', error);
            // Set default status if autoTrainer fails
            setStatus({
              isRunning: false,
              lastTrainingTime: 0,
              isUpToDate: false,
              retryCount: 0,
              healthStatus: 'never_trained'
            });
          }
        };

        // Update status immediately
        updateStatus();

        // Update status every 30 seconds
        const interval = setInterval(updateStatus, 30000);

        return () => clearInterval(interval);
      } catch (error) {
        console.warn('Failed to load autoTrainer:', error);
        // Set default status if autoTrainer fails to load
        setStatus({
          isRunning: false,
          lastTrainingTime: 0,
          isUpToDate: false,
          retryCount: 0,
          healthStatus: 'never_trained'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeTrainingMonitor();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button className="mb-2 px-3 py-2 rounded-lg text-white text-sm font-medium bg-gray-600">
          ⚪ Loading...
        </button>
      </div>
    );
  }

  // Show error state if no status
  if (!status) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button className="mb-2 px-3 py-2 rounded-lg text-white text-sm font-medium bg-gray-600">
          ⚪ Training
        </button>
      </div>
    );
  }

  const getHealthColor = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'never_trained': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      case 'never_trained': return '⚪';
      default: return '⚪';
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes}m ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleForceTraining = async () => {
    try {
      const { startAutoTraining } = await import('@/lib/autoTrainer');
      const autoTrainer = startAutoTraining();
      await autoTrainer.forceTraining();
      // Status will update automatically via the interval
    } catch (error) {
      console.error('Force training failed:', error);
    }
  };

  const handleResetState = async () => {
    try {
      const { startAutoTraining } = await import('@/lib/autoTrainer');
      const autoTrainer = startAutoTraining();
      await autoTrainer.resetTrainingState();
      // Status will update automatically via the interval
    } catch (error) {
      console.error('Reset state failed:', error);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`mb-2 px-3 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 ${
          status.healthStatus === 'critical' 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : status.healthStatus === 'warning'
            ? 'bg-yellow-600 hover:bg-yellow-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
        title="Training System Status"
      >
        {getHealthIcon(status.healthStatus)} Training
      </button>

      {/* Status Panel */}
      {isVisible && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Training System Status</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Health Status */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg ${getHealthColor(status.healthStatus)}`}>
                {getHealthIcon(status.healthStatus)}
              </span>
              <span className={`font-medium ${getHealthColor(status.healthStatus)}`}>
                {status.healthStatus.charAt(0).toUpperCase() + status.healthStatus.slice(1)}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              Last Training: {formatTime(status.lastTrainingTime)}
            </div>
            
            {status.isUpToDate && (
              <div className="text-sm text-green-600 mt-1">
                ✓ System is up to date
              </div>
            )}
          </div>

          {/* Error Information */}
          {status.lastError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm font-medium text-red-800 mb-1">Last Error:</div>
              <div className="text-xs text-red-700 break-words">{status.lastError}</div>
              {status.retryCount > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  Retry attempts: {status.retryCount}/3
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleForceTraining}
              disabled={status.isRunning}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status.isRunning ? 'Training...' : 'Force Training'}
            </button>
            
            <button
              onClick={handleResetState}
              className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset State
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
            Auto-updates every 30s
          </div>
        </div>
      )}
    </div>
  );
}
