import { useEffect, useState, useRef } from "react";
import useWebRTC from "./useWebRTC";

const useWebsocket = (url) => {
    const {
        data,
        createOffer,
        createAnswer,
        finalizeConnection,
        sendDataToPeer
    } = useWebRTC();

    const [currentInstance, setCurrentInstance] = useState({});
    const socketRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(url);
        socketRef.current = ws;
        ws.onopen = () => console.log("opened");
        ws.onmessage = (res) => {
            const data = JSON.parse(res?.data);
            handleMessage(data);
        }
        ws.onclose = () => {
            console.log("Connection closed with ID : "+currentInstance.clientId);
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
                    console.log("Offer Received and Reponse the Answer");
                })();
                break;
            case 'answer':
                (async () => {
                    finalizeConnection(data.payload);
                })();
                break;
            case 'error':
                console.log(data.error);
                break;
        }
    }

    const initialize = async (remoteClient) => {
        const offerStr= await createOffer();
        console.log("Offer created and Requested to the Peer.");
        sendMessage('offer',remoteClient?.current, offerStr);
    }

    const sendData=(fileslice)=>{
        sendDataToPeer(fileslice);
    }

    return { currentInstance, data, sendData, initialize };
}

export default useWebsocket;