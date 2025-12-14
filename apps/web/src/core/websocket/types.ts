/**
 * WebSocket message types for audio streaming
 */

// Client -> Server messages
export type ClientMessage = AudioChunkMessage | EndSessionMessage | PingMessage;

export interface AudioChunkMessage {
  type: "AUDIO_CHUNK";
  data: string; // base64 encoded audio
  sequence: number;
  timestamp: number;
  duration: number; // chunk duration in ms
}

export interface EndSessionMessage {
  type: "END_SESSION";
  timestamp: number;
}

export interface PingMessage {
  type: "PING";
  timestamp: number;
}

// Server -> Client messages
export type ServerMessage =
  | SessionStartedMessage
  | ChunkReceivedMessage
  | SessionEndedMessage
  | ErrorMessage
  | PongMessage
  | TranscriptMessage
  | ClaimMessage
  | AlertMessage;

export interface SessionStartedMessage {
  type: "SESSION_STARTED";
  sessionId: string;
  timestamp: number;
}

export interface ChunkReceivedMessage {
  type: "CHUNK_RECEIVED";
  sequence: number;
  totalChunks: number;
  timestamp: number;
}

export interface SessionEndedMessage {
  type: "SESSION_ENDED";
  sessionId: string;
  result: SessionResult;
  timestamp: number;
}

export interface ErrorMessage {
  type: "ERROR";
  error: string;
  timestamp: number;
}

export interface PongMessage {
  type: "PONG";
  timestamp: number;
}

// Future: transcript and insight messages
export interface TranscriptMessage {
  type: "TRANSCRIPT";
  segment: {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
  };
  timestamp: number;
}

export interface ClaimMessage {
  type: "CLAIM";
  claim: {
    id: string;
    type: string;
    value: string;
    confidence: number;
    matchStatus: "SUPPORTED" | "UNSUPPORTED" | "PARTIAL" | "UNKNOWN";
  };
  timestamp: number;
}

export interface AlertMessage {
  type: "ALERT";
  alert: {
    id: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    title: string;
    message: string;
  };
  timestamp: number;
}

// Session state
export interface SessionState {
  id: string;
  startedAt: number;
  chunkCount: number;
  audioChunks: AudioChunk[];
  merchantId?: string;
  userId?: string;
}

export interface AudioChunk {
  sequence: number;
  data: Buffer;
  timestamp: number;
  duration: number;
}

export interface SessionResult {
  success: boolean;
  filePath?: string;
  totalChunks: number;
  totalDuration: number;
  fileSize?: number;
  error?: string;
}
