import { useCallback, useEffect, useState } from "react";

import type { ScreenPermissionResult } from "../../../shared/types";
import { useAudioCapture } from "../hooks/useAudioCapture";

function AudioCapture() {
  const [permissionStatus, setPermissionStatus] =
    useState<ScreenPermissionResult["status"]>("not-determined");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");

  const {
    isRecording,
    duration,
    systemLevel,
    micLevel,
    mixedLevel,
    startCapture,
    stopCapture,
    saveAudio,
    canSave,
  } = useAudioCapture({ selectedMicId });

  // Check permissions on mount
  useEffect(() => {
    window.api.audio.checkScreenPermission().then((result) => {
      setPermissionStatus(result.status);
    });
  }, []);

  // Enumerate microphones
  const loadMicrophones = useCallback(async () => {
    try {
      // Request permission first to get device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      for (const track of tempStream.getTracks()) {
        track.stop();
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      setMicrophones(audioInputs);
    } catch (error) {
      console.error("Error loading microphones:", error);
    }
  }, []);

  useEffect(() => {
    loadMicrophones();
  }, [loadMicrophones]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <section className="content-card">
      <h2>Audio Capture</h2>

      {/* Permission status */}
      <div className={`permission-status permission-${permissionStatus}`}>
        Screen recording: {permissionStatus}
      </div>

      {/* Microphone picker */}
      <div className="input-group">
        <label htmlFor="mic-select" className="input-label">
          Microphone
        </label>
        <div className="select-wrapper">
          <select
            id="mic-select"
            className="select-input"
            value={selectedMicId}
            onChange={(e) => setSelectedMicId(e.target.value)}
            disabled={isRecording}
          >
            <option value="">Default microphone</option>
            {microphones.map((mic, index) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${index + 1}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-icon"
            onClick={loadMicrophones}
            disabled={isRecording}
            title="Refresh devices"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Control buttons */}
      <div className="control-buttons">
        <button
          type="button"
          className="btn btn-primary"
          onClick={startCapture}
          disabled={isRecording}
        >
          Start Capture
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={stopCapture}
          disabled={!isRecording}
        >
          Stop Capture
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={saveAudio}
          disabled={!canSave}
        >
          Save Audio
        </button>
      </div>

      {/* Recording status */}
      <div className="recording-status">
        <div className={`recording-indicator ${isRecording ? "active" : ""}`} />
        <span className="recording-duration">{formatDuration(duration)}</span>
        <span className="capture-status">
          {isRecording ? "Recording..." : "Ready to capture"}
        </span>
      </div>

      {/* Audio level meters */}
      <div className="audio-levels-container">
        <AudioLevelMeter label="System Audio" level={systemLevel} />
        <AudioLevelMeter label="Microphone" level={micLevel} />
        <AudioLevelMeter label="Mixed Output" level={mixedLevel} isMixed />
      </div>
    </section>
  );
}

interface AudioLevelMeterProps {
  label: string;
  level: number;
  isMixed?: boolean;
}

function AudioLevelMeter({
  label,
  level,
  isMixed = false,
}: AudioLevelMeterProps) {
  const getBarColor = (lvl: number): string => {
    if (lvl > 70) return "#ef4444"; // red - clipping
    if (lvl > 40) return "#22c55e"; // green - good
    return "#6366f1"; // indigo - low
  };

  return (
    <div className="audio-level-container">
      <div className="audio-level-label">
        <span>{label}</span>
      </div>
      <div className="audio-level">
        <div
          className={`audio-level-bar ${isMixed ? "mixed" : ""}`}
          style={{
            width: `${level}%`,
            backgroundColor: isMixed ? undefined : getBarColor(level),
          }}
        />
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8V3" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export default AudioCapture;
