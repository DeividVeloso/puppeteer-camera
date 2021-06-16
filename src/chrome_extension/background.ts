import { S3Streamer } from "./S3StreamerInput";

interface PuppetcamConfig {
  id: string;
}

class Puppetcam {
  private videoStreamer: S3Streamer;

  async setup(config: PuppetcamConfig) {
    const { id } = config;
  
    console.log("running setup");
    const streamId = await new Promise((res, rej) => {
      chrome.desktopCapture.chooseDesktopMedia(["tab", "audio"], res);
    });
    console.log(`Got desktop streamId`, streamId);

    // Get the stream
    const stream: MediaStream = await new Promise((res, rej) => {
      (navigator as any).webkitGetUserMedia(
        {
          audio: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: streamId,
            },
          },
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: streamId,
              minWidth: 1920,
              maxWidth: 1920,
              minHeight: 1080,
              maxHeight: 1080,
              maxFrameRate: 30,
            },
          },
        },
        res,
        rej
      );
    });
    console.log(`Got handle for media stream`);

    const videoRecorder = new MediaRecorder(stream, {
      videoBitsPerSecond: 2500000,
      ignoreMutedMedia: true,
      mimeType: "video/webm;codecs=vp9",
    } as MediaRecorderOptions);
    this.videoStreamer = new S3Streamer({ recorder: videoRecorder, id });

    console.log(`Initialized video streamer`);
  }

  async start() {
    console.log("running start");
    const promises = [];
    if (this.videoStreamer) {
      promises.push(this.videoStreamer.start());
    }
    return Promise.all(promises);
  }

  async stop() {
    console.log("running stop");
    const promises = [];
    if (this.videoStreamer) {
      promises.push(this.videoStreamer.stop());
    }
    console.log("stop===>", promises);
    return Promise.all(promises);
  }
}

(window as any).PUPPETCAM = new Puppetcam();
