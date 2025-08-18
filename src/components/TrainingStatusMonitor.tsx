'use client';

import React, { useState, useEffect } from 'react';
import { autoTrainer, getDetailedTrainingInfo } from '@/lib/autoTrainer';

interface TrainingStatus {
  isRunning: boolean;
  lastTrainingTime: number;
  isUpToDate: boolean;
  lastError?: string;
  retryCount: number;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'never_trained';
}

interface DetailedTrainingInfo {
  lastTraining: Date | null;
  status: string;
  error: string | null;
  retryCount: number;
  steps: string[];
  timestamp: string;
}

export default function TrainingStatusMonitor() {
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [detailedInfo, setDetailedInfo] = useState<DetailedTrainingInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = autoTrainer.getStatus();
      setStatus(currentStatus);
      
      const detailed = getDetailedTrainingInfo();
      setDetailedInfo(detailed);
    };

    // Update status immediately
    updateStatus();

    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

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
  };

  const handleForceTraining = async () => {
    try {
      await autoTrainer.forceTraining();
      // Status will update automatically via the interval
    } catch (error) {
      console.error('Force training failed:', error);
    }
  };

  const handleResetState = async () => {
    try {
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

          {/* Detailed Information */}
          {detailedInfo && (
            <div className="mb-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-blue-600 hover:text-blue-800 mb-2"
              >
                {isExpanded ? 'Hide' : 'Show'} Details
              </button>
              
              {isExpanded && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    <strong>Status:</strong> {detailedInfo.status}
                  </div>
                  {detailedInfo.steps.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Training Steps:</div>
                      <div className="space-y-1">
                        {detailedInfo.steps.map((step, index) => (
                          <div key={index} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
