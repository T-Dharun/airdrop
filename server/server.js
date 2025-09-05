const express = require("express");
const cors = require("cors");
const WebSocketServer = require("./ws/WebSocketServer");

const app = express();
app.use(cors());

app.get("/", (req, res) => res.send("server alive."));

const PORT = 5001;
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));


new WebSocketServer(5000);
