export interface S3StreamerInput {
  recorder: MediaRecorder;
  id: string;
}

export class S3Streamer {
  private recorder: MediaRecorder;
  private data: any;
  private chunks: Array<Blob>;
  private id: string;

  constructor(input: S3StreamerInput) {
    const { recorder, id } = input;
    this.id = id;
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

  async stop() {

    return new Promise<string>((res, rej) => {

      async function downloadSequentially(url: any) {
          if (url) {
            const currentId = await download(url);
            const success = await onDownloadComplete(currentId);
          } 
      }
      
      function download(url: any) {
        return new Promise(resolve => chrome.downloads.download({url}, resolve));
      }
      
      function onDownloadComplete(itemId: any) {
        return new Promise(resolve => {
          chrome.downloads.onChanged.addListener(function onChanged({id, state}) {
            if (id === itemId && state && state.current !== 'in_progress') {
              chrome.downloads.onChanged.removeListener(onChanged);
              resolve(state.current === 'complete');
            }
          });
        });
      }

      this.recorder.onstop = async () => {
        console.log("onstop---> this.chunks", this.chunks);
        try {
          const blob = new Blob(this.chunks, {
            type: "video/webm",
          });

          var a = document.createElement("a"),
            url = URL.createObjectURL(blob);
          a.href = url;
          a.download = `${this.id}-enzo-records.webm`;
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 0);

          // const down = new Promise<number>((resolve, reject) => {
          //   chrome.downloads.download(
          //     {
          //       url: url,
          //       filename: `${this.id}-enzo2-records.webm`,
          //     },
          //     (download) => {
          //       console.log("download", download);
          //       resolve(download);
          //     }
          //   );
          // });

          // const id: number = await down;

          // chrome.downloads.search({ id }, function (items) {
          //   items.forEach(function (item) {
          //     if (item.endTime) {
          //       console.log('item====>', item)
          //       console.log(new Date(item.endTime));
          //       return res("Hello Stop");
          //     }
          //   });
          // });

          const result = await downloadSequentially(url)
          console.log('result====>', result)
          return res("Hello Stop");
        } catch (e) {
          console.log("onstop error", e);
          return rej(e);
        }
      };
      this.recorder.stop();
    });
  }
}
