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
