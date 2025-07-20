import { WebSocketServer, WebSocket } from "ws";
import express from "express";

const app = express();
const wss = new WebSocketServer({ port: 8080 });
const rooms: Record<string, WebSocket[]> = {};

app.get("/status", (_, res) => {
  res.send("Server is running");
});

wss.on("connection", (ws) => {
  console.log("👥 New client connected");

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());

// When a client joins
if (msg.type === "join-room") {
  const { roomId } = msg;

  if (!rooms[roomId]) {
    rooms[roomId] = [];
  }

  rooms[roomId].push(ws);
  console.log(`✅ Client joined room ${roomId} (${rooms[roomId].length} total)`);

  // Send room-info to all clients in room
  rooms[roomId].forEach((client, index) => {
    const isCaller = index === 0; // First client is the caller
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: "room-info",
        payload: { isCaller }
      }));
    }
  });
}


    // Broadcast signaling messages to everyone else in the same room
    if (["offer", "answer", "ice-candidate"].includes(msg.type)) {
      const { roomId } = msg;
      console.log("receved an ::", msg.type)
      rooms[roomId]?.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("🔌 Client disconnected");
    // Clean up from all rooms
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(client => client !== ws);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

app.listen(3000, () => {
  console.log("🚀 HTTP server on 3000");
  console.log("📡 WebSocket server on 8080");
});
