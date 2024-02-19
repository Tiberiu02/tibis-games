import { createSignal } from "solid-js";

export const [myId, setMyId] = createSignal<string>("");
export const [connectionStatus, setConnectionStatus] = createSignal<
  "disconnected" | "connecting" | "connected"
>("disconnected");
