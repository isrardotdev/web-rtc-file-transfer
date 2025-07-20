// src/page/Room.tsx
import { useRef } from "react";
import { useParams } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";

export default function Room() {
  const { roomId } = useParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Hook up WebSocket + WebRTC magic
  useRoom(roomId!, localVideoRef, remoteVideoRef);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 py-8">
      <h1 className="text-xl text-gray-300 mb-4">
        Connected to Room:{" "}
        <span className="text-green-400 font-mono text-lg">{roomId}</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-5xl">
        {/* Local Video */}
        <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 text-sm rounded text-white">
            You
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 text-sm rounded text-white">
            Stranger
          </div>
        </div>
      </div>
    </div>
  );
}
