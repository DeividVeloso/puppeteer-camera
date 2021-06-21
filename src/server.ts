import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";
import * as puppeteer from "puppeteer";
require("dotenv").config();
import {
  checkIfUserJoined,
  fillJoinRoomForm,
} from "./utils/video";

// Set up virtual frame buffer, aka render screen pixels to memory instead of an actual display
// Pixel rendering will be saved from memory to webm video recording
import * as Xvfb from 'xvfb';

interface StartRecordingData {
  id: string;
  url: string;
  roomId: string;
  options: any;
}

interface TelnyxRecording {
  id: string;
  roomId: string;
  page?: puppeteer.Page;
  browser?: puppeteer.Browser;
}

let currentRecordings: TelnyxRecording[] = [];

const xvfb = new (Xvfb as any)({ silent: true });
xvfb.startSync()

process.on('exit', xvfb.stopSync);
const app = express();
const port = 3333;
app.use(bodyParser.json());

app.post("/start", async (req, res) => {
  const { id, roomId } = req.body;
  console.log(`Incoming request to record Telnyx room:`);

  if (id && roomId) {
    const width = req.body.width || 1920;
    const height = req.body.height || 1080;

    const options = {
      headless: false,
     // executablePath: "/usr/bin/chromium-browser",
      args: [
        '--enable-usermedia-screen-capturing',
        '--allow-http-screen-capture',
        "--no-sandbox",
        "--enable-usermedia-screen-capturing",
        "--use-fake-device-for-media-stream",
        "--allow-http-screen-capture",
        "--auto-select-desktop-capture-source=puppetcam",
        "--disable-infobars",
        "--enable-automation",
        "--autoplay-policy=no-user-gesture-required",
        `--window-size=${width},${height}`,
        "--disable-extensions-except=" +
          path.join(__dirname, "chrome_extension"),
        "--load-extension=" + path.join(__dirname, "chrome_extension"),
        "--whitelisted-extension-id=mbjpaljeibfppoiehjacnkmpllebndfk",
      ],
      ignoreDefaultArgs: ["--mute-audio"],
    };

    console.log('startRecording')
    await startRecording({ url: process.env.URL_PAGE, id, roomId, options });
    res.json({ message: "OK" });
  } else {
    res.status(422);
    res.json({ error: "Invalid input" });
  }
});

app.post("/stop", async (req, res) => {
  const { id } = req.body;
  console.log(`Incoming request to stop recording with id: ${id}`);
  console.log(
    `Current recording ids: ${currentRecordings.map((rec) => rec.id)}`
  );
  const recording = currentRecordings.find((rec) => rec.id === id);
  if (recording) {
    await stopRecording(recording);
    currentRecordings = currentRecordings.filter((rec) => rec.id !== id);
    res.json({ id });
  } else {
    console.log(`Recording not found for id: ${id}`);
    res.status(422);
    res.json({ error: "Recording not found" });
  }
});

app.listen(port, () =>
  console.log(`Puppetcam listening on http://localhost:${port}`)
);

async function startRecording(data: StartRecordingData) {
  try {
    const { id, url, roomId, options } = data;
    const browser = await puppeteer.launch(options);
    console.log('browser')
    const pages = await browser.pages();
    console.log('pages')

    const page = pages[0];
    console.log(`Browser spawned and navigating to recording url`);
    await (page as any)._client.send("Emulation.clearDeviceMetricsOverride");
    console.log(`Emulation.clearDeviceMetricsOverride`);

    await page.goto('https://video-meet-dev.vercel.app/rooms', { waitUntil: "networkidle2" });
    console.log(`networkidle2`);
    await page.setBypassCSP(true)

    await page.evaluate(() => {
      document.title = "puppetcam";
    });

    if (process.env.RECORD_TELNYX_MEETING === "yes") {
      const username = await fillJoinRoomForm(page, {
        id: roomId,
      });
      const joined = await checkIfUserJoined(page, username);

      console.log("url", url);
      console.log("username", username);
      console.log("joined", joined);
    }

    console.log(`getBackgroundPage`);

    const backgroundPage = await getBackgroundPage(browser);
    registerLogging(backgroundPage);
    console.log(`Attached logging to background page`);

    await backgroundPage.evaluate(
      async (config) => {
        await (window as any).PUPPETCAM.setup(config);
      },
      {
        id,
        roomId,
      }
    );

    console.log("Ran setup() in background page");
    console.log(
      `Browser extension loaded, begin recording Telnyx room: ${roomId}`
    );

    await backgroundPage.evaluate(async () => {
      await (window as any).PUPPETCAM.start();
    });
    console.log("Ran start() in background page");

    currentRecordings.push({ id, roomId, page: backgroundPage, browser });
  } catch (error) {
    console.log("Error launching PUPPETCAM", error);
  }
}

async function stopRecording(data: TelnyxRecording) {
  const { id, roomId, page, browser } = data;
  console.log(`Stopping recording for Telnyx room: ${roomId}`);

  const location = await page.evaluate(async () => {
    return await (window as any).PUPPETCAM.stop();
  });
  console.log("Ran stop() in background page", location);

  // Wait for download of webm to complete
  console.log(
    `Recording logs located at /root/Downloads/${id}.txt for Telnyx room: ${roomId}`
  );
  await browser.close();
}

async function getBackgroundPage(browser: puppeteer.Browser) {
  var targets = await browser.targets();

  const targetPromise = await new Promise((resolve, reject) => {
    const target = targets.find(
      (target) =>
        target.type() === "background_page" &&
        target.url().endsWith("_generated_background_page.html")
    );

    if (target) {
      return resolve(target);
    } else {
      reject("Could not load Video Record Extension in the browser");
    }

    const listener = (target) => {
      if (
        target.type() === "background_page" &&
        target.url().endsWith("_generated_background_page.html")
      ) {
        browser.removeListener("targetcreated", listener);
        browser.removeListener("targetchanged", listener);
        resolve(target);
      }
    };

    browser.on("targetcreated", listener);
    browser.on("targetchanged", listener);
  });
  return (targetPromise as any).page();
}

function registerLogging(backgroundPage: puppeteer.Page) {
  backgroundPage
    .on("console", (message) =>
      console.log(
        `${message.type().substr(0, 3).toUpperCase()} ${message.text()}`
      )
    )
    .on("pageerror", ({ message }) => console.log(message))
    .on("response", (response) =>
      console.log(`${response.status()} ${response.url()}`)
    )
    .on("requestfailed", (request) =>
      console.log(`${request.failure().errorText} ${request.url()}`)
    );
  console.log("Attached logger to extension background page");
  return backgroundPage;
}
