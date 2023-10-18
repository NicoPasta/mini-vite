import connect from "connect";
import picocolors from "picocolors";
import { WebSocketServer, WebSocket } from "ws";
import { HMR_PORT } from "./constants.js";

const { red } = picocolors;

export const createWebSocketServer = () => {
  let wss;

  wss = new WebSocketServer({ port: HMR_PORT });
  wss.on("connection", (socket) => {
    // 告诉客户端ws已经连上了
    socket.send(JSON.stringify({ type: "connected" }));
  });
  wss.on("error", () => {
    console.error(red(`WebSocket server error:\n${JSON.stringify(e)}`));
  });

  return {
    send(payload) {
      const json = JSON.stringify(payload);
      wss.clients.forEach((c) => {
        if (c.readyState === WebSocket.OPEN) {
          c.send(json);
        }
      });
    },
    close() {
      wss.close();
    },
  };
};
