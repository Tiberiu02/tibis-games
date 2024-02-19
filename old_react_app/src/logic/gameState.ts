import { createObservable } from "~/lib/observable";

export type Player = {
  peerId: string;
  name: string;
};

export const gameState = {
  players: createObservable<Player[]>([]),
};
