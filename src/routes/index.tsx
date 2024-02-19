import { A } from "@solidjs/router";
import { Button } from "~/components/Button";

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
  return (
    <main>
      <A href={`/game?room=${generateRoomId()}`}>
        <Button>Create Room</Button>
      </A>
    </main>
  );
}
