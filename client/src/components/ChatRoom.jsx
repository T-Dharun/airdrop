import { useState } from "react";
import useWebRTC from "../hooks/useWebRTC";

export default function ChatRoom() {
  const {
    offer,
    answer,
    chat,
    createOffer,
    createAnswer,
    finalizeConnection,
    sendMessage,
  } = useWebRTC();

  const [message, setMessage] = useState("");
  const [off,setOffer]=useState();
  const [ans,setAnswer]=useState();
  console.log(ans);
  return (
    <div>
      <h2>WebRTC dChat</h2>

      <button onClick={createOffer}>Create Offer (Peer A)</button>
      <textarea value={offer} onChange={(e)=>setOffer(e.target.value)} placeholder="Offer JSON" />

      <button onClick={() => createAnswer(off)}>Create Answer (Peer B)</button>
      <textarea value={answer} onChange={(e)=>setAnswer(e.target.value)} placeholder="Answer JSON" />

      <button onClick={() => finalizeConnection(ans)}>Finalize</button>

      <div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={() => sendMessage(message)}>Send</button>
      </div>

      <div>
        <h3>Chat:</h3>
        {chat.map((c, i) => (
          <p key={i}>{c}</p>
        ))}
      </div>
    </div>
  );
}
