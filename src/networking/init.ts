import { createPlayerPeer, playerPeer } from "./peering/player";
import { hostPeer } from "./peering/host";
import { reconcile, unwrap } from "solid-js/store";
import { gameState, setGameState } from "~/state/gameState";
import { connectionStatus } from "./state";

export function connectToRoom(roomId: string) {
  if (connectionStatus() !== "disconnected") {
    console.warn(`Connection already in progress`, connectionStatus());
    return;
  }

  // Set up RPC handler
  hostPeer.onData((rawData, sender) => {
    const data = rawData as { type: "rpc"; method: string; args: any[] };

    if (data.type === "rpc") {
      console.log("[Host] RPC from", sender, ":", data.method, data.args);
      hostPeer.messageAll({
        type: "rpc",
        sender: sender,
        method: data.method,
        args: data.args,
      });
    }
  });

  // Set up state initialization
  playerPeer.onHostData((data) => {
    if (data.type === "init-state") {
      console.log("[Player] Received initial state:", data.state);
      setGameState(reconcile(data.state));
    }
  });
  hostPeer.onConnection((peerId) => {
    console.log("[Host] New connection:", peerId);
    hostPeer.messagePlayer(peerId, {
      type: "init-state",
      state: unwrap(gameState),
    });
  });

  createPlayerPeer(roomId);
}
