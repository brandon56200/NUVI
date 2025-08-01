import type { Part } from '@google/genai';

/**
 * Custom type for Content based on usage in the codebase
 */
export type Content = {
  parts: Part[];
  [key: string]: any;
};

/**
 * Custom types for missing Google GenAI exports
 */
export type LiveCallbacks = {
  onopen?: () => void;
  onclose?: (event: CloseEvent) => void;
  onerror?: (error: ErrorEvent) => void;
  onmessage?: (message: LiveServerMessage) => void;
  [key: string]: any;
};

export type LiveConnectConfig = {
  model: string;
  tools?: any[];
  [key: string]: any;
};

export type LiveServerContent = {
  interrupted?: boolean;
  turnComplete?: boolean;
  modelTurn?: Content;
  [key: string]: any;
};

/**
 * Custom type for GoogleGenAI constructor options
 * Based on the actual GoogleGenAI constructor parameters
 */
export type GoogleGenAIOptions = {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  [key: string]: any;
};

/**
 * the options to initiate the client, ensure apiKey is required
 */
export type LiveClientOptions = GoogleGenAIOptions & { apiKey: string };

/** log types */
export type StreamingLog = {
  date: Date;
  type: string;
  count?: number;
  message:
    | string
    | ClientContentLog
    | Omit<LiveServerMessage, "text" | "data">
    | LiveClientToolResponse;
};

export type ClientContentLog = {
  turns: Part[];
  turnComplete: boolean;
};

/**
 * Custom type for LiveServerMessage
 */
export type LiveServerMessage = {
  // Add properties as needed based on your usage
  [key: string]: any;
};

/**
 * Custom type for LiveClientToolResponse
 */
export type LiveClientToolResponse = {
  // Add properties as needed based on your usage
  [key: string]: any;
};

/**
 * Audio test results for microphone and audio system validation
 */
export type AudioTestResults = {
  timestamp: number;
  sampleRate: number;
  echoTest: {
    passed: boolean;
    echoLevel: number;
  };
  microphoneTest: {
    level: number;
    noise: number;
  };
  overallPassed: boolean;
};

/**
 * Audio check progress updates for real-time UI feedback
 */
export type AudioCheckProgress = {
  stage: 'init' | 'sample-rate' | 'echo-test' | 'mic-test' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  results?: Partial<AudioTestResults>;
};

/**
 * Audio check configuration options
 */
export type AudioCheckConfig = {
  echoTestDuration?: number; // in seconds, default 3
  micTestDuration?: number; // in seconds, default 2
  minMicLevel?: number; // minimum microphone sensitivity, default 0.001
  maxBackgroundNoise?: number; // maximum allowed background noise, default 0.005
  echoThreshold?: number; // echo level threshold, default 0.05
  targetSampleRate?: number; // minimum required sample rate, default 24000
};
