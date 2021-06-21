export interface StreamerInput {
  recorder: MediaRecorder;
  id: string;
  roomId: string;
}

export class Streamer {
  private recorder: MediaRecorder;
  private data: any;
  private chunks: Array<Blob>;
  private id: string;
  private roomId: string;

  constructor(input: StreamerInput) {
    const { recorder, id, roomId } = input;
    this.id = id;
    this.roomId = roomId;
    this.chunks = [];

    this.recorder = recorder;

    recorder.ondataavailable = async (event) => {
      console.log("data available", event.data);
      try {
        if (event.data) {
          this.chunks.push(event.data);
        }
      } catch (e) {
        console.log("ondataavailable error", e.message);
      }
    };
  }

  async start() {
    return new Promise<void>((res, rej) => {
      this.recorder.onstart = async () => {
        console.log("onstart");

        console.log(this.data);

        res();
      };
      this.recorder.start();
      console.log("this.recorder.state", this.recorder.state);
    });
  }

  async downloadSequentially(url: any) {
    if (url) {
      const currentId = await this.download(url);
      const success = await this.onDownloadComplete(currentId);
      return success;
    }
  }

  download(url: any) {
    return new Promise((resolve) => {
      const filename =
        `${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString()}-video-meeting-${
          this.id
        }.webm`.replace(/[\/|:|\s]/gim, "-");

      return chrome.downloads.download(
        {
          url,
          filename,
        },
        resolve
      );
    });
  }

  onDownloadComplete(itemId: any) {
    return new Promise((resolve) => {
      chrome.downloads.onChanged.addListener(function onChanged({ id, state }) {
        if (id === itemId && state && state.current !== "in_progress") {
          chrome.downloads.onChanged.removeListener(onChanged);
          resolve(state.current === "complete");
        }
      });
    });
  }

  async stop() {
    return new Promise<string>((res, rej) => {
      this.recorder.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, {
            type: "video/webm",
          });

          const url = URL.createObjectURL(blob);

          const result = await this.downloadSequentially(url);
          return res(`Video saved on Downloads folder ${result}`);
        } catch (e) {
          console.log("onstop error", e);
          return rej(e);
        }
      };
      this.recorder.stop();
    });
  }
}
