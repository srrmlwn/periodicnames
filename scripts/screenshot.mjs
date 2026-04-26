import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const URL = 'http://localhost:5173';
const OUT = './scripts/screenshots';
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

// Desktop
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 15000 });
await sleep(1200);
await page.screenshot({ path: `${OUT}/01-initial-desktop.png`, fullPage: true });
console.log('✓ 01-initial-desktop.png');

// Type name
const input = await page.$('input');
await input.type('Sriram');
await page.screenshot({ path: `${OUT}/02-name-typed.png`, fullPage: true });
console.log('✓ 02-name-typed.png');

await page.keyboard.press('Enter');
await sleep(350);
await page.screenshot({ path: `${OUT}/03-processing.png`, fullPage: true });
console.log('✓ 03-processing.png');

await sleep(2800);
await page.screenshot({ path: `${OUT}/04-results-sriram.png`, fullPage: true });
console.log('✓ 04-results-sriram.png');

// Name with fake elements (Z has no real match)
const refreshBtn = await page.$('button[title="Try a new name"]');
if (refreshBtn) await refreshBtn.click();
await sleep(400);
const input2 = await page.$('input');
await input2.type('Zara');
await page.keyboard.press('Enter');
await sleep(3000);
await page.screenshot({ path: `${OUT}/05-results-zara.png`, fullPage: true });
console.log('✓ 05-results-zara.png');

// Mobile
await page.setViewport({ width: 390, height: 844 });
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 15000 });
await sleep(1000);
await page.screenshot({ path: `${OUT}/06-mobile-initial.png`, fullPage: true });
console.log('✓ 06-mobile-initial.png');

const input3 = await page.$('input');
await input3.type('Carlos');
await page.keyboard.press('Enter');
await sleep(3000);
await page.screenshot({ path: `${OUT}/07-mobile-results.png`, fullPage: true });
console.log('✓ 07-mobile-results.png');

await browser.close();
console.log('\nAll screenshots saved to', OUT);
