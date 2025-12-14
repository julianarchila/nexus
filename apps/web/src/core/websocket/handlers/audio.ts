import * as fs from "node:fs";
import * as path from "node:path";
import type {
  AudioChunkMessage,
  SessionState,
  SessionResult,
  AudioChunk,
} from "../types";

// Directory to store audio files
const AUDIO_DIR = path.join(process.cwd(), "audio-sessions");

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Handle incoming audio chunk
 */
export async function handleAudioChunk(
  session: SessionState,
  message: AudioChunkMessage,
): Promise<void> {
  // Decode base64 audio data
  const audioBuffer = Buffer.from(message.data, "base64");

  // Store chunk in session
  const chunk: AudioChunk = {
    sequence: message.sequence,
    data: audioBuffer,
    timestamp: message.timestamp,
    duration: message.duration,
  };

  session.audioChunks.push(chunk);
}

/**
 * Finalize session and save audio to disk
 */
export async function finalizeSession(
  session: SessionState,
): Promise<SessionResult> {
  if (session.audioChunks.length === 0) {
    return {
      success: false,
      totalChunks: 0,
      totalDuration: 0,
      error: "No audio chunks to save",
    };
  }

  try {
    // Sort chunks by sequence number to ensure correct order
    const sortedChunks = session.audioChunks.sort(
      (a, b) => a.sequence - b.sequence,
    );

    // Calculate total duration
    const totalDuration = sortedChunks.reduce(
      (sum, chunk) => sum + chunk.duration,
      0,
    );

    // Concatenate all audio data
    const audioData = Buffer.concat(sortedChunks.map((chunk) => chunk.data));

    // Generate filename with timestamp
    const timestamp = new Date(session.startedAt)
      .toISOString()
      .replace(/[:.]/g, "-");
    const filename = `session_${session.id}_${timestamp}.webm`;
    const filePath = path.join(AUDIO_DIR, filename);

    // Write to disk
    fs.writeFileSync(filePath, audioData);

    const stats = fs.statSync(filePath);

    console.log(`[Audio] Saved session ${session.id}:`);
    console.log(`  - File: ${filePath}`);
    console.log(`  - Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  - Chunks: ${sortedChunks.length}`);
    console.log(`  - Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    return {
      success: true,
      filePath,
      totalChunks: sortedChunks.length,
      totalDuration,
      fileSize: stats.size,
    };
  } catch (error) {
    console.error(`[Audio] Error saving session ${session.id}:`, error);
    return {
      success: false,
      totalChunks: session.audioChunks.length,
      totalDuration: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get session audio directory
 */
export function getAudioDirectory(): string {
  return AUDIO_DIR;
}
