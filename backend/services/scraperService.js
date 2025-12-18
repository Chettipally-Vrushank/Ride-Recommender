import { chromium } from 'playwright';

let browser = null;

export async function getBrowser() {
  if (!browser) {
    console.log('Launching Playwright browser...');
    browser = await chromium.launch({
      headless: true, // Set to false for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Helper to run a scraping task in a fresh context
 */
export async function scrapeWithContext(callback) {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  
  try {
    return await callback(page);
  } catch (error) {
    console.error("Scraping error:", error.message);
    throw error;
  } finally {
    await context.close();
  }
}
