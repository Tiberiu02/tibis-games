import { Suspense } from "react";
import AirHokey from "~/components/AirHockey";

type PlayerData = {
  peerId: string;
  name: string;
  score: number;
  // avatar: string;
  connected: boolean; // ?
};

type ChatEntry = {
  peerId: string;
  message: string;
  timestamp: number;
};

type HockeyGameState = {
  waitingQueue: string[];
  games: {
    redId: string;
    redScore: number;
    blueId: string;
    blueScore: number;

    spectators: string[];

    // High frequency state (only sent to players in the game or spectating)
    redPelletPosition: {
      x: number;
      y: number;
    };
    bluePelletPosition: {
      x: number;
      y: number;
    };
    puckTrajectory: {
      timestamp: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
    };
  };
};

type State = {
  players: PlayerData[];
  chat: ChatEntry[];
  gameState: HockeyGameState;
};

export default async function HomePage() {
  return (
    <Suspense>
      <AirHokey />
    </Suspense>
  );
}
