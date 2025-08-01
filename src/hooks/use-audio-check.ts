import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioCheck } from '../lib/audio-check';
import type { AudioTestResults, AudioCheckProgress, AudioCheckConfig } from '../types';

export interface UseAudioCheckResult {
  // Test execution
  runAllTests: () => Promise<AudioTestResults | null>;
  runIndividualTest: (test: 'sample-rate' | 'echo-test' | 'mic-test') => Promise<any>;
  
  // Initialization
  init: () => Promise<void>;
  isInitialized: boolean;
  
  // State
  isRunning: boolean;
  progress: AudioCheckProgress | null;
  results: AudioTestResults | null;
  error: string | null;
  
  // Control
  cleanup: () => void;
}

export function useAudioCheck(config?: AudioCheckConfig): UseAudioCheckResult {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AudioCheckProgress | null>(null);
  const [results, setResults] = useState<AudioTestResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const audioCheckRef = useRef<AudioCheck | null>(null);

  // Initialize AudioCheck on mount
  useEffect(() => {
    const audioCheck = new AudioCheck(config);
    audioCheckRef.current = audioCheck;
    
    return () => {
      audioCheckRef.current?.cleanup();
    };
  }, []);

  // Set up event listeners when audioCheck instance changes
  useEffect(() => {
    const audioCheck = audioCheckRef.current;
    if (!audioCheck) return;

    const handleProgress = (progressData: AudioCheckProgress) => {
      setProgress(progressData);
      
      if (progressData.stage === 'error') {
        setError(progressData.message);
        setIsRunning(false);
      } else if (progressData.stage === 'complete') {
        setIsRunning(false);
        setError(null);
      }
    };

    audioCheck.on('progress', handleProgress);

    return () => {
      audioCheck.off('progress', handleProgress);
    };
  }, []);

  const runAllTests = useCallback(async (): Promise<AudioTestResults | null> => {
    if (isRunning || !audioCheckRef.current) return null;

    setIsRunning(true);
    setError(null);
    setResults(null);
    setProgress(null);

    try {
      const testResults = await audioCheckRef.current.runAllTests();
      setResults(testResults);
      return testResults;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setIsRunning(false);
      return null;
    }
  }, [isRunning]);

  const runIndividualTest = useCallback(async (
    test: 'sample-rate' | 'echo-test' | 'mic-test'
  ): Promise<any> => {
    if (isRunning || !audioCheckRef.current) return null;

    setIsRunning(true);
    setError(null);

    try {
      const audioCheck = audioCheckRef.current;

      // Ensure initialization before running any test
      if (!audioCheck.isInitialized()) {
        await audioCheck.init();
        setIsInitialized(true);
      }

      let result;
      switch (test) {
        case 'sample-rate':
          result = await audioCheck.getSampleRate();
          break;
        case 'echo-test':
          result = await audioCheck.runEchoTest();
          break;
        case 'mic-test':
          result = await audioCheck.runMicTest();
          break;
        default:
          throw new Error(`Unknown test: ${test}`);
      }

      setIsRunning(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setIsRunning(false);
      return null;
    }
  }, [isRunning]);

  const init = useCallback(async () => {
    if (!audioCheckRef.current) return;
    
    try {
      await audioCheckRef.current.init();
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setIsInitialized(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    audioCheckRef.current?.cleanup();
    setIsRunning(false);
    setProgress(null);
    setError(null);
    setIsInitialized(false);
  }, []);

  return {
    runAllTests,
    runIndividualTest,
    init,
    isInitialized,
    isRunning,
    progress,
    results,
    error,
    cleanup,
  };
} 