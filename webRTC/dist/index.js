"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const wss = new ws_1.WebSocketServer({ port: 8080 });
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
            }
        });
    });
});
app.listen(3000, () => {
    console.log("Server started on port 3000");
});
