import { useEffect, useRef } from "react";
import { config } from "../lib/config";

export function useRoom(roomId: string, localVideoRef: React.RefObject<HTMLVideoElement | null>, remoteVideoRef: React.RefObject<HTMLVideoElement | null>) {
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const remoteStream = new MediaStream();
  const localStreamRef = useRef<MediaStream | null>(null);
  const isCaller = useRef(false);

  // Ice config
  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
  ];

  useEffect(() => {
    if (!roomId) return;

    // 1. Connect to socket
    socketRef.current = new WebSocket(config.socketURL);

    socketRef.current.onopen = () => {
      console.log("🟢 WebSocket connected");
      socketRef.current?.send(JSON.stringify({
        type: "join-room",
        roomId
      }));
    };

    // 2. Handle signaling messages
    socketRef.current.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        console.log(`📩 message at ${new Date().toISOString()}`, msg);
      
        switch (msg.type) {
          case "room-info":
            isCaller.current = msg.payload.isCaller;
            console.log("🧭 Role:", isCaller.current ? "Caller (will create offer)" : "Callee (wait for offer)");
      
            if (isCaller.current && peerConnectionRef.current) {
              const offer = await peerConnectionRef.current.createOffer();
              await peerConnectionRef.current.setLocalDescription(offer);
              socketRef.current?.send(JSON.stringify({
                type: "offer",
                roomId,
                payload: { sdp: offer }
              }));
              console.log("📤 Offer sent");
            }
            break;
      
            case "offer":
                console.log("📨 Received offer");
              
                if (peerConnectionRef.current) {
                  await handleOffer(msg.payload.sdp);
                } else {
                  console.warn("⚠️ PeerConnection not ready, buffering offer...");
                  pendingOfferRef.current = msg.payload.sdp;
                }
                break;
              
      
          case "answer":
            console.log("📨 Received answer");
            await handleAnswer(msg.payload.sdp);
            break;
      
          case "ice-candidate":
            console.log("📨 Received ICE candidate");
            await addIceCandidate(msg.payload.candidate);
            break;
      
          default:
            console.warn("⚠️ Unknown message type:", msg.type);
        }
      };
      

    // 3. Setup media + peer connection
    setupMediaAndConnection();

    // Cleanup
    return () => {
      peerConnectionRef.current?.close();
      socketRef.current?.close();
    };
  }, [roomId]);

  const setupMediaAndConnection = async () => {
    // 4. Get user media
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = localStream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // 5. Create peer connection
    const peerConnection = new RTCPeerConnection({ iceServers });
    peerConnectionRef.current = peerConnection;

    // 6. Add tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // 7. Remote stream handling
   
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
 
    
    peerConnection.ontrack = (event) => {
        console.log("[ontrack triggered] Got remote stream track(s):", event.streams);
      
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(e => {
            console.warn("⚠️ Video play() failed:", e);
          });
        }
      };
      
    // 8. Handle ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.send(JSON.stringify({
          type: "ice-candidate",
          roomId,
          payload: { candidate: event.candidate }
        }));
      }
    };

    // 9. Create offer if you're the first in room
    peerConnection.onnegotiationneeded = async () => {

      if (isCaller.current) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketRef.current?.send(JSON.stringify({
          type: "offer",
          roomId,
          payload: { sdp: offer }
        }));
      }
    };

    // 10. Handle pending offer
    if (pendingOfferRef.current) {
        console.log("🕘 Applying buffered offer...");
        await handleOffer(pendingOfferRef.current);
        pendingOfferRef.current = null;
      }
      
  
      
  };

  const handleOffer = async (sdp: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    socketRef.current?.send(JSON.stringify({
      type: "answer",
      roomId,
      payload: { sdp: answer }
    }));
  };

  const handleAnswer = async (sdp: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    console.log("peerConnection handleAnswer :", peerConnectionRef.current)
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
  };

  const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("❌ Failed to add ICE candidate", error);
    }
  };
}
