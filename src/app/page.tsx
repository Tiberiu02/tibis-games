import PeerTesting from "~/components/PeerTesting";
import { iceList } from "~/networking/xirsys";

export default async function HomePage() {
  return <PeerTesting iceServer={await iceList} />;
}
