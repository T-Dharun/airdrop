const express = require("express");
const cors = require("cors");
const WebSocketServer = require("./ws/WebSocketServer");

const app = express();
app.use(cors());

new WebSocketServer(5000);
