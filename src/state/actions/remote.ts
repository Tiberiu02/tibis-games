import { playerPeer } from "~/networking/peering/player";
import { gameState, setGameState } from "../gameState";

let player: string;

/** Do not call these functions directly. They are meant to be invokated by the remote peer using the RPC stub. */
const Procedures = {
  joinRoom: (name: string) => {
    console.log("Adding player:", name);
    if (gameState.players.some((p) => p.id === player)) {
      console.warn("Player already exists");
      return;
    }
    setGameState("players", (players) => [...players, { id: player, name }]);
  },
  joinWaitingQueue: () => {
    if (
      gameState.games.some((game) => game.players.some((p) => p.id === player))
    ) {
      console.warn("Player already in game");
      return;
    }

    if (gameState.waitingQueue.length >= 1) {
      const other = gameState.waitingQueue[0];
      setGameState("waitingQueue", (queue) => queue.slice(1));

      console.log("Starting game with", player, other);

      setGameState("games", gameState.games.length, {
        players: [
          {
            id: player,
            score: 0,
            position: { x: 0, y: 0 },
            location: "top",
          },
          {
            id: other,
            score: 0,
            position: { x: 0, y: 0 },
            location: "bottom",
          },
        ],
        ball: {
          baseTimestamp: Date.now(),
          basePosition: { x: 0, y: 0 },
          baseVelocity: { x: 0, y: 0 },
        },
      });
    } else {
      setGameState("waitingQueue", (queue) => [...queue, player]);
    }
  },
};

// Execute incoming RPCs
playerPeer.onHostData((data) => {
  if (data.type === "rpc") {
    const { method, args } = data;
    if (method in Procedures) {
      const f = (Procedures as any)[method] as (...args: any) => any;
      if (f) {
        player = data.sender;
        f(...args);
      }
    }
  }
});

// Create RPC stub
export const remotePlayer = new Proxy(Procedures, {
  get(_target, prop) {
    return (...args: any) => {
      playerPeer.messageHost({
        type: "rpc",
        method: prop as string,
        args,
      });
    };
  },
}) as typeof Procedures;
