import type { Peer, DataConnection } from "peerjs";
import { getHostPeerId, peerConfig } from "./config";

const dataListeners: Set<(data: any, sender: string) => void> = new Set();
const connectionListeners: Set<(peer: string) => void> = new Set();
const disconnectionListeners: Set<(peer: string) => void> = new Set();

const connections: DataConnection[] = [];

export const hostPeer = {
  onConnection: (listener: (peer: string) => void) => {
    connectionListeners.add(listener);
  },
  offConnection: (listener: (peer: string) => void) => {
    connectionListeners.delete(listener);
  },
  onDisconnection: (listener: (peer: string) => void) => {
    disconnectionListeners.add(listener);
  },
  offDisconnection: (listener: (peer: string) => void) => {
    disconnectionListeners.delete(listener);
  },
  onData: (listener: (data: any, sender: string) => void) => {
    dataListeners.add(listener);
  },
  offData: (listener: (data: any, sender: string) => void) => {
    dataListeners.delete(listener);
  },
  messageAll: (data: any) => {
    connections.forEach((conn) => {
      conn.send(data);
    });
  },
  messagePlayer: (id: string, data: any) => {
    const conn = connections.find((conn) => conn.peer === id);
    if (conn) {
      conn.send(data);
    } else {
      console.warn("Player not found:", id);
      console.warn("Tried to send:", data);
    }
  },
};

export async function tryCreateHostPeer(id: string) {
  connections.length = 0;

  const Peer = (await import("peerjs")).default;
  const peer = new Peer(getHostPeerId(id), peerConfig);

  return new Promise<Peer | null>((resolve, reject) => {
    peer.on("open", () => {
      console.log("Host peer open:", id);
      resolve(peer);
    });

    peer.on("connection", (newConn) => {
      console.log("[Host] Connection from", newConn.peer);

      newConn.on("open", () => {
        console.log("[Host] Connection established to guest", newConn.peer);

        connections.push(newConn);

        for (const listener of connectionListeners) {
          listener(newConn.peer);
        }

        // Send initial state to new guest
        // console.log("[Host] Sending initial state to", newConn.peer);
        // const state = Object.fromEntries(
        //   Object.entries(gameState).map(([key, value]) => [key, value.get()])
        // );
        // newConn.send({ type: "init-state", state });

        newConn.on("data", (message) => {
          for (const listener of dataListeners) {
            listener(message, newConn.peer);
          }
        });

        newConn.on("close", () => {
          console.log("[Host] Connection closed from", newConn.peer);
          const index = connections.indexOf(newConn);
          connections.splice(index, 1);
          // connections.forEach((conn) => {
          //   void conn.send({ type: "guest-disconnected", id: newConn.peer });
          // });
          for (const listener of disconnectionListeners) {
            listener(newConn.peer);
          }
        });

        window.addEventListener("beforeunload", () => {
          newConn.close();
        });
      });
    });

    peer.on("error", (error) => {
      if (error.type === "unavailable-id") {
        peer.destroy();
        resolve(null);
      } else {
        console.error(
          "Unexpected error occurred while trying to create host peer:",
          error.type,
          error.message,
          error
        );
        reject(error);
      }
    });
  });
}
