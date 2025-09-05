import { useRef, useState } from "react"

const useWebRTC = () => {
    const [offer, setOffer] = useState();
    const [answer, setAnswer] = useState();
    const [data, setData] = useState([]);
    const peerRef = useRef();
    const channelRef = useRef();

    const createOffer = async () => {
        peerRef.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        })
        let receivedChunks = [];
            let fileHeader={};
        channelRef.current = peerRef.current.createDataChannel("payload");
        channelRef.current.onmessage = (e) => {
            
                    const slice = e.data;
                    console.log(slice);
                    try{
                        const header=JSON.parse(slice);
                        console.log(header);
                            if(header.type=="file-meta"){
                                fileHeader=header;
                                return;
                            }
                    }
                    catch {}
                    if (slice === "EOF") {
                        const blob = new Blob(receivedChunks,{type:fileHeader.mime});
                        receivedChunks = [];
                        setData(prev => [
                            ...prev,
                            {
                                type: "file",
                                name: fileHeader.name,
                                blob: blob
                            }
                        ]);
                    }
                    else {
                        receivedChunks.push(slice);
                    }

                }
                channelRef.current.onclose = (e) => {
                    setData([])
                    console.log("Data channel closed");
                }
                peerRef.current.onconnectionstatechange = () => {
                    console.log(peerRef.current.connectionState);
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
                peerRef.current.ondatachannel = (e) => {
                    channelRef.current = e.channel;
                    channelRef.current.onmessage = (e) => {
                        const slice = e.data;
                        console.log(slice);
                        try{
                            const header=JSON.parse(slice);
                            if(header.type=="file-meta"){
                                fileHeader=header;
                                return;
                            }
                        }
                        catch{}
                        console.log(fileHeader);
                        if (slice === "EOF") {
                            const blob = new Blob(receivedChunks,{type:fileHeader.mime});
                            receivedChunks = [];
                            setData(prev => [
                                ...prev,
                                {
                                    type: "file",
                                    name: fileHeader.name,
                                    blob: blob
                                }
                            ]);
                            console.log(`${fileHeader.name} is received successfully`);
                        }
                        else {
                            receivedChunks.push(slice);
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
                    setData(prev => [...prev, 'me : ' + message]);
                    channelRef.current.send(message);

                }
            }

            return {
                offer,
                answer,
                data,
                createOffer,
                createAnswer,
                finalizeConnection,
                sendDataToPeer
            }
        }

        export default useWebRTC;