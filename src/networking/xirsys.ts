// Node Get ICE STUN and TURN list
// https://global.xirsys.net/dashboard/services

import https from "https";
import { env } from "~/env";
import fs from "fs";

export type IceList = {
  urls: string[];
  username: string;
  credential: string;
};

type XirsysResponse = {
  v: {
    iceServers: IceList;
  };
};

function fetchIceServers() {
  const bodyString = JSON.stringify({
    format: "urls",
  });

  const options = {
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

  console.log("Loading Xirsys ICE List...");
  return new Promise<IceList>((resolve) => {
    const httpreq = https.request(options, function (httpres) {
      let str = "";
      httpres.on("data", function (data) {
        str += data;
      });
      httpres.on("error", function (e) {
        console.error("Failed to load Xirsys ICE List");
        console.error("Error: ", e);
      });
      httpres.on("end", function () {
        const servers = (JSON.parse(str) as XirsysResponse).v.iceServers;
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

export const iceList = new Promise<IceList>((resolve) => {
  if (fs.existsSync(CACHE_PATH)) {
    console.log("Loading ICE List from cache...");
    const list = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as IceList;
    console.log("ICE List: ", list);
    resolve(list);
  } else {
    void fetchIceServers().then((list) => {
      fs.writeFileSync(CACHE_PATH, JSON.stringify(list));
      resolve(list);
    });
  }
});
