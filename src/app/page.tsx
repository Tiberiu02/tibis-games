"use client";

import { Peer } from "peerjs";
import { useRef, useState } from "react";

const PEER_ID = "tibis-games-kvbbdzbicadad";

export default function HomePage() {
  const peerRef = useRef<Peer>();

  const [logs, setLogs] = useState<string[]>(["Welcome"]);
  const log = (message: string) => setLogs((logs) => [...logs, message]);

  const createPeer = () => {
    log("Creating peer...");
    const peer = (peerRef.current = new Peer(PEER_ID));

    peer.on("open", (id) => {
      log(`Peer created: ${id}`);

      peer.on("connection", (conn) => {
        log(`New connection: ${conn.connectionId}`);

        conn.on("data", (data) => {
          log(`[${conn.connectionId}] Received data: ${data}`);

          if (data == "ping") {
            log(`[${conn.connectionId}] Sending pong...`);
            conn.send({ pong: performance.now() });
          }
        });
      });
    });
  };

  const connectPeer = () => {
    const peer = (peerRef.current = new Peer());

    peer.on("open", (id) => {
      log(`Peer created: ${id}`);

      log(`Connecting to peer: ${PEER_ID}...`);

      const conn = peer.connect(PEER_ID);

      conn.on("open", () => {
        log(`Connected to peer: ${conn.connectionId}`);

        log("Testing latency...");

        const start = performance.now();
        conn.send("ping");

        conn.on("data", (data: any) => {
          if (data.pong) {
            const rtt = performance.now() - start;
            log(
              `Latency: ${rtt}ms, time difference: ${data.pong - (start + rtt / 2)}ms`,
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
