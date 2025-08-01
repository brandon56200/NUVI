import EventEmitter from "eventemitter3";
import { audioContext } from "./utils";
import VolMeterWorklet from "./worklets/vol-meter";
import { createWorketFromSrc } from "./audioworklet-registry";
import type { AudioTestResults, AudioCheckProgress, AudioCheckConfig } from "../types";

export class AudioCheck extends EventEmitter {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private volMeterWorklet: AudioWorkletNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isRunning = false;
  
  private config: Required<AudioCheckConfig>;
  private results: Partial<AudioTestResults> = {};
  
  // Volume tracking for tests
  private volumeHistory: number[] = [];
  private backgroundNoiseLevel = 0;
  
  constructor(config: AudioCheckConfig = {}) {
    super();
    
    // Set default configuration
    this.config = {
      echoTestDuration: config.echoTestDuration ?? 3,
      micTestDuration: config.micTestDuration ?? 2,
      minMicLevel: config.minMicLevel ?? 0.001,        // Minimum microphone sensitivity
      maxBackgroundNoise: config.maxBackgroundNoise ?? 0.005, // Maximum allowed background noise
      echoThreshold: config.echoThreshold ?? 0.05,     // Echo detection threshold
      targetSampleRate: config.targetSampleRate ?? 24000,
    };
  }

  /**
   * Initialize the audio check system
   */
  async init(): Promise<void> {
    if (this.isRunning) {
      throw new Error("AudioCheck is already running");
    }

    this.isRunning = true;
    this.emitProgress("init", "Initializing audio system...", 0);

    try {
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported in this browser");
      }

      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error("Web Audio API not supported in this browser");
      }

      // Initialize audio context
      this.audioContext = await audioContext({ 
        sampleRate: this.config.targetSampleRate,
        id: "audio-check-context"
      });

      // Request microphone access with production settings
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: this.config.targetSampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Set up volume meter worklet
      await this.setupVolumeMeter();

      this.emitProgress("init", "Audio system initialized", 100);
      this.isRunning = false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emitProgress("error", `Initialization failed: ${message}`, 0);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Check browser capabilities and get audio context sample rate
   */
  async getSampleRate(): Promise<number> {
    if (!this.audioContext) {
      throw new Error("AudioCheck not initialized. Call init() first.");
    }
    
    this.isRunning = true;
    this.emitProgress("sample-rate", "Checking sample rate capabilities...", 0);
    
    const sampleRate = this.audioContext.sampleRate;
    this.results.sampleRate = sampleRate;
    
    // Test maximum supported sample rate
    const maxSupportedRate = await this.getMaxSupportedSampleRate();
    
    this.emitProgress("sample-rate", 
      `Sample rate: ${sampleRate}Hz ${sampleRate >= this.config.targetSampleRate ? '✓' : '✗'} | Hardware max: ${maxSupportedRate}Hz`, 
      100
    );
    
    this.isRunning = false;
    return sampleRate;
  }

  /**
   * Find the maximum sample rate the system supports
   */
  private async getMaxSupportedSampleRate(): Promise<number> {
    const testRates = [96000, 88200, 48000, 44100, 24000, 22050, 16000, 8000];
    
    for (const rate of testRates) {
      try {
        // Create a temporary AudioContext with this sample rate
        const tempContext = new AudioContext({ sampleRate: rate });
        const actualRate = tempContext.sampleRate;
        
        // Clean up
        await tempContext.close();
        
        // If we got the requested rate (within 1Hz tolerance), it's supported
        if (Math.abs(actualRate - rate) < 1) {
          return rate;
        }
      } catch (error) {
        // Rate not supported, try next
      }
    }
    
    // Fallback - return current context rate if nothing else works
    return this.audioContext?.sampleRate || 24000;
  }

