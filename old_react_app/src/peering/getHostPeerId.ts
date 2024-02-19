const HOST_PEER_ID_PREFIX = "tibis-games-C5Fr7pU6bzTx-";

export function getHostPeerId(roomId: string) {
  return HOST_PEER_ID_PREFIX + roomId;
}
