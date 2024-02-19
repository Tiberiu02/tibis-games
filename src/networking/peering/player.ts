import type { DataConnection, Peer } from "peerjs";
import { getHostPeerId, peerConfig } from "~/networking/peering/config";
import { tryCreateHostPeer } from "./host";
import { setConnectionStatus, setMyId } from "../state";

let myPeer: Peer;
let host: DataConnection;
const players: { [id: string]: DataConnection } = {};

const hostDataListeners: Set<(data: any) => void> = new Set();
const playerDataListeners: Set<(data: any, sender: string) => void> = new Set();

export const playerPeer = {
  onHostData: (listener: (data: any) => void) => {
    hostDataListeners.add(listener);
  },
  offHostData: (listener: (data: any) => void) => {
    hostDataListeners.delete(listener);
  },
  onPlayerData: (listener: (data: any, sender: string) => void) => {
    playerDataListeners.add(listener);
  },
  offPlayerData: (listener: (data: any, sender: string) => void) => {
    playerDataListeners.delete(listener);
  },
  messageHost: (data: any) => {
    if (!host) {
      console.warn("Host not connected");
      console.warn("Tried to send:", data);
      return;
    }
    host.send(data);
  },
  messagePlayer: (id: string, data: any) => {
    if (id in players) {
      players[id].send(data);
    } else {
      console.warn("Player not found:", id);
      console.warn("Tried to send:", data);
    }
  },
};

export async function createPlayerPeer(roomId: string) {
  if (myPeer) {
    throw new Error("Peer already created");
  }

  const Peer = (await import("peerjs")).default;
  myPeer = new Peer(peerConfig);

  await tryCreateHostPeer(roomId);

  console.log("Created my peer, id:", myPeer);

  await new Promise<void>((resolve, reject) => {
    myPeer.on("open", () => {
      console.log("My peer open:", myPeer.id);

      setMyId(myPeer.id);

      connectToHost(roomId);

      resolve();
    });

    myPeer.on("connection", (conn) => {
      console.log("[Guest] Connection from", conn.peer);
      players[conn.peer] = conn;

      conn.on("data", (data) => {
        for (const listener of playerDataListeners) {
          listener(data, conn.peer);
        }
      });
    });

    myPeer.on("error", (error) => {
      console.error(
        "Error occurred with my peer:",
        error.type,
        error.message,
        error
      );
    });
  });
}

function connectToHost(roomId: string) {
  host = myPeer.connect(getHostPeerId(roomId));

  host.on("open", () => {
    console.log("[Guest] Connection established to host", host.peer);
    setConnectionStatus("connected");
  });

  host.on("data", (data) => {
    for (const listener of hostDataListeners) {
      listener(data);
    }
    // const t = data as HostMessage;
    // console.log("[Guest] Data from host:", t);
    // if (t.type == "rpc") {
    //   executeRPC(t.method, t.args, t.sender);
    // } else if (t.type === "init-state") {
    //   setInitialGameState(t.state);
    // }
  });

  host.on("close", async () => {
    console.log("[Guest] Connection closed from host");
    console.log("[Guest] Attempting to create host");

    setConnectionStatus("connecting");

    host.removeAllListeners();
    host.close();

    await tryCreateHostPeer(roomId);
    connectToHost(roomId);
  });

  host.on("error", (error) => {
    console.error(
      "Unexpected error occurred while trying to connect to host:",
      error.type,
      error.message,
      error
    );
  });
}

// function setInitialGameState(state: any) {
//   console.log("Setting initial game state:", state);

//   setGameState(reconcile(state));
// }

// let executeRPC: (
//   method: string,
//   args: any[],
//   sender: string
// ) => void = () => {};

// export function createRemoteControllerStub<
//   T extends Record<string, (...args: any) => any>
// >(actions: T) {
//   // Create function to execute RPC
//   executeRPC = (method, args, sender) => {
//     if (method in actions) {
//       const f = (actions as any)[method] as (...args: any) => any;

//       if (f) {
//         setSender(sender);
//         f(...args);
//       }
//     }
//   };

//   // Create remote controller
//   const controller = Object.fromEntries(
//     Object.keys(stateModifiers).map(([key]) => [
//       key,
//       (...args: any) => {
//         hostConn.send({ type: "rpc", method: key, args });
//       },
//     ])
//   ) as T;

//   return controller;
// }
