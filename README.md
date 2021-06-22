## Pupeteer Cam

## Set you env vars

Create a `.env` file and fill with your configs

```bash
URL_PAGE=""
ROOM_ID=""
RECORD_TELNYX_MEETING="true"
HEADLESS="false"

```

## To run on Docker

First change the `server.ts` file line 49 to ` headless: false`

```bash
 docker-compose up --build
```

## To run locally

First change the `server.ts` file `line 49` to ` headless: false`

```bash
npm i 
npm start
```

## Start recording
```bash
curl --location --request POST 'http://localhost:3333/start' \
--header 'Content-Type: application/json' \
--header 'Cookie: ajs_anonymous_id=%22DEV-37dc8cec-0191-4afc-9958-dcc71fa5f764%22' \
--data-raw '{
    "id": "1",
    "roomId": "208b22c8-640e-4473-9cbc-7dc2f1a799cb"
}'
```

## Stop recording

```bash
curl --location --request POST 'http://localhost:3333/stop' \
--header 'Content-Type: application/json' \
--header 'Cookie: ajs_anonymous_id=%22DEV-37dc8cec-0191-4afc-9958-dcc71fa5f764%22' \
--data-raw '{
    "id": "1"
}'
```



