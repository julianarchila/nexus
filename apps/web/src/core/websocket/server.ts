import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { handleAudioChunk, finalizeSession } from "./handlers/audio";
import type { ClientMessage, ServerMessage, SessionState } from "./types";

// Store active sessions
const sessions = new Map<string, SessionState>();

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  console.log("[WS Server] Setting up WebSocket server...");

  const wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  console.log("[WS Server] WebSocket server created on path /ws");

  wss.on("connection", (ws: WebSocket, req) => {
    console.log(
      "[WS Server] New connection attempt from:",
      req.socket.remoteAddress,
    );
    console.log("[WS Server] Request URL:", req.url);
    console.log(
      "[WS Server] Request headers:",
      JSON.stringify(req.headers, null, 2),
    );

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId") || generateSessionId();

    console.log(`[WS Server] Client connected, session: ${sessionId}`);

    // Initialize session state
    const session: SessionState = {
      id: sessionId,
      startedAt: Date.now(),
      chunkCount: 0,
      audioChunks: [],
    };
    sessions.set(sessionId, session);

    // Send session confirmation
    sendMessage(ws, {
      type: "SESSION_STARTED",
      sessionId,
      timestamp: Date.now(),
    });

    ws.on("message", async (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        await handleClientMessage(ws, session, message);
      } catch (error) {
        console.error("[WS] Error handling message:", error);
        sendMessage(ws, {
          type: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        });
      }
    });

    ws.on("close", async () => {
      console.log(`[WS] Client disconnected, session: ${sessionId}`);

      // Finalize and save the session audio
      const finalSession = sessions.get(sessionId);
      if (finalSession && finalSession.audioChunks.length > 0) {
        try {
          const result = await finalizeSession(finalSession);
          console.log(`[WS] Session ${sessionId} finalized:`, result);
        } catch (error) {
          console.error(`[WS] Error finalizing session ${sessionId}:`, error);
        }
      }

      sessions.delete(sessionId);
    });

    ws.on("error", (error) => {
      console.error(`[WS] WebSocket error for session ${sessionId}:`, error);
    });
  });

  console.log("[WS] WebSocket server initialized");
  return wss;
}

async function handleClientMessage(
  ws: WebSocket,
  session: SessionState,
  message: ClientMessage,
): Promise<void> {
  switch (message.type) {
    case "AUDIO_CHUNK": {
      const result = await handleAudioChunk(session, message);
      session.chunkCount++;

      sendMessage(ws, {
        type: "CHUNK_RECEIVED",
        sequence: message.sequence,
        totalChunks: session.chunkCount,
        timestamp: Date.now(),
      });

      // Log progress every 10 chunks
      if (session.chunkCount % 10 === 0) {
        console.log(
          `[WS] Session ${session.id}: received ${session.chunkCount} chunks`,
        );
      }
      break;
    }

    case "END_SESSION": {
      console.log(`[WS] Client requested session end: ${session.id}`);
      const result = await finalizeSession(session);

      sendMessage(ws, {
        type: "SESSION_ENDED",
        sessionId: session.id,
        result,
        timestamp: Date.now(),
      });
      break;
    }

    case "PING": {
      sendMessage(ws, {
        type: "PONG",
        timestamp: Date.now(),
      });
      break;
    }

    default: {
      console.warn(`[WS] Unknown message type:`, message);
    }
  }
}

function sendMessage(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
