import type { PeerJSOption } from "peerjs";

const iceServers = [
  {
    urls: "stun:stun.relay.metered.ca:80",
  },
  {
    urls: "turn:standard.relay.metered.ca:80",
    username: "7316a86e689702ed0f208cb0",
    credential: "nvZJtXeLiLiv37W1",
  },
  {
    urls: "turn:standard.relay.metered.ca:80?transport=tcp",
    username: "7316a86e689702ed0f208cb0",
    credential: "nvZJtXeLiLiv37W1",
  },
  {
    urls: "turn:standard.relay.metered.ca:443",
    username: "7316a86e689702ed0f208cb0",
    credential: "nvZJtXeLiLiv37W1",
  },
  {
    urls: "turns:standard.relay.metered.ca:443?transport=tcp",
    username: "7316a86e689702ed0f208cb0",
    credential: "nvZJtXeLiLiv37W1",
  },
];

export const peerConfig: PeerJSOption = {
  config: {
    iceServers,
  },
};

export function getHostPeerId(roomId: string) {
  const HOST_PEER_ID_PREFIX = "tibis-games-C5Fr7pU6bzTx-";
  return HOST_PEER_ID_PREFIX + roomId;
}
