import PeerTesting from "~/components/PeerTesting";
import { iceList } from "~/networking/xirsys";

export default async function HomePage() {
  return <PeerTesting iceList={await iceList} />;
}
