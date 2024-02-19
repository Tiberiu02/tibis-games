import { A, useSearchParams } from "@solidjs/router";
import { Button } from "~/components/Button";
import { Game } from "~/components/game";

function generateRoomId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = 6;

  let s = "";
  for (let i = 0; i < length; i++) {
    s += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return s;
}

export default function Home() {
  const [params, setParams] = useSearchParams<{ room: string }>();

  return (
    <main>
      {params.room ? (
        <Game />
      ) : (
        <Button onClick={() => setParams({ room: generateRoomId() })}>
          Create Room
        </Button>
      )}
    </main>
  );
}
