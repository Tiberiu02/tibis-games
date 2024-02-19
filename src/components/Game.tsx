import { Navigate, useSearchParams } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { Button } from "~/components/Button";
import { connectToRoom } from "~/networking/init";
import { connectionStatus, myId } from "~/networking/state";
import { remotePlayer } from "~/state/actions/remote";
import { gameState } from "~/state/gameState";

export function Game() {
  const [{ room }] = useSearchParams<{ room: string }>();
  const [name, setName] = createSignal("");

  if (!room) {
    return <Navigate href={"/"} />;
  }

  connectToRoom(room);

  const joined = () => gameState.players.some((player) => player.id === myId());
  const inQueue = () => gameState.waitingQueue.includes(myId());

  const game = () =>
    gameState.games.find((game) => game.players.some((p) => p.id === myId()));

  const oponent = () => {
    const currentGame = game();
    if (!currentGame) return;

    const opponentId = currentGame.players.find((p) => p.id !== myId())?.id;
    if (!opponentId) return;

    const opponent = gameState.players.find((p) => p.id === opponentId);
    return opponent;
  };

  return (
    <main>
      {connectionStatus() == "connected" ? (
        <div class="flex flex-col gap-4">
          <h1>Room: {room}</h1>
          <Show when={!joined()}>
            <input
              type="text"
              class="rounded-lg border-2 border-gray-300 px-2 py-1 hover:bg-gray-50"
              value={name()}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
            <Button onClick={() => remotePlayer.joinRoom(name())}>Join</Button>
          </Show>

          <div class="flex gap-2">
            Players:
            {
              <For each={gameState.players}>
                {(player) => <div>{player.name}</div>}
              </For>
            }
          </div>
          <div class="flex gap-2">
            Waiting Queue:
            <For each={gameState.waitingQueue}>
              {(player) => (
                <div>
                  {gameState.players.find((p) => p.id === player)?.name}
                </div>
              )}
            </For>
          </div>
          <Show when={joined()}>
            <Show when={!inQueue() && !game()}>
              <Button onClick={() => remotePlayer.joinWaitingQueue()}>
                Enter Waiting Queue
              </Button>
            </Show>
            <Show when={inQueue()}>
              <h1>Waiting for another player...</h1>
            </Show>
            <Show when={game()}>
              <h1>Game in progress...</h1>
              Playing against: {oponent()?.name}
            </Show>
          </Show>
        </div>
      ) : (
        <h1>Connecting to {room}...</h1>
      )}
    </main>
  );
}
