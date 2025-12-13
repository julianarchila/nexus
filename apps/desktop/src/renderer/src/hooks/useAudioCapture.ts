import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioCaptureOptions {
  selectedMicId?: string;
}

interface UseAudioCaptureReturn {
  isRecording: boolean;
  duration: number;
  systemLevel: number;
  micLevel: number;
  mixedLevel: number;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  saveAudio: () => Promise<void>;
  canSave: boolean;
}

interface AudioRefs {
  audioContext: AudioContext | null;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  systemStream: MediaStream | null;
  micStream: MediaStream | null;
  animationFrame: number | null;
  durationInterval: ReturnType<typeof setInterval> | null;
  systemAnalyser: AnalyserNode | null;
  micAnalyser: AnalyserNode | null;
  mixedAnalyser: AnalyserNode | null;
}

// Pure utility functions (outside hook)
function getAudioLevel(
  analyser: AnalyserNode,
  dataArray: Uint8Array<ArrayBuffer>,
): number {
  analyser.getByteFrequencyData(dataArray);
  const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  return Math.min(100, (avg / 128) * 100);
}

function stopStream(stream: MediaStream | null): void {
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      "",
    ),
  );
}

function generateFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `nexus-audio-${timestamp}.webm`;
}

export function useAudioCapture({
  selectedMicId,
}: UseAudioCaptureOptions): UseAudioCaptureReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [mixedLevel, setMixedLevel] = useState(0);
  const [canSave, setCanSave] = useState(false);

  const refs = useRef<AudioRefs>({
    audioContext: null,
    mediaRecorder: null,
    audioChunks: [],
    systemStream: null,
    micStream: null,
    animationFrame: null,
    durationInterval: null,
    systemAnalyser: null,
    micAnalyser: null,
    mixedAnalyser: null,
  });

  const cleanup = useCallback(() => {
    const r = refs.current;
    if (r.audioContext?.state !== "closed") {
      r.audioContext?.close();
    }
    r.audioContext = null;
    r.systemAnalyser = null;
    r.micAnalyser = null;
    r.mixedAnalyser = null;
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (refs.current.durationInterval) {
      clearInterval(refs.current.durationInterval);
      refs.current.durationInterval = null;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    setDuration(0);
    const startTime = Date.now();
    refs.current.durationInterval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, []);

  const stopLevelMonitoring = useCallback(() => {
    if (refs.current.animationFrame) {
      cancelAnimationFrame(refs.current.animationFrame);
      refs.current.animationFrame = null;
    }
    setSystemLevel(0);
    setMicLevel(0);
    setMixedLevel(0);
  }, []);

  const startLevelMonitoring = useCallback(() => {
    const r = refs.current;
    const systemDataArray = r.systemAnalyser
      ? new Uint8Array(r.systemAnalyser.frequencyBinCount)
      : null;
    const micDataArray = r.micAnalyser
      ? new Uint8Array(r.micAnalyser.frequencyBinCount)
      : null;
    const mixedDataArray = r.mixedAnalyser
      ? new Uint8Array(r.mixedAnalyser.frequencyBinCount)
      : null;

    const updateLevels = () => {
      if (r.systemAnalyser && systemDataArray) {
        setSystemLevel(getAudioLevel(r.systemAnalyser, systemDataArray));
      }
      if (r.micAnalyser && micDataArray) {
        setMicLevel(getAudioLevel(r.micAnalyser, micDataArray));
      }
      if (r.mixedAnalyser && mixedDataArray) {
        setMixedLevel(getAudioLevel(r.mixedAnalyser, mixedDataArray));
      }
      r.animationFrame = requestAnimationFrame(updateLevels);
    };

    updateLevels();
  }, []);

  const stopCapture = useCallback(() => {
    const r = refs.current;

    if (r.mediaRecorder?.state !== "inactive") {
      r.mediaRecorder?.stop();
    }

    stopStream(r.systemStream);
    stopStream(r.micStream);
    r.systemStream = null;
    r.micStream = null;

    stopLevelMonitoring();
    cleanup();
  }, [stopLevelMonitoring, cleanup]);

  const startCapture = useCallback(async () => {
    if (isRecording) return;

    const r = refs.current;

    try {
      const audioContext = new AudioContext();
      r.audioContext = audioContext;

      const mixedDestination = audioContext.createMediaStreamDestination();

      // Create analysers
      const systemAnalyser = audioContext.createAnalyser();
      systemAnalyser.fftSize = 256;
      r.systemAnalyser = systemAnalyser;

      const micAnalyser = audioContext.createAnalyser();
      micAnalyser.fftSize = 256;
      r.micAnalyser = micAnalyser;

      const mixedAnalyser = audioContext.createAnalyser();
      mixedAnalyser.fftSize = 256;
      r.mixedAnalyser = mixedAnalyser;

      let hasSystemAudio = false;
      let hasMicAudio = false;

      // Capture system audio
      try {
        const sources = await window.api.audio.getSources();
        if (sources.length > 0) {
          const systemConstraints = {
            audio: { mandatory: { chromeMediaSource: "desktop" } },
            video: {
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: sources[0].id,
                minWidth: 1,
                maxWidth: 1,
                minHeight: 1,
                maxHeight: 1,
              },
            },
          };

          const systemStream = await navigator.mediaDevices.getUserMedia(
            systemConstraints as MediaStreamConstraints,
          );
          r.systemStream = systemStream;

          // Stop video track - we only need audio
          for (const track of systemStream.getVideoTracks()) {
            track.stop();
          }

          const systemAudioTracks = systemStream.getAudioTracks();
          if (systemAudioTracks.length > 0) {
            hasSystemAudio = true;
            const systemSource = audioContext.createMediaStreamSource(
              new MediaStream(systemAudioTracks),
            );
            systemSource.connect(systemAnalyser);
            systemSource.connect(mixedDestination);
          }
        }
      } catch (error) {
        console.error("Error capturing system audio:", error);
      }

      // Capture microphone
      try {
        const micConstraints: MediaStreamConstraints = {
          audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
          video: false,
        };

        const micStream =
          await navigator.mediaDevices.getUserMedia(micConstraints);
        r.micStream = micStream;

        const micAudioTracks = micStream.getAudioTracks();
        if (micAudioTracks.length > 0) {
          hasMicAudio = true;
          const micSource = audioContext.createMediaStreamSource(micStream);
          micSource.connect(micAnalyser);
          micSource.connect(mixedDestination);
        }
      } catch (error) {
        console.error("Error capturing microphone:", error);
      }

      if (!hasSystemAudio && !hasMicAudio) {
        console.error("No audio sources available");
        cleanup();
        return;
      }

      // Connect mixed output to analyser
      const mixedSource = audioContext.createMediaStreamSource(
        mixedDestination.stream,
      );
      mixedSource.connect(mixedAnalyser);

      startLevelMonitoring();

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(mixedDestination.stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      r.mediaRecorder = mediaRecorder;
      r.audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          r.audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setCanSave(false);
        startDurationTimer();
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        setCanSave(r.audioChunks.length > 0);
        stopDurationTimer();
      };

      mediaRecorder.start(1000);
    } catch (error) {
      console.error("Error starting audio capture:", error);
      cleanup();
    }
  }, [
    isRecording,
    selectedMicId,
    cleanup,
    startLevelMonitoring,
    startDurationTimer,
    stopDurationTimer,
  ]);

  const saveAudio = useCallback(async () => {
    const chunks = refs.current.audioChunks;
    if (chunks.length === 0) return;

    try {
      const audioBlob = new Blob(chunks, { type: "audio/webm" });
      const base64 = await blobToBase64(audioBlob);
      const defaultName = generateFilename();

      const dialogResult = await window.api.audio.showSaveDialog(defaultName);
      if (dialogResult.canceled || !dialogResult.filePath) return;

      const result = await window.api.audio.saveToPath(
        base64,
        dialogResult.filePath,
      );

      if (result.success) {
        console.log(`Audio saved to: ${result.path}`);
      } else {
        console.error(`Save failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving audio:", error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    isRecording,
    duration,
    systemLevel,
    micLevel,
    mixedLevel,
    startCapture,
    stopCapture,
    saveAudio,
    canSave,
  };
}