  /**
   * Play a tone and check if mic picks it up (echo detection)
   */
  async runEchoTest(): Promise<{ passed: boolean; echoLevel: number }> {
    if (!this.audioContext || !this.source) {
      throw new Error("AudioCheck not initialized. Call init() first.");
    }

    this.isRunning = true;
    this.emitProgress("echo-test", "Starting echo test...", 0);

    try {
      // Record baseline noise level first
      this.emitProgress("echo-test", "Measuring background noise...", 10);
      await this.measureBackgroundNoise();
      
      // Create test tone for echo detection
      this.oscillator = this.audioContext!.createOscillator();
      this.gainNode = this.audioContext!.createGain();
      
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(1000, this.audioContext!.currentTime); // 1kHz test tone
      this.gainNode.gain.setValueAtTime(0.1, this.audioContext!.currentTime); // Moderate volume
      
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext!.destination);
      
      // Track volume during echo test
      const echoVolumes: number[] = [];
      const volumeHandler = (event: MessageEvent) => {
        echoVolumes.push(event.data.volume);
      };
      
      if (this.volMeterWorklet) {
        this.volMeterWorklet.port.onmessage = volumeHandler;
      }
      
      // Start the test tone
      this.oscillator.start();
      this.emitProgress("echo-test", "Playing test tone...", 30);
      
      // Monitor for echo during the test duration
      for (let i = 0; i < this.config.echoTestDuration; i++) {
        const progress = 30 + ((i / this.config.echoTestDuration) * 60);
        this.emitProgress("echo-test", 
          `Echo test in progress... ${this.config.echoTestDuration - i}s remaining`, 
          progress
        );
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Stop the test tone
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.gainNode.disconnect();
      this.oscillator = null;
      this.gainNode = null;
      
      // Calculate echo level
      const avgEchoVolume = echoVolumes.length > 0 
        ? echoVolumes.reduce((a, b) => a + b, 0) / echoVolumes.length 
        : 0;
      
      const echoLevel = Math.max(0, avgEchoVolume - this.backgroundNoiseLevel);
      const echoPassed = echoLevel < this.config.echoThreshold;
      
      this.results.echoTest = { passed: echoPassed, echoLevel };
      
      this.emitProgress("echo-test", 
        `Echo test ${echoPassed ? 'passed ✓' : 'failed ✗'} (level: ${echoLevel.toFixed(3)})`, 
        100
      );
      
      this.isRunning = false;
      return { passed: echoPassed, echoLevel };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emitProgress("error", `Echo test failed: ${message}`, 0);
      this.isRunning = false;
      return { passed: false, echoLevel: 1 };
    }
  }

