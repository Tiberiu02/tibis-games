import { createStore } from "solid-js/store";

type Player = {
  id: string;
  name: string;
};

type HokeyGame = {
  players: {
    id: string;
    score: number;
    position: {
      x: number;
      y: number;
    };
    location: "top" | "bottom";
  }[];

  ball: {
    baseTimestamp: number;
    basePosition: {
      x: number;
      y: number;
    };
    baseVelocity: {
      x: number;
      y: number;
    };
  };
};

export const [gameState, setGameState] = createStore({
  players: [] as Player[],
  waitingQueue: [] as string[],
  games: [] as HokeyGame[],
});
