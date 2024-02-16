// Node Get ICE STUN and TURN list
// https://global.xirsys.net/dashboard/services

import https from "https";
import { env } from "~/env";
import fs from "fs";

export type IceList = {
  urls: string[];
  username: string;
  credential: string;
}[];

function fetchIceServers() {
  const bodyString = JSON.stringify({
    format: "urls",
  });

  let options = {
    host: "global.xirsys.net",
    path: "/_turn/MyFirstApp",
    method: "PUT",
    headers: {
      Authorization:
        "Basic " + Buffer.from(env.XIRSYS_CREDENTIALS).toString("base64"),
      "Content-Type": "application/json",
      "Content-Length": bodyString.length,
    },
  };

  return new Promise<IceList>((resolve, reject) => {
    console.log("Loading Xirsys ICE List...");
    let httpreq = https.request(options, function (httpres) {
      let str = "";
      httpres.on("data", function (data) {
        str += data;
      });
      httpres.on("error", function (e) {
        console.log("error: ", e);
      });
      httpres.on("end", function () {
        const servers = [JSON.parse(str).v.iceServers] as IceList;
        console.log("ICE List: ", servers);
        resolve(servers);
      });
    });
    httpreq.on("error", function (e) {
      console.log("request error: ", e);
    });
    httpreq.end(bodyString);
  });
}

const CACHE_PATH = ".next/cache/iceList.json";

let iceList: IceList;

if (fs.existsSync(CACHE_PATH)) {
  iceList = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
} else {
  iceList = await fetchIceServers();
  fs.writeFileSync(CACHE_PATH, JSON.stringify(iceList));
}

export { iceList };
