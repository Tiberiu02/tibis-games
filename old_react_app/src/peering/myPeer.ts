import type { DataConnection, Peer } from "peerjs";
import { iceServers } from "~/networking/peering/config";
import { getHostPeerId } from "./getHostPeerId";
import { setSender } from "~/logic/sender";
import { Observable, createObservable } from "~/lib/observable";
import { tryCreateHostPeer } from "./hostPeer";
import { gameState } from "~/logic/gameState";
import { connectionStatusObs } from "~/logic/connectionStatus";

let myPeer: Peer;
export let hostConn: DataConnection;
const connectedPeers: { [id: string]: DataConnection } = {};

export const myPeerIdObs = createObservable("");

export async function createMyPeer(roomId: string) {
  if (myPeer) {
    throw new Error("Peer already created");
  }

  const Peer = (await import("peerjs")).default;
  myPeer = new Peer({
    config: {
      iceServers: iceServers,
    },
  });

  console.log("Created my peer, id:", myPeer);

  await new Promise<void>((resolve, reject) => {
    myPeer.on("open", () => {
      console.log("My peer open:", myPeer.id);

      myPeerIdObs.set(myPeer.id);

      connectToHost(myPeer, roomId);

      resolve();
    });

    myPeer.on("connection", (conn) => {
      console.log("[Guest] Connection from", conn.peer);
      // conn.on("data", handlePeerData);
      connectedPeers[conn.peer] = conn;
    });

    myPeer.on("error", (error) => {
      console.error(
        "Error occurred with my peer:",
        error.type,
        error.message,
        error,
      );
    });
  });
}

type HostMessage =
  | {
      type: "rpc";
      sender: string;
      method: string;
      args: any[];
    }
  | {
      type: "init-state";
      state: any;
    };

export function connectToHost(myPeer: Peer, roomId: string) {
  hostConn = myPeer.connect(getHostPeerId(roomId));

  hostConn.on("open", () => {
    console.log("[Guest] Connection established to host", hostConn.peer);
    connectionStatusObs.set("connected");
  });

  hostConn.on("data", (data) => {
    const t = data as HostMessage;
    console.log("[Guest] Data from host:", t);
    if (t.type == "rpc") {
      executeRPC(t.method, t.args, t.sender);
    } else if (t.type === "init-state") {
      setInitialGameState(t.state);
    }
  });

  hostConn.on("close", async () => {
    console.log("[Guest] Connection closed from host");
    console.log("[Guest] Attempting to create host");

    connectionStatusObs.set("connecting");

    hostConn.removeAllListeners();
    hostConn.close();

    await tryCreateHostPeer(roomId);
    connectToHost(myPeer, roomId);
  });

  hostConn.on("error", (error) => {
    console.error(
      "Unexpected error occurred while trying to connect to host:",
      error.type,
      error.message,
      error,
    );
  });
}

function setInitialGameState(state: any) {
  console.log("Setting initial game state:", state);

  Object.entries(state).forEach(([key, value]) => {
    if (key in gameState) {
      (gameState[key as keyof typeof gameState] as Observable<any>).set(value);
    }
  });
}

let executeRPC: (
  method: string,
  args: any[],
  sender: string,
) => void = () => {};

export function createRemoteControllerStub<
  T extends Record<string, (...args: any) => any>,
>(stateModifiers: T) {
  // Create function to execute RPC
  executeRPC = (method, args, sender) => {
    if (method in stateModifiers) {
      const f = (stateModifiers as any)[method] as (...args: any) => any;

      if (f) {
        setSender(sender);
        f(...args);
      }
    }
  };

  // Create remote controller
  const controller = Object.fromEntries(
    Object.keys(stateModifiers).map(([key]) => [
      key,
      (...args: any) => {
        hostConn.send({ type: "rpc", method: key, args });
      },
    ]),
  ) as T;

  return controller;
}
