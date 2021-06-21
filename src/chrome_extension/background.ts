import { Streamer } from "./StreamerInput";

interface PuppetcamConfig {
  id: string;
  roomId: string;
}

class Puppetcam {
  private videoStreamer: Streamer;

  async setup(config: PuppetcamConfig) {
    const { id, roomId } = config;

    console.log("running setup");
    await new Promise<void>((res, rej) => {
      chrome.desktopCapture.chooseDesktopMedia(["tab", "audio"], (streamId) => {
        console.log(`Got desktop streamId ${streamId}`);
        // Get the stream
        // @ts-ignore
        navigator.webkitGetUserMedia(
          {
            audio: {
              mandatory: {
                chromeMediaSource: "system",
              },
            },
            video: {
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: streamId,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720,
                minFrameRate: 60,
              },
            },
          },
          (stream: any) => {
            if (!stream) return;
            console.log(`Got handle for media stream`);

            const videoRecorder = new MediaRecorder(stream, {
              videoBitsPerSecond: 2500000,
              ignoreMutedMedia: true,
              mimeType: "video/webm;codecs=vp9",
            } as MediaRecorderOptions);

            this.videoStreamer = new Streamer({
              recorder: videoRecorder,
              id,
              roomId,
            });
            console.log(`Initialized video streamer`);
            res();
          },
          (error:any) => {
            console.log('Unable to get user media', error)
            rej(error.message)
          }
        );
      });
    });
  
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
    return Promise.all(promises);
  }
}

(window as any).PUPPETCAM = new Puppetcam();
