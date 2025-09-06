import { useEffect, useState, useRef } from "react";
import useWebRTC from "./useWebRTC";

const useWebsocket = (url) => {
    const {
        data,
        isConnected,
        receivingProgress,
        createOffer,
        createAnswer,
        finalizeConnection,
        sendDataToPeer,
        disconnectWebRTC
    } = useWebRTC();

    const [currentInstance, setCurrentInstance] = useState({});
    const socketRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(url);
        socketRef.current = ws;
        ws.onopen = () => console.log("websocket opened");
        ws.onmessage = (res) => {
            const data = JSON.parse(res?.data);
            handleMessage(data);
        }
        ws.onclose = () => {
            console.log("websocket Connection closed with ID : "+currentInstance?.clientId);
            setCurrentInstance({});
        };
    }, []);

    const sendMessage = (type, to, payload) => {
        const packet = JSON.stringify({
            type:type,
            from: currentInstance.clientId,
            to:to,
            payload: payload
        });
        socketRef.current.send(packet);
    }

    const handleMessage = (data) => {
        switch (data.type) {
            case 'welcome':
                setCurrentInstance(prev => ({ ...prev, clientId: data.clientId }));
                break;
            case 'offer':
                (async () => {
                    const answerStr = await createAnswer(data.payload);
                    sendMessage("answer", data.from, answerStr); 
                    setCurrentInstance(prev=>({...prev,message:'Accepted the offer !!'}));
                })();
                break;
            case 'answer':
                (async () => {
                    finalizeConnection(data.payload);
                    setCurrentInstance(prev=>({...prev,message:'Connection Established'}));
                })();
                break;
            case 'error':
                setCurrentInstance(prev=>({...prev,message:data.error}));
                break;
        }
    }

    const initialize = async (remoteCode) => {
        const offerStr= await createOffer();
        setCurrentInstance(prev=>({...prev,message:'Requested send to Peer'}));
        sendMessage('offer',remoteCode, offerStr);
    }

    const sendData=(fileslice)=>{
        sendDataToPeer(fileslice);
    }

    const disconnect = () => {
        // Close WebRTC connection but keep WebSocket alive
        disconnectWebRTC();
        setCurrentInstance(prev => ({ ...prev, message: 'Disconnected' }));
    }

    return { currentInstance, data, isConnected, receivingProgress, sendData, initialize, disconnect };
}

export default useWebsocket;