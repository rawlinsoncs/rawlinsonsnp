// Stage-3 verification for services/hs-prices/setup.sh — and the first probe
// of the price-service spike.
//
// Connects over CDP to the wizard's Chromium (which carries the coordinator's
// Healthy Selections login in its persistent profile), proves the catalog is
// readable, and prints one real item and price as evidence. It reports which
// read path works — Shopify's product JSON or in-session page reads — so the
// spike knows which mechanism the price service should implement.
//
// CommonJS on purpose: the wizard installs playwright-core into a throwaway
// prefix and loads this script via NODE_PATH, which only works with require().
//
// Never browser.close(): closing a CDP-connected browser kills the Chromium
// the human is logged into. Exiting the process just drops the websocket.

const { chromium } = require('playwright-core');

const CDP_URL = process.env.CHROME_CDP_URL || 'http://127.0.0.1:9222';
const HS_BASE = 'https://healthyselections.ca';

function fail(message) {
  console.error(`FAIL: ${message}`);
  console.error('Remedy: re-run services/hs-prices/setup.sh and log in again.');
  process.exit(1);
}

(async () => {
  let browser;
  try {
    browser = await chromium.connectOverCDP(CDP_URL);
  } catch (err) {
    fail(`cannot reach Chromium at ${CDP_URL} (${err.message})`);
  }

  const context = browser.contexts()[0];
  if (!context) {
    fail('no browser context over CDP — is Chromium running with the persistent profile?');
  }
  const page = await context.newPage();

  // Path A (preferred): Shopify's structured product JSON.
  try {
    const resp = await page.goto(`${HS_BASE}/products.json?limit=250`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const bodyText = await page.evaluate(() =>
      document.body ? document.body.innerText : ''
    );
    if (resp.ok() && bodyText.trim().startsWith('{')) {
      const data = JSON.parse(bodyText);
      const products = Array.isArray(data.products) ? data.products : [];
      const priced = products.filter((p) =>
        (p.variants || []).some((v) => v && v.price)
      );
      if (priced.length > 0) {
        const p = priced[0];
        const v = p.variants.find((x) => x && x.price);
        console.log('Read path: Shopify product JSON (/products.json).');
        console.log(`Products: ${products.length}`);
        console.log(
          `Sample: ${p.title} / ${v.title} — $${v.price} CAD` +
          (v.sku ? ` (sku ${v.sku})` : '')
        );
        process.exit(0);
      }
      console.log('note: /products.json returned JSON but no priced products; trying the catalog page…');
    } else {
      console.log('note: /products.json not readable as JSON; trying the catalog page…');
    }
  } catch (err) {
    console.log(`note: /products.json attempt failed (${err.message}); trying the catalog page…`);
  }

  // Path B: read the catalog page inside the authenticated session.
  try {
    await page.goto(`${HS_BASE}/collections/all`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000); // let theme JS render prices

    if (/(login|authentication|password)/i.test(page.url()) || (await page.$('input[type="password"]'))) {
      fail('the store bounced us to a login page — the HS session did not stick.');
    }

    const sample = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      for (const a of anchors) {
        let el = a;
        for (let i = 0; i < 5 && el.parentElement; i += 1) el = el.parentElement;
        const text = el.innerText || '';
        const m = text.match(/\$\s?\d+(?:\.\d{2})?/);
        if (m) {
          const title =
            (a.innerText || '').trim().split('\n').filter(Boolean)[0] || '(untitled)';
          return { title, price: m[0].replace(/\$\s+/, '$') };
        }
      }
      return null;
    });

    if (sample) {
      console.log('Read path: catalog page scrape (/products.json is gated).');
      console.log(`Sample: ${sample.title} — ${sample.price} CAD`);
      process.exit(0);
    }
    fail('no products or prices visible on the catalog page — the HS session did not stick.');
  } catch (err) {
    fail(`catalog page check errored: ${err.message}`);
  }
})();
