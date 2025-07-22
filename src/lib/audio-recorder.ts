import { audioContext } from "./utils";
import AudioRecordingWorklet from "./worklets/audio-processing";
import VolMeterWorket from "./worklets/vol-meter";

import { createWorketFromSrc } from "./audioworklet-registry";
import EventEmitter from "eventemitter3";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;
  sampleRate: number;

  private starting: Promise<void> | null = null;

  constructor(sampleRate = 16000) {
    super();
    this.sampleRate = sampleRate;
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    this.starting = new Promise(async (resolve, reject) => {
      try {
        console.log("AudioRecorder: Starting audio recording...");
        
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("AudioRecorder: Got audio stream");
        
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        console.log("AudioRecorder: Got audio context");
        
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        console.log("AudioRecorder: Created media stream source");

        // Register audio recorder worklet
        const workletName = "audio-recorder-worklet";
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);
        
        console.log("AudioRecorder: Registering audio recorder worklet...");
        await this.audioContext.audioWorklet.addModule(src);
        console.log("AudioRecorder: Audio recorder worklet registered successfully");
        
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName,
        );
        console.log("AudioRecorder: Created audio recorder worklet node");

        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          // worklet processes recording floats and messages converted buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emit("data", arrayBufferString);
          }
        };
        this.source.connect(this.recordingWorklet);

        // Register VU meter worklet
        const vuWorkletName = "vu-meter";
        console.log("AudioRecorder: Registering VU meter worklet...");
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket),
        );
        console.log("AudioRecorder: VU meter worklet registered successfully");
        
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        console.log("AudioRecorder: Created VU meter worklet node");
        
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit("volume", ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
        console.log("AudioRecorder: Audio recording started successfully");
        resolve();
        this.starting = null;
      } catch (error) {
        console.error("AudioRecorder: Error starting audio recording:", error);
        reject(error);
        this.starting = null;
      }
    });

    return this.starting;
  }

  stop() {
    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = () => {
      console.log("AudioRecorder: Stopping audio recording...");
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.recording = false;
      console.log("AudioRecorder: Audio recording stopped");
    };
    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}
