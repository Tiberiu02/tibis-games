"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useObservable } from "~/lib/observable";
import { gameState } from "~/logic/gameState";
import { myPeerIdObs } from "~/peering/myPeer";
import { connectToRoom } from "~/logic/connectToRoom";
import { connectionStatusObs } from "~/logic/connectionStatus";
import { stateController } from "~/logic/modifiers";

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

function generateRoomId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = 6;

  let s = "";
  for (let i = 0; i < length; i++) {
    s += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return s;
}

export default function AirHokey() {
  const [name, setName] = useState("");

  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  useEffect(() => {
    if (roomId) {
      connectToRoom(roomId);
    }
  }, [roomId]);

  const players = useObservable(gameState.players);
  const myPeerId = useObservable(myPeerIdObs);
  const connectionStatus = useObservable(connectionStatusObs);

  console.log("My peer id:", myPeerId);
  console.log("Players:", players);

  return (
    <main className="h-screen w-screen touch-none select-none bg-gray-100 p-4">
      <div className="flex gap-2">
        {roomId ? (
          connectionStatus === "connected" ? (
            <div className="flex flex-col gap-2">
              Joined Room {roomId}
              {!players.some((player) => player.peerId === myPeerId) && (
                <>
                  <input
                    type="text"
                    className="rounded-lg border-2 border-gray-300 px-2 py-1 hover:bg-gray-50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                  />
                  <Button onClick={() => stateController.addPlayer(name)}>
                    Join
                  </Button>
                </>
              )}
              <div>Players:</div>
              {players.map((player) => (
                <div key={player.peerId}>{player.name}</div>
              ))}
            </div>
          ) : (
            <div>Connecting to {roomId}...</div>
          )
        ) : (
          <Link href={`/?room=${generateRoomId()}`}>
            <Button>Create Room</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
