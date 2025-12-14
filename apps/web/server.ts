import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { setupWebSocketServer } from "./src/core/websocket/server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

console.log(
  "[Server] Starting server in",
  dev ? "development" : "production",
  "mode",
);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log("[Server] Next.js app prepared");

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  // Setup WebSocket server on the same HTTP server
  console.log("[Server] Setting up WebSocket server...");
  setupWebSocketServer(server);

  server.listen(port, () => {
    console.log(`[Server] Ready on http://${hostname}:${port}`);
    console.log(
      `[Server] WebSocket server ready on ws://${hostname}:${port}/ws`,
    );
  });

  server.on("error", (err) => {
    console.error("[Server] Server error:", err);
  });

  server.on("upgrade", (req, socket, head) => {
    console.log("[Server] Upgrade request received for:", req.url);
  });
});
