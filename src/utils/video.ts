import { Page } from 'puppeteer';

const DEPLAY_CLICK_MILLISECOND = 2000;

const options = {
  timeout: 30000,
};

export const goToRoomsPage = async (page: Page): Promise<string> => {
  await page.click('[data-testid="btn-select-room"]', {
    delay: DEPLAY_CLICK_MILLISECOND,
  });

  return page.url();
};

export const fillJoinRoomForm = async (
  page: Page,
  roomInfo: any
): Promise<string> => {

await page
  .waitForSelector('[data-testid="input-room-uuid"]', options)

  await page.type('[data-testid="input-room-uuid"]', roomInfo.id);
  await page.evaluate(() => {
    const example = document.querySelector('[data-testid="input-username"]');
    // @ts-ignore
    example.value = "";
  });

  await page.type('[data-testid="input-username"]', 'Recording...');
 
  const userName = await page.evaluate(() =>
   // @ts-ignore
    document
      .querySelector("[data-testid='input-username']")
      .getAttribute('value')
  );


  if (!userName) {
    return '';
  }

  await page.click('[data-testid="btn-join-room"]', {
    delay: DEPLAY_CLICK_MILLISECOND,
  });

  return userName;
};

export const checkIfUserJoined = async (
  page: Page,
  userName: string
): Promise<boolean> => {
  const videoFeed = await page
    .waitForSelector(`[data-testid="video-feed-${userName.toLowerCase().replace(' ', '-')}"]`, options)
    .then((item) => item)
    .catch((error) => error.message);

  if (typeof videoFeed === 'object') {
    return true
  }
 return false
};
