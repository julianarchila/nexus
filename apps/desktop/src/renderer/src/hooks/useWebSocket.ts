import { useCallback, useEffect, useRef, useState } from "react";
import type {
  WebSocketStatus,
  ServerMessage,
  ClientMessage,
  SessionStartedMessage,
  ChunkReceivedMessage,
  SessionEndedMessage,
} from "../../../shared/types";

interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
  onSessionStarted?: (message: SessionStartedMessage) => void;
  onChunkReceived?: (message: ChunkReceivedMessage) => void;
  onSessionEnded?: (message: SessionEndedMessage) => void;
  onError?: (error: string) => void;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  sessionId: string | null;
  chunksReceived: number;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: ClientMessage) => void;
  sendAudioChunk: (data: string, sequence: number, duration: number) => void;
  endSession: () => void;
}

export function useWebSocket({
  url,
  autoConnect = false,
  onSessionStarted,
  onChunkReceived,
  onSessionEnded,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chunksReceived, setChunksReceived] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store callbacks in refs to avoid dependency issues
  const callbacksRef = useRef({
    onSessionStarted,
    onChunkReceived,
    onSessionEnded,
    onError,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onSessionStarted,
      onChunkReceived,
      onSessionEnded,
      onError,
    };
  }, [onSessionStarted, onChunkReceived, onSessionEnded, onError]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((message: ServerMessage) => {
    const callbacks = callbacksRef.current;

    switch (message.type) {
      case "SESSION_STARTED":
        console.log("[WS] Session started:", message.sessionId);
        setSessionId(message.sessionId);
        setChunksReceived(0);
        callbacks.onSessionStarted?.(message);
        break;

      case "CHUNK_RECEIVED":
        setChunksReceived(message.totalChunks);
        callbacks.onChunkReceived?.(message);
        break;

      case "SESSION_ENDED":
        console.log("[WS] Session ended:", message.result);
        callbacks.onSessionEnded?.(message);
        break;

      case "ERROR":
        console.error("[WS] Server error:", message.error);
        callbacks.onError?.(message.error);
        break;

      case "PONG":
        // Connection is alive
        break;

      default:
        console.warn("[WS] Unknown message type:", message);
    }
  }, []);

  const connect = useCallback(() => {
    console.log(
      "[WS] connect() called, current state:",
      wsRef.current?.readyState,
    );
    console.log("[WS] Attempting to connect to:", url);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected, skipping");
      return;
    }

    cleanup();
    setStatus("connecting");

    try {
      console.log("[WS] Creating new WebSocket...");
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected to server successfully!");
        setStatus("connected");

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING", timestamp: Date.now() }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("[WS] Error parsing message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("[WS] Connection closed:", event.code, event.reason);
        console.log("[WS] Close event details - wasClean:", event.wasClean);
        setStatus("disconnected");
        setSessionId(null);
        cleanup();
      };

      ws.onerror = (error) => {
        console.error("[WS] WebSocket error event:", error);
        console.error("[WS] WebSocket readyState:", ws.readyState);
        console.error("[WS] URL was:", url);
        setStatus("error");
        callbacksRef.current.onError?.("WebSocket connection error");
      };
    } catch (error) {
      console.error("[WS] Error creating WebSocket:", error);
      console.error(
        "[WS] Error details:",
        error instanceof Error ? error.message : error,
      );
      setStatus("error");
      callbacksRef.current.onError?.(
        error instanceof Error ? error.message : "Failed to connect",
      );
    }
  }, [url, cleanup, handleMessage]);

  const disconnect = useCallback(() => {
    cleanup();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
    setSessionId(null);
  }, [cleanup]);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WS] Cannot send message - not connected");
    }
  }, []);

  const sendAudioChunk = useCallback(
    (data: string, sequence: number, duration: number) => {
      sendMessage({
        type: "AUDIO_CHUNK",
        data,
        sequence,
        timestamp: Date.now(),
        duration,
      });
    },
    [sendMessage],
  );

  const endSession = useCallback(() => {
    sendMessage({
      type: "END_SESSION",
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    sessionId,
    chunksReceived,
    connect,
    disconnect,
    sendMessage,
    sendAudioChunk,
    endSession,
  };
}
