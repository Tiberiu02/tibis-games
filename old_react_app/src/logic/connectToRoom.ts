import { tryCreateHostPeer } from "~/peering/hostPeer";
import { createMyPeer } from "~/peering/myPeer";
import { connectionStatusObs } from "./connectionStatus";

export type RoomStatus = "connecting" | "connected" | "disconnected" | "error";

export async function connectToRoom(roomId: string) {
  if (connectionStatusObs.get() !== "disconnected") {
    console.warn(
      `Connection status is already ${connectionStatusObs.get()}, cancelling`,
    );
    return;
  }

  connectionStatusObs.set("connecting");

  await tryCreateHostPeer(roomId);
  await createMyPeer(roomId);

  connectionStatusObs.set("connected");
}
