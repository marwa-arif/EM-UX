const { chromium } = require('playwright');

async function measure(page, label) {
  const data = await page.evaluate(() => {
    const sh = document.querySelector('.subheader');
    const pageScroll = document.querySelector('.page-scroll');
    const rect = el => el ? (({left, top, right, width}) => ({left, top, right, width}))(el.getBoundingClientRect()) : null;
    const firstCard = pageScroll ? pageScroll.querySelector('.card') : null;
    return {
      subheader: rect(sh),
      viewportWidth: window.innerWidth,
      pageScrollOuter: rect(pageScroll),
      firstCard: firstCard ? { className: firstCard.className, rect: rect(firstCard) } : null,
    };
  });
  console.log(label, JSON.stringify(data, null, 2));
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.click('text=Discover');
  await page.waitForTimeout(300);
  await page.click('text=Device');
  await page.waitForTimeout(800);
  await measure(page, '=== Discover Device ===');

  await page.click('text=Report');
  await page.waitForTimeout(300);
  await page.locator('text=Compliance').first().click();
  await page.waitForTimeout(1000);
  await measure(page, '=== Compliance ===');

  await browser.close();
})();
