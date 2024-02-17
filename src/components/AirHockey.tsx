"use client";

import { useEffect, useRef, useState } from "react";
import type Peer from "peerjs";
import { iceServers } from "~/networking/iceServers";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DataConnection } from "peerjs";

const PEER_ID_PREFIX = "tibis-games-kvbbdzbicadad-";

function Button({
  onClick,
  children,
}: {
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      className="rounded-lg border-2 border-gray-300 px-2 py-1 hover:bg-gray-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type GameState = {
  x: number;
  y: number;
};

function generateRoomId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = 6;

  let s = "";
  for (let i = 0; i < length; i++) {
    s += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return s;
}

type StatusCode = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

async function createHostPeer(id: string) {
  const guestConnections: DataConnection[] = [];

  const Peer = (await import("peerjs")).default;
  const peer = new Peer(PEER_ID_PREFIX + id, {
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

        const guestIds = guestConnections.map((conn) => conn.peer);
        void newConn.send({ type: "guest-ids", guestIds });
        guestConnections.forEach((conn) => {
          void conn.send({ type: "new-guest", id: newConn.peer });
        });

        guestConnections.push(newConn);
        console.log("Guests:", guestIds);

        newConn.on("close", () => {
          console.log("[Host] Connection closed from", newConn.peer);
          const index = guestConnections.indexOf(newConn);
          guestConnections.splice(index, 1);
          guestConnections.forEach((conn) => {
            void conn.send({ type: "guest-disconnected", id: newConn.peer });
          });
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

async function createMyPeer(
  id: string,
  updateState: (update: (oldState: GameState) => GameState) => void,
) {
  const Peer = (await import("peerjs")).default;
  const peer = new Peer({
    config: {
      iceServers: iceServers,
    },
  });

  const otherPeers: string[] = [];
  const connections: Record<string, DataConnection> = {};

  const handlePeerData = (data: unknown) => {
    const t = data as { type: string; dx: number; dy: number };
    console.log("[Guest] Data from peer:", data);
    if (t.type === "update") {
      updateState((oldState) => ({
        x: oldState.x + t.dx,
        y: oldState.y + t.dy,
      }));
    }
  };

  const sendUpdate = (update: { x: number; y: number }) => {
    // console.log("Sending update to", otherPeers);
    otherPeers.forEach((id) => {
      const conn = connections[id];
      if (conn) {
        void conn.send({ type: "update", dx: update.x, dy: update.y });
      }
    });
  };

  await new Promise<void>((resolve, reject) => {
    peer.on("open", () => {
      console.log("My peer open:", peer.id);

      const hostConn = peer.connect(PEER_ID_PREFIX + id);

      hostConn.on("open", () => {
        console.log("[Guest] Connection established to host", hostConn.peer);
      });

      hostConn.on("data", (data) => {
        const t = data as { type: string; guestIds: string[]; id: string };
        console.log("[Guest] Data from host:", t);
        if (t.type === "guest-ids") {
          t.guestIds.forEach((guestId: string) => {
            const conn = peer.connect(guestId);
            conn.on("open", () => {
              console.log("[Guest] Connection established to guest", guestId);
              connections[guestId] = conn;
            });
            conn.on("data", handlePeerData);
            otherPeers.push(guestId);
          });
        } else if (t.type === "new-guest") {
          otherPeers.push(t.id);
        } else if (t.type === "guest-disconnected") {
          const index = otherPeers.indexOf(t.id);
          const [disconnectedPeer] = otherPeers.splice(index, 1);

          if (disconnectedPeer) {
            const conn = connections[disconnectedPeer];

            if (conn) {
              conn.close();
              delete connections[disconnectedPeer];
            }
          }
        }
      });

      resolve();
    });

    peer.on("connection", (conn) => {
      console.log("[Guest] Connection from", conn.peer);
      conn.on("data", handlePeerData);
      connections[conn.peer] = conn;
    });

    peer.on("error", (error) => {
      console.error(
        "Error occurred with my peer:",
        error.type,
        error.message,
        error,
      );
      reject(error);
    });
  });

  return {
    peer,
    sendUpdate,
  };
}

export default function AirHokey() {
  const hostPeerRef = useRef<Peer | null>(null);
  const myPeerRef = useRef<{
    peer: Peer;
    sendUpdate: (update: GameState) => void;
  } | null>(null);
  const statusRef = useRef<StatusCode>("DISCONNECTED");

  const lastMousePosition = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const [state, setState] = useState<GameState>({
    x: 0,
    y: 0,
  });

  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  async function connectToRoom(id: string) {
    console.log("Connecting to room:", id);

    if (statusRef.current !== "DISCONNECTED") {
      console.warn(
        `Connection status is already ${statusRef.current}, cancelling`,
      );
      return;
    }

    statusRef.current = "CONNECTING";

    hostPeerRef.current = await createHostPeer(id);
    myPeerRef.current = await createMyPeer(id, setState);

    statusRef.current = "CONNECTED";
  }

  useEffect(() => {
    if (roomId) {
      void connectToRoom(roomId);
    }
  }, [roomId]);

  return (
    <main
      className="h-screen w-screen touch-none select-none bg-gray-100 p-4"
      onPointerMove={(e) => {
        if (lastMousePosition.current) {
          e.preventDefault();
          const dx = e.clientX - lastMousePosition.current.x;
          const dy = e.clientY - lastMousePosition.current.y;
          lastMousePosition.current = { x: e.clientX, y: e.clientY };
          setState((state) => ({
            x: state.x + dx,
            y: state.y + dy,
          }));
          if (myPeerRef.current) {
            myPeerRef.current.sendUpdate({ x: dx, y: dy });
          }
        }
      }}
      onPointerUp={() => {
        lastMousePosition.current = null;
      }}
    >
      <div className="flex gap-2">
        {roomId ? (
          <div>
            Joined Room {roomId}
            <div
              className="absolute z-50 h-16 w-16 rounded-full bg-red-500"
              style={{
                transform: `translate(${state.x}px, ${state.y}px)`,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                lastMousePosition.current = { x: e.clientX, y: e.clientY };
              }}
            ></div>
          </div>
        ) : (
          <Link href={`/air-hockey?room=${generateRoomId()}`}>
            <Button>Create Room</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
