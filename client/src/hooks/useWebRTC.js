import { useRef, useState } from "react"

const useWebRTC = () => {
    const [offer, setOffer] = useState();
    const [answer, setAnswer] = useState();
   
    const [data, setData] = useState([
//   {
//     name: "report.pdf",
//     type: "file",
//     blob: new Blob(["%PDF-1.4 sample content..."], { type: "application/pdf" })
//   },
//   {
//     name: "imagfsadfsadfsdafsadfe.png",
//     type: "file",
//     blob: new Blob(["fake-binary-data"], { type: "image/png" })
//   },
//   {
//     name: "notesffsdfsadfsdfdsaffasdf.txt",
//     type: "file",
//     blob: new Blob(["Hello, this is a sample text file."], { type: "text/plain" })
//   }
]);

    const [isConnected, setIsConnected] = useState(false);
    const [receivingProgress, setReceivingProgress] = useState({});
    const peerRef = useRef();
    const channelRef = useRef();

    const createOffer = async () => {
        peerRef.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        })
        let receivedChunks = [];
        let fileHeader = {};
        let receivedBytes = 0;
        channelRef.current = peerRef.current.createDataChannel("payload");
        channelRef.current.onmessage = (e) => {
            const slice = e.data;
            try {
                const header = JSON.parse(slice);
                if (header.type === "file-meta") {
                    fileHeader = header;
                    receivedBytes = 0;
                    receivedChunks = [];
                    // Initialize progress tracking
                    setReceivingProgress(prev => ({
                        ...prev,
                        [header.name]: { received: 0, total: header.size, name: header.name }
                    }));
                    return;
                }
            } catch {}
            
            if (slice === "EOF") {
                const blob = new Blob(receivedChunks, { type: fileHeader.mime });
                setData(prev => [
                    ...prev,
                    {
                        type: "file",
                        name: fileHeader.name,
                        blob: blob
                    }
                ]);
                // Clear progress tracking
                setReceivingProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[fileHeader.name];
                    return newProgress;
                });
                receivedChunks = [];
                receivedBytes = 0;
            } else {
                receivedChunks.push(slice);
                receivedBytes += slice.byteLength || slice.length || 0;
                // Update progress
                if (fileHeader.size) {
                    const progress = Math.min((receivedBytes / fileHeader.size) * 100, 100);
                    setReceivingProgress(prev => ({
                        ...prev,
                        [fileHeader.name]: { 
                            received: receivedBytes, 
                            total: fileHeader.size, 
                            name: fileHeader.name,
                            progress: progress
                        }
                    }));
                }
            }
        }
                channelRef.current.onclose = (e) => {
                    setData([])
                    console.log("Data channel closed");
                }
                peerRef.current.onconnectionstatechange = () => {
                    console.log(peerRef.current.connectionState);
                    if (peerRef.current.connectionState === 'connected') {
                        setIsConnected(true);
                    } else if (peerRef.current.connectionState === 'disconnected' || 
                               peerRef.current.connectionState === 'failed' || 
                               peerRef.current.connectionState === 'closed') {
                        setIsConnected(false);
                    }
                }
                const desc = await peerRef.current.createOffer();
                await peerRef.current.setLocalDescription(desc);

                return new Promise((resolve) => {
                    peerRef.current.onicecandidate = (event) => {
                        if (!event.candidate) {
                            const offerStr = JSON.stringify(peerRef.current.localDescription);
                            setOffer(offerStr);
                            resolve(offerStr);
                        }
                    };
                });
            }

            const createAnswer = async (remoteOffer) => {
                peerRef.current = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
                })
                let receivedChunks = [];
                let fileHeader = {};
                
                peerRef.current.onconnectionstatechange = () => {
                    console.log(peerRef.current.connectionState);
                    if (peerRef.current.connectionState === 'connected') {
                        setIsConnected(true);
                    } else if (peerRef.current.connectionState === 'disconnected' || 
                               peerRef.current.connectionState === 'failed' || 
                               peerRef.current.connectionState === 'closed') {
                        setIsConnected(false);
                    }
                }
                
                peerRef.current.ondatachannel = (e) => {
                    channelRef.current = e.channel;
                    let receivedBytes = 0;
                    channelRef.current.onmessage = (e) => {
                        const slice = e.data;
                        console.log(slice);
                        try {
                            const header = JSON.parse(slice);
                            if (header.type === "file-meta") {
                                fileHeader = header;
                                receivedBytes = 0;
                                receivedChunks = [];
                                // Initialize progress tracking
                                setReceivingProgress(prev => ({
                                    ...prev,
                                    [header.name]: { received: 0, total: header.size, name: header.name }
                                }));
                                return;
                            }
                        } catch {}
                        
                        if (slice === "EOF") {
                            const blob = new Blob(receivedChunks, { type: fileHeader.mime });
                            setData(prev => [
                                ...prev,
                                {
                                    type: "file",
                                    name: fileHeader.name,
                                    blob: blob
                                }
                            ]);
                            // Clear progress tracking
                            setReceivingProgress(prev => {
                                const newProgress = { ...prev };
                                delete newProgress[fileHeader.name];
                                return newProgress;
                            });
                            receivedChunks = [];
                            receivedBytes = 0;
                            console.log(`${fileHeader.name} is received successfully`);
                        } else {
                            receivedChunks.push(slice);
                            receivedBytes += slice.byteLength || slice.length || 0;
                            // Update progress
                            if (fileHeader.size) {
                                const progress = Math.min((receivedBytes / fileHeader.size) * 100, 100);
                                setReceivingProgress(prev => ({
                                    ...prev,
                                    [fileHeader.name]: { 
                                        received: receivedBytes, 
                                        total: fileHeader.size, 
                                        name: fileHeader.name,
                                        progress: progress
                                    }
                                }));
                            }
                        }
                    }
                    channelRef.current.onclose = (e) => {
                        setData([])
                        console.log("Data channel closed");
                    }
                }
                await peerRef.current.setRemoteDescription(JSON.parse(remoteOffer));
                const desc = await peerRef.current.createAnswer();
                await peerRef.current.setLocalDescription(desc);

                return new Promise((resolve) => {
                    peerRef.current.onicecandidate = (event) => {
                        if (!event.candidate) {
                            const answerStr = JSON.stringify(peerRef.current.localDescription);
                            setAnswer(answerStr);
                            resolve(answerStr);
                        }
                    }
                })

            }

            const finalizeConnection = async (remoteAnswer) => {
                await peerRef.current.setRemoteDescription(JSON.parse(remoteAnswer));
                console.log("Connection established succesfully");
            }

            const sendDataToPeer = (message) => {
                if (channelRef?.current?.readyState === "open") {
                    console.log('Me : ' + message);
                    channelRef.current.send(message);

                }
            }

            return {
                offer,
                answer,
                data,
                isConnected,
                receivingProgress,
                createOffer,
                createAnswer,
                finalizeConnection,
                sendDataToPeer
            }
        }

        export default useWebRTC;