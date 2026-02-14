"""FlipMyEra E2E browser test using Playwright (headless)"""
import asyncio
import os
import json
from datetime import datetime
from playwright.async_api import async_playwright

SITE_URL = "https://flipmyera.com"
SCREENSHOT_DIR = "/data/workspace/projects/flip-my-era/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = []

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
    results.append(msg)

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )
        page = await context.new_page()

        # Collect console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type in ["error", "warning"] else None)

        # 1. Homepage load
        log("=== TEST 1: Homepage Load ===")
        try:
            resp = await page.goto(SITE_URL, wait_until="networkidle", timeout=30000)
            log(f"Status: {resp.status}")
            title = await page.title()
            log(f"Title: {title}")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/01-homepage.png", full_page=True)
            log("Screenshot: 01-homepage.png ✅")
        except Exception as e:
            log(f"FAIL: {e}")

        # 2. Check for visible elements
        log("\n=== TEST 2: Key UI Elements ===")
        for selector, name in [
            ("nav", "Navigation"),
            ("button", "Buttons"),
            ("a[href]", "Links"),
            ("img", "Images"),
            ("h1", "H1 heading"),
            ("h2", "H2 headings"),
        ]:
            count = await page.locator(selector).count()
            log(f"{name}: {count} found")

        # 3. Check all navigation links
        log("\n=== TEST 3: Navigation Links ===")
        links = await page.locator("nav a[href]").all()
        nav_hrefs = []
        for link in links:
            href = await link.get_attribute("href")
            text = (await link.inner_text()).strip()
            nav_hrefs.append({"text": text, "href": href})
            log(f"Nav link: '{text}' -> {href}")

        # 4. Test each internal nav link
        log("\n=== TEST 4: Navigate Internal Pages ===")
        idx = 2
        for item in nav_hrefs:
            href = item["href"]
            if not href or href.startswith("http") and "flipmyera" not in href:
                continue
            if href.startswith("/"):
                href = SITE_URL + href
            try:
                idx += 1
                resp = await page.goto(href, wait_until="networkidle", timeout=15000)
                log(f"Page '{item['text']}' ({href}): status {resp.status}")
                await page.screenshot(path=f"{SCREENSHOT_DIR}/{idx:02d}-{item['text'].lower().replace(' ', '-')[:20]}.png", full_page=True)
            except Exception as e:
                log(f"FAIL navigating to {href}: {e}")

        # 5. Check for sign-in/sign-up buttons
        log("\n=== TEST 5: Auth Elements ===")
        await page.goto(SITE_URL, wait_until="networkidle", timeout=15000)
        for text in ["Sign In", "Sign Up", "Login", "Register", "Get Started", "Create"]:
            els = await page.get_by_text(text, exact=False).all()
            if els:
                log(f"Found '{text}' element(s): {len(els)}")

        # 6. Mobile viewport test
        log("\n=== TEST 6: Mobile Viewport ===")
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.goto(SITE_URL, wait_until="networkidle", timeout=15000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/mobile-homepage.png", full_page=True)
        log("Mobile screenshot: mobile-homepage.png ✅")

        # 7. Console errors summary
        log("\n=== TEST 7: Console Errors ===")
        if console_errors:
            for err in console_errors[:20]:
                log(f"  {err}")
        else:
            log("No console errors ✅")

        # 8. Performance check
        log("\n=== TEST 8: Performance ===")
        await page.set_viewport_size({"width": 1440, "height": 900})
        start = asyncio.get_event_loop().time()
        await page.goto(SITE_URL, wait_until="load", timeout=15000)
        load_time = asyncio.get_event_loop().time() - start
        log(f"Page load time: {load_time:.2f}s")

        await browser.close()

    # Write report
    report = "\n".join(results)
    with open(f"{SCREENSHOT_DIR}/report.txt", "w") as f:
        f.write(report)
    print("\n\n" + "="*60)
    print("FULL REPORT")
    print("="*60)
    print(report)

asyncio.run(run())
