import { useCallback, useEffect, useState } from "react";

import type {
  ScreenPermissionResult,
  WebSocketStatus,
} from "../../../shared/types";
import { useAudioCapture } from "../hooks/useAudioCapture";
import { useWebSocket } from "../hooks/useWebSocket";

const WS_URL = "ws://localhost:3000/ws";

function AudioCapture() {
  const [permissionStatus, setPermissionStatus] =
    useState<ScreenPermissionResult["status"]>("not-determined");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [streamToServer, setStreamToServer] = useState(true);
  const [serverFilePath, setServerFilePath] = useState<string | null>(null);

  // WebSocket connection
  const {
    status: wsStatus,
    sessionId,
    chunksReceived,
    connect,
    disconnect,
    sendAudioChunk,
    endSession,
  } = useWebSocket({
    url: WS_URL,
    onSessionStarted: (msg) => {
      console.log("Session started:", msg.sessionId);
    },
    onSessionEnded: (msg) => {
      console.log("Session ended:", msg.result);
      if (msg.result.success && msg.result.filePath) {
        setServerFilePath(msg.result.filePath);
      }
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  // Audio capture with streaming callback
  const {
    isRecording,
    duration,
    systemLevel,
    micLevel,
    mixedLevel,
    chunksSent,
    startCapture,
    stopCapture,
    saveAudio,
    canSave,
  } = useAudioCapture({
    selectedMicId,
    chunkDurationMs: 1000,
    onAudioChunk:
      streamToServer && wsStatus === "connected"
        ? (chunk) => {
            sendAudioChunk(chunk.data, chunk.sequence, chunk.duration);
          }
        : undefined,
  });

  // Check permissions on mount
  useEffect(() => {
    window.api.audio.checkScreenPermission().then((result) => {
      setPermissionStatus(result.status);
    });
  }, []);

  // Enumerate microphones
  const loadMicrophones = useCallback(async () => {
    try {
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

  const handleStartCapture = async () => {
    setServerFilePath(null);
    if (streamToServer && wsStatus !== "connected") {
      connect();
      // Wait a bit for connection
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    startCapture();
  };

  const handleStopCapture = () => {
    stopCapture();
    if (streamToServer && wsStatus === "connected") {
      endSession();
    }
  };

  const getWsStatusColor = (status: WebSocketStatus): string => {
    switch (status) {
      case "connected":
        return "#22c55e";
      case "connecting":
        return "#eab308";
      case "error":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <section className="content-card">
      <h2>Audio Capture</h2>

      {/* Permission status */}
      <div className={`permission-status permission-${permissionStatus}`}>
        Screen recording: {permissionStatus}
      </div>

      {/* WebSocket status */}
      <div className="ws-status" style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: getWsStatusColor(wsStatus),
            }}
          />
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>
            Server: {wsStatus}
            {sessionId && ` (${sessionId.slice(0, 20)}...)`}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          <label style={{ fontSize: "12px", color: "#9ca3af" }}>
            <input
              type="checkbox"
              checked={streamToServer}
              onChange={(e) => setStreamToServer(e.target.checked)}
              disabled={isRecording}
              style={{ marginRight: "4px" }}
            />
            Stream to server
          </label>
          {wsStatus !== "connected" && streamToServer && !isRecording && (
            <button
              type="button"
              onClick={connect}
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              Connect
            </button>
          )}
          {wsStatus === "connected" && !isRecording && (
            <button
              type="button"
              onClick={disconnect}
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              Disconnect
            </button>
          )}
        </div>
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
          onClick={handleStartCapture}
          disabled={isRecording}
        >
          Start Capture
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleStopCapture}
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
          Save Locally
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

      {/* Streaming status */}
      {streamToServer && (isRecording || chunksSent > 0) && (
        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>
          Chunks: {chunksSent} sent / {chunksReceived} received
        </div>
      )}

      {/* Server file path */}
      {serverFilePath && (
        <div
          style={{
            fontSize: "12px",
            color: "#22c55e",
            marginTop: "8px",
            wordBreak: "break-all",
          }}
        >
          Saved on server: {serverFilePath}
        </div>
      )}

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
