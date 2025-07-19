import './App.css';
import { useEffect, useRef, useState } from 'react';

function App() {
  const [remote, setRemote] = useState('');
  const [answer, setAnswer] = useState('');
  const [iceInput, setIceInput] = useState('');
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // For Peer A (who creates offer)
    dataChannel.current = peerConnection.current.createDataChannel('chat');

    dataChannel.current.onopen = () => {
      console.log('✅ DataChannel is OPEN');
      dataChannel.current?.send('Hello peer!');
    };

    dataChannel.current.onmessage = (e) => {
      console.log('📨 Got message:', e.data);
    };

    // For Peer B (who receives offer)
    peerConnection.current.ondatachannel = (event) => {
      console.log('📦 Got incoming data channel');
      dataChannel.current = event.channel;

      dataChannel.current.onopen = () => {
        console.log('✅ DataChannel is OPEN (from incoming channel)');
        dataChannel.current?.send('Hello from Peer B!');
      };

      dataChannel.current.onmessage = (e) => {
        console.log('📨 Peer B received:', e.data);
      };
    };

    // ICE Candidate handling
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('❄️ ICE Candidate:', JSON.stringify(event.candidate));
      }
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      console.log('🌐 ICE State:', peerConnection.current?.iceConnectionState);
    };

    peerConnection.current.onconnectionstatechange = () => {
      console.log('🛰 Connection State:', peerConnection.current?.connectionState);
    };
  }, []);

  const createOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peerConnection.current) return;

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    console.log('📤 Offer SDP:', JSON.stringify(offer));
  };

  const handleSetRemote = async () => {
    if (!peerConnection.current) return;

    const remoteDesc = new RTCSessionDescription(JSON.parse(remote));
    await peerConnection.current.setRemoteDescription(remoteDesc);
    console.log('✅ Remote description set');

    // If acting as Peer B (answerer)
    if (remoteDesc.type === 'offer') {
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log('📤 Answer SDP:', JSON.stringify(answer));
    }
  };

  const handleSetAnswer = async () => {
    const desc = new RTCSessionDescription(JSON.parse(answer));
    await peerConnection.current?.setRemoteDescription(desc);
    console.log('✅ Answer set! Connection should be live');
  };

  const handleAddIce = async () => {
    if (!peerConnection.current) return;
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(JSON.parse(iceInput)));
      console.log('✅ ICE candidate added!');
    } catch (err) {
      console.error('❌ Failed to add ICE', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🛰 WebRTC Manual Signaling</h1>

      <form onSubmit={createOffer}>
        <button type="submit">Generate Offer (Peer A)</button>
      </form>

      <br />
      <h3>Paste Offer from Peer A / Answer from Peer B</h3>
      <textarea
        rows={8}
        cols={80}
        value={remote}
        onChange={(e) => setRemote(e.target.value)}
        placeholder="Paste SDP here"
      />
      <br />
      <button onClick={handleSetRemote}>Set Remote Description</button>

      <br /><br />
      <h3>Paste Answer from Peer B (only for Peer A)</h3>
      <textarea
        rows={8}
        cols={80}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Paste Answer SDP here"
      />
      <br />
      <button onClick={handleSetAnswer}>Set Answer</button>

      <br /><br />
      <h3>Paste ICE Candidate</h3>
      <textarea
        rows={6}
        cols={80}
        value={iceInput}
        onChange={(e) => setIceInput(e.target.value)}
        placeholder="Paste ICE candidate here"
      />
      <br />
      <button onClick={handleAddIce}>Add ICE Candidate</button>
    </div>
  );
}

export default App;
