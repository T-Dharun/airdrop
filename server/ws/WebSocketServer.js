const websocket = require("ws");

class WebSocketServer {
  constructor(port) {
    this.wss = new websocket.Server({ port });
    this.clients = {};

    this.wss.on("connection", (ws) => this.handleConnection(ws));
    console.log(`WebSocket server started on port ${port}`);
  }

  generateRandomId() {
    return Math.random().toString().substr(2, 5);
  }

  handleConnection(ws) {
    const clientId = this.generateRandomId();
    this.clients[clientId] = ws;
    console.log(`Client ${clientId} connected`);

    ws.send(JSON.stringify({ type: "welcome", clientId }));

    ws.on("message", (msg) => {
      const data = JSON.parse(msg.toString());
      this.handleMessage(data);
    });

    ws.on("close", () => {
      console.log(`Client ${clientId} disconnected`);
      delete this.clients[clientId];
    });
  }

  handleMessage(data) {
    switch (data.type) {
      case "offer":
      case "answer":
        this.sendMessage(data);
        break;
      default:
        console.log("Unknown message type:", data);
    }
  }

  sendMessage(data) {
    const remotePeer = this.clients[data.to];
    if (!remotePeer) {
      const source = this.clients[data.from];
      if(source){
        this.sendError(source,"Targeted peer not exist");
      }
      return;
    }
    remotePeer.send(JSON.stringify(data));
  }

  sendError(client,err){
    console.log("Error");
    client.send(JSON.stringify({type:'error',error:err}));
  }
}

module.exports = WebSocketServer;
