import { WebSocketServer } from "ws";
import express from "express";

const app = express();
const wss = new WebSocketServer({ port: 8080 });


app.get("/status", (req, res) => {
    res.send("Server is running");
});

wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.on('message', function incoming(message) {
        // Broadcast to all other clients
        wss.clients.forEach(function each(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
            console.log("Message sent to client");
          }
        });
    }); 
});

app.listen(3000, () => {
    console.log("\n>> Server started on port 3000 \n>> WebSocket server started on port 8080");
});

