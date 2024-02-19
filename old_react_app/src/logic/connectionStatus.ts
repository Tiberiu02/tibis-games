import { createObservable } from "~/lib/observable";
import { RoomStatus } from "./connectToRoom";

export const connectionStatusObs = createObservable<RoomStatus>("disconnected");