  /**
   * Measure mic input level + background noise
   */
  async runMicTest(): Promise<{ level: number; noise: number }> {
    if (!this.audioContext || !this.source) {
      throw new Error("AudioCheck not initialized. Call init() first.");
    }

    this.isRunning = true;
    this.emitProgress("mic-test", "Testing microphone levels...", 0);

    try {
      // Reset volume history
      this.volumeHistory = [];
      
      const volumeHandler = (event: MessageEvent) => {
        this.volumeHistory.push(event.data.volume);
      };
      
      if (this.volMeterWorklet) {
        this.volMeterWorklet.port.onmessage = volumeHandler;
      }
      
      // Measure for the configured duration
      for (let i = 0; i < this.config.micTestDuration; i++) {
        const progress = (i / this.config.micTestDuration) * 90;
        this.emitProgress("mic-test", 
          `Measuring microphone... ${this.config.micTestDuration - i}s remaining`, 
          progress
        );
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Calculate statistics
      const sortedVolumes = [...this.volumeHistory].sort((a, b) => a - b);
      const percentile95 = sortedVolumes[Math.floor(sortedVolumes.length * 0.95)] || 0;
      const percentile10 = sortedVolumes[Math.floor(sortedVolumes.length * 0.10)] || 0;
      
      const micLevel = percentile95; // Peak microphone sensitivity
      const noiseLevel = percentile10; // Background noise floor
      
      this.results.microphoneTest = { level: micLevel, noise: noiseLevel };
      
      this.emitProgress("mic-test", 
        `Microphone test complete - Level: ${micLevel.toFixed(3)}, Noise: ${noiseLevel.toFixed(3)}`, 
        100
      );
      
      this.isRunning = false;
      return { level: micLevel, noise: noiseLevel };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emitProgress("error", `Microphone test failed: ${message}`, 0);
      this.isRunning = false;
      return { level: 0, noise: 1 };
    }
  }

  /**
   * 🏃 Run all tests in sequence (for convenience)
   */
  async runAllTests(): Promise<AudioTestResults> {
    await this.init();
    
    try {
      await this.getSampleRate();
      await this.runEchoTest();
      await this.runMicTest();
      
      const overallPassed = this.isTestPassed();
      
      this.emitProgress("complete", 
        `Audio check ${overallPassed ? 'passed ✓' : 'completed with warnings ⚠️'}`, 
        100
      );
      
      return this.getCompleteResults();
    } finally {
      this.cleanup();
    }
  }

  /**
   * Check if the audio system is initialized and ready for tests
   */
  isInitialized(): boolean {
    return !!(this.audioContext && this.source && this.volMeterWorklet);
  }

  /**
   * Clean up all nodes and media streams
   */
  cleanup(): void {
    this.isRunning = false;
    
    // Stop oscillator if running
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
      this.oscillator = null;
    }
    
    // Disconnect gain node
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    // Disconnect volume meter
    if (this.volMeterWorklet) {
      this.volMeterWorklet.disconnect();
      this.volMeterWorklet = null;
    }
    
    // Disconnect source
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    // Stop media stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Note: We don't close the audio context as it's shared
    this.audioContext = null;
  }

  // Private helper methods

  private async setupVolumeMeter(): Promise<void> {
    if (!this.audioContext || !this.source) return;
    
    const workletName = "vol-meter-check";
    const src = createWorketFromSrc(workletName, VolMeterWorklet);
    
    await this.audioContext.audioWorklet.addModule(src);
    this.volMeterWorklet = new AudioWorkletNode(this.audioContext, workletName);
    
    this.source.connect(this.volMeterWorklet);
  }

  private async measureBackgroundNoise(): Promise<void> {
    const noiseVolumes: number[] = [];
    
    const volumeHandler = (event: MessageEvent) => {
      noiseVolumes.push(event.data.volume);
    };
    
    if (this.volMeterWorklet) {
      this.volMeterWorklet.port.onmessage = volumeHandler;
    }
    
    // Measure background for 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.backgroundNoiseLevel = noiseVolumes.length > 0 
      ? noiseVolumes.reduce((a, b) => a + b, 0) / noiseVolumes.length 
      : 0;
  }

  private emitProgress(stage: AudioCheckProgress['stage'], message: string, progress: number): void {
    const progressData: AudioCheckProgress = {
      stage,
      message,
      progress,
      results: { ...this.results }
    };
    
    this.emit('progress', progressData);
  }

  private isTestPassed(): boolean {
    return (
      (this.results.sampleRate ?? 0) >= this.config.targetSampleRate &&
      (this.results.echoTest?.passed ?? false) &&
      (this.results.microphoneTest?.level ?? 0) >= this.config.minMicLevel &&
      (this.results.microphoneTest?.noise ?? 1) < this.config.maxBackgroundNoise
    );
  }

  private isComplete(): boolean {
    return !!(
      this.results.sampleRate &&
      this.results.echoTest &&
      this.results.microphoneTest
    );
  }

  private getCompleteResults(): AudioTestResults {
    if (!this.isComplete()) {
      throw new Error("Audio check is not complete");
    }
    
    return {
      timestamp: Date.now(),
      sampleRate: this.results.sampleRate!,
      echoTest: this.results.echoTest!,
      microphoneTest: this.results.microphoneTest!,
      overallPassed: this.isTestPassed()
    };
  }
} 