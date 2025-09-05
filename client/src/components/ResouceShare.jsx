import React from "react";
import { useRef } from "react";
import useWebsocket from "../hooks/useWebsocket";

const ResourceShare = () => {
    const {
        currentInstance,
        data,
        sendData,
        initialize
    } = useWebsocket("ws://10.194.130.1:5000");

    const remoteClient = useRef();
    const fileData = useRef();
    console.log(data);
    const handleFile = () => {
        const file = fileData.current.files[0];
        sendData(
            JSON.stringify({ type: "file-meta", name: file.name, mime: file.type })
        );
        console.log(file);
            

        const chunksize = 16 * 1024;
        let offset = 0;

        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target.result;
            console.log(buffer.byteLength)
            while (offset <= buffer.byteLength) {
                const slice = buffer.slice(offset, offset + chunksize);
                sendData(slice);
                console.log(slice);
                offset += chunksize;
            }
            sendData("EOF");
        }
        reader.readAsArrayBuffer(file);
    }

    return (
        <>
            <h1 >Client ID : {currentInstance.clientId || "- - - - - "}</h1>
            <input onChange={(e) => remoteClient.current = e.target.value} />
            <button onClick={() => initialize(remoteClient)}>
                Send
            </button>
            <div>
                {
                    data.map((item, i) => {
                        if (item.type != 'file') return;
                        const url = URL.createObjectURL(item.blob);
                        return <div key={i}><a key={i} href={url} download={item.name}>Download {item.name}</a></div>
                    }
                    )}
            </div>
            <section>
                <input type="file" onChange={(e) => fileData.current = e.target} />
                <button onClick={handleFile}>Send</button>
                
            </section>
        </>
    )
}

export default ResourceShare;