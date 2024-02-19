import type { Peer, DataConnection } from "peerjs";
import { iceServers } from "~/networking/peering/config";
import { getHostPeerId } from "./getHostPeerId";
import { gameState } from "~/logic/gameState";

export async function tryCreateHostPeer(id: string) {
  const connections: DataConnection[] = [];

  const Peer = (await import("peerjs")).default;
  const peer = new Peer(getHostPeerId(id), {
    config: {
      iceServers: iceServers,
    },
  });

  return new Promise<Peer | null>((resolve, reject) => {
    peer.on("open", () => {
      console.log("Host peer open:", id);
      resolve(peer);
    });

    peer.on("connection", (newConn) => {
      console.log("[Host] Connection from", newConn.peer);

      newConn.on("open", () => {
        console.log("[Host] Connection established to guest", newConn.peer);

        // Send initial state to new guest
        console.log("[Host] Sending initial state to", newConn.peer);
        const state = Object.fromEntries(
          Object.entries(gameState).map(([key, value]) => [key, value.get()]),
        );
        newConn.send({ type: "init-state", state });

        newConn.on("data", (message) => {
          const data = message as { type: "rpc"; method: string; args: any[] };
          if (data.type === "rpc") {
            console.log(
              "[Host] RPC from",
              newConn.peer,
              ":",
              data.method,
              data.args,
            );
            connections.forEach((conn) => {
              void conn.send({
                type: "rpc",
                sender: newConn.peer,
                method: data.method,
                args: data.args,
              });
            });
          }
        });

        connections.push(newConn);

        newConn.on("close", () => {
          console.log("[Host] Connection closed from", newConn.peer);
          const index = connections.indexOf(newConn);
          connections.splice(index, 1);
          connections.forEach((conn) => {
            void conn.send({ type: "guest-disconnected", id: newConn.peer });
          });
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
          error,
        );
        reject(error);
      }
    });
  });
}
