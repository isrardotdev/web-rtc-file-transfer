import { useNavigate } from "react-router-dom";
import { createRoomId } from "../utils/helper.ts";

export default function Home() {
    const navigate = useNavigate();
  
    const handleStartCall = () => {
      const newRoomId = createRoomId();
      navigate(`/room/${newRoomId}`);
    };
  
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-8">🧿 WebRTC Video Call</h1>
        <button
          onClick={handleStartCall}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-medium transition"
        >
          Start a Video Call
        </button>
      </div>
    );
}