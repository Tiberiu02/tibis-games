import { createRemoteControllerStub } from "~/peering/myPeer";
import { gameState, type Player } from "./gameState";
import { getSender } from "./sender";

const stateActions = {
  addPlayer: (name: string) => {
    gameState.players.set([
      ...gameState.players.get(),
      {
        peerId: getSender(),
        name,
      },
    ]);
  },
  removePlayer: (peerId: string) => {
    gameState.players.set(
      gameState.players.get().filter((p) => p.peerId !== peerId),
    );
  },
};

export const stateController = createRemoteControllerStub(stateActions);
