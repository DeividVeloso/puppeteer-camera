import { S3Streamer } from "./S3StreamerInput";

interface PuppetcamConfig {
  id: string;
}

class Puppetcam {
  private videoStreamer: S3Streamer;

  async setup(config: PuppetcamConfig) {
    const { id } = config;

    console.log("running setup");
    await new Promise<void>((res, rej) => {
      chrome.tabCapture.capture(
        {
          audio: true,
          video: true,
        },
        (stream) => {
          if (!stream) return;
          console.log(`Got handle for media stream`);

          const videoRecorder = new MediaRecorder(stream, {
            videoBitsPerSecond: 2500000,
            ignoreMutedMedia: true,
            mimeType: "video/webm;codecs=vp9",
          } as MediaRecorderOptions);
          
          this.videoStreamer = new S3Streamer({ recorder: videoRecorder, id });
          res();
          console.log(`Initialized video streamer`);
        }
      );
    });
    console.log(`Got desktop streamId`);
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
