'use client';

/**
 * useCallServer Hook
 *
 * Shared hook for calling server assistance.
 * Sends request to /api/service-requests and plays a notification chime.
 */

import { useState, useCallback } from 'react';

// Generate a short bell/chime sound using Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // First tone — higher pitch ding
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.5);

    // Second tone — slightly lower, delayed
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.setValueAtTime(1174.66, audioContext.currentTime + 0.15); // D6
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.setValueAtTime(0.25, audioContext.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
    osc2.start(audioContext.currentTime + 0.15);
    osc2.stop(audioContext.currentTime + 0.7);

    // Cleanup
    setTimeout(() => audioContext.close(), 1000);
  } catch (e) {
    // Audio not supported or blocked — silently ignore
    console.warn('Could not play notification sound:', e);
  }
}

interface UseCallServerOptions {
  tableId?: string;
  message?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useCallServer({ tableId, message, onSuccess, onError }: UseCallServerOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCalled, setIsCalled] = useState(false);

  const callServer = useCallback(async (overrideMessage?: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableId || 'unknown',
          type: 'call_server',
          message: overrideMessage || message || 'Customer is requesting server assistance',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to call server');
      }

      // Play notification sound
      playNotificationSound();

      setIsCalled(true);
      setTimeout(() => setIsCalled(false), 5000);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to call server:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to call server');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, tableId, message, onSuccess, onError]);

  return { callServer, isLoading, isCalled };
}

export { playNotificationSound };
