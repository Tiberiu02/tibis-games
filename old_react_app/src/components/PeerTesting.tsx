"use client";

import { useRef, useState } from "react";
import type Peer from "peerjs";
import { iceServers } from "~/networking/peering/config";

const PEER_ID = "tibis-games-kvbbdzbicadad";

export default function PeerTesting() {
  const peerRef = useRef<Peer>();
  const peerOptions = {
    config: {
      iceServers,
    },
    debug: 3,
  };

  console.log("PeerOptions: ", peerOptions.config.iceServers);

  const [logs, setLogs] = useState<string[]>(["Welcome"]);
  const log = (message: string) => setLogs((logs) => [...logs, message]);

  const createPeer = async () => {
    log("Creating peer...");
    const Peer = (await import("peerjs")).default;
    const peer = (peerRef.current = new Peer(PEER_ID, peerOptions));

    peer.on("open", (id) => {
      log(`Peer created: ${id}`);

      peer.on("connection", (conn) => {
        log(`New connection: ${conn.connectionId}`);

        conn.on("data", (data) => {
          const t = data as string;

          log(`[${conn.connectionId}] Received data: ${t}`);

          if (t == "ping") {
            log(`[${conn.connectionId}] Sending pong...`);
            void conn.send({ pong: performance.now() });
          }
        });
      });
    });
  };

  const connectPeer = async () => {
    const Peer = (await import("peerjs")).default;
    const peer = (peerRef.current = new Peer(peerOptions));

    peer.on("open", (id) => {
      log(`Peer created: ${id}`);

      log(`Connecting to peer: ${PEER_ID}...`);

      const conn = peer.connect(PEER_ID);

      conn.on("open", () => {
        log(`Connected to peer: ${conn.connectionId}`);

        log("Testing latency...");

        const start = performance.now();
        void conn.send("ping");

        conn.on("data", (data) => {
          const t = data as { pong?: number };
          if (t.pong) {
            const rtt = performance.now() - start;
            log(
              `Latency: ${rtt}ms, time difference: ${t.pong - (start + rtt / 2)}ms`,
            );
          }
        });
      });
    });
  };

  return (
    <main className="p-4">
      <div className="flex gap-2">
        <button
          className="rounded-lg border-2 border-gray-300 px-2 py-1 hover:bg-gray-50"
          onClick={createPeer}
        >
          Create new
        </button>
        <button
          className="rounded-lg border-2 border-gray-300 px-2 py-1 hover:bg-gray-50"
          onClick={connectPeer}
        >
          Connect existing
        </button>
      </div>
      <div className="ml-1 mt-4 flex flex-col gap-1 border-l-2 border-gray-300 pl-2">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </main>
  );
}
