// import { Page } from 'puppeteer';

const DEPLAY_CLICK_MILLISECOND = 2000;

const options = {
  timeout: 30000,
};

export const goToRoomsPage = async (page: any): Promise<string> => {
  await page.click('[data-testid="btn-select-room"]', {
    delay: DEPLAY_CLICK_MILLISECOND,
  });

  return page.url();
};

export const fillJoinRoomForm = async (
  page: any,
  roomInfo: any
): Promise<string> => {
  await page.waitForSelector('[data-testid="input-room-uuid"]')
  await page.waitForSelector('[data-testid="input-username"]')

  await page.type('[data-testid="input-room-uuid"]', roomInfo.id);
  await page.type('[data-testid="input-username"]', 'Recording user');

 
  const userName = await page.evaluate(() =>
   // @ts-ignore
    document
      .querySelector("[data-testid='input-username']")
      .getAttribute('placeholder')
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
  page: any,
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

