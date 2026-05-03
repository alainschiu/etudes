/**
 * Smoke: load app from vite preview, go offline, hard reload — shell should still load (PWA precache).
 * Run with: npm exec --yes --package=puppeteer-core -- node scripts/pwa-offline-smoke.mjs
 * Requires CHROME_PATH (default: /usr/local/bin/google-chrome) and PREVIEW_URL (default: http://127.0.0.1:4173/).
 */
import puppeteer from 'puppeteer-core';

const chromePath = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: chromePath,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#root', { timeout: 60000 });
// React + useRegisterSW registers after load; poll for controlling SW
const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
if (!swSupported) {
  await browser.close();
  throw new Error('serviceWorker not supported');
}
for (let i = 0; i < 240; i++) {
  const ctrl = await page.evaluate(() => navigator.serviceWorker?.controller?.scriptURL || null);
  if (ctrl) break;
  await new Promise((r) => setTimeout(r, 500));
}
const reg1 = await page.evaluate(() => navigator.serviceWorker?.controller?.scriptURL || null);
if (!reg1) {
  await browser.close();
  throw new Error('No controlling service worker after 120s — registration may have failed');
}
await page.setOfflineMode(true);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
const title = await page.title();
const hasRoot = await page.evaluate(() => !!document.getElementById('root'));
const reg2 = await page.evaluate(() => navigator.serviceWorker?.controller?.scriptURL || null);
await browser.close();

const ok = hasRoot && title.includes('Études');
console.log(JSON.stringify({ title, hasRoot, swBeforeOffline: reg1, swAfterReload: reg2, ok }, null, 2));
if (!ok) process.exit(1);
