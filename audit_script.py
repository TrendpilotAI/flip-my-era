#!/usr/bin/env python3
"""Comprehensive UX audit of flipmyera.com"""

import json, time, os, re
from datetime import datetime
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright

BASE = "https://flipmyera.com"
SCREENSHOT_DIR = "/data/workspace/projects/flip-my-era/screenshots/audit"
REPORT_PATH = "/data/workspace/reports/flipmyera-ux-audit.md"

results = {
    "pages": {},
    "broken_links": [],
    "missing_images": [],
    "console_errors": {},
    "accessibility": {},
    "seo": {},
    "performance": {},
    "era_cards": [],
    "auth_test": {},
}

def collect_page_data(page, url, label, browser_context, viewport_name):
    """Visit a page and collect all audit data."""
    console_msgs = []
    page.on("console", lambda msg: console_msgs.append({"type": msg.type, "text": msg.text}))
    
    start = time.time()
    try:
        resp = page.goto(url, wait_until="networkidle", timeout=30000)
    except Exception as e:
        results["pages"][f"{label}_{viewport_name}"] = {"error": str(e), "url": url}
        return
    load_time = round(time.time() - start, 2)
    
    status = resp.status if resp else "no response"
    
    # Screenshot
    safe_label = re.sub(r'[^a-zA-Z0-9_-]', '_', label)
    ss_path = f"{SCREENSHOT_DIR}/{safe_label}_{viewport_name}.png"
    page.screenshot(path=ss_path, full_page=True)
    
    # Only collect detailed data once per page (desktop pass)
    if viewport_name != "desktop":
        results["pages"][f"{label}_{viewport_name}"] = {"url": url, "status": status, "load_time": load_time, "screenshot": ss_path}
        return
    
    # SEO
    title = page.title()
    meta_desc = page.evaluate("document.querySelector('meta[name=\"description\"]')?.content || ''")
    og_image = page.evaluate("document.querySelector('meta[property=\"og:image\"]')?.content || ''")
    og_title = page.evaluate("document.querySelector('meta[property=\"og:title\"]')?.content || ''")
    canonical = page.evaluate("document.querySelector('link[rel=\"canonical\"]')?.href || ''")
    
    # Accessibility - images without alt
    imgs = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src, alt: img.alt, hasAlt: img.hasAttribute('alt'),
            naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
            complete: img.complete
        }))
    }""")
    
    missing_alt = [i for i in imgs if not i["hasAlt"]]
    broken_imgs = [i for i in imgs if i["complete"] and i["naturalWidth"] == 0]
    
    # Forms without labels
    form_issues = page.evaluate("""() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        const issues = [];
        inputs.forEach(inp => {
            const id = inp.id;
            const hasLabel = id && document.querySelector(`label[for="${id}"]`);
            const hasAriaLabel = inp.getAttribute('aria-label');
            const hasPlaceholder = inp.getAttribute('placeholder');
            if (!hasLabel && !hasAriaLabel && !hasPlaceholder) {
                issues.push({tag: inp.tagName, type: inp.type, id: inp.id, name: inp.name});
            }
        });
        return issues;
    }""")
    
    # Links
    links = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('a[href]')).map(a => ({
            href: a.href, text: a.textContent.trim().substring(0, 50)
        }))
    }""")
    
    # Headings structure
    headings = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
            tag: h.tagName, text: h.textContent.trim().substring(0, 80)
        }))
    }""")
    
    errors_only = [m for m in console_msgs if m["type"] in ("error", "warning")]
    
    results["pages"][f"{label}_{viewport_name}"] = {
        "url": url, "status": status, "load_time": load_time, "screenshot": ss_path
    }
    results["seo"][label] = {
        "title": title, "meta_description": meta_desc, "og_image": og_image,
        "og_title": og_title, "canonical": canonical
    }
    results["accessibility"][label] = {
        "missing_alt": missing_alt, "broken_images": broken_imgs,
        "form_issues": form_issues, "headings": headings
    }
    results["console_errors"][label] = errors_only
    results["performance"][label] = {"load_time_s": load_time}
    
    return links


def test_era_cards(page):
    """Click each era card and capture what happens."""
    page.goto(BASE, wait_until="networkidle", timeout=30000)
    time.sleep(1)
    
    # Find clickable era cards
    cards = page.evaluate("""() => {
        // Look for cards/buttons that might represent eras
        const candidates = document.querySelectorAll('[class*="card"], [class*="era"], [class*="Card"], button, [role="button"]');
        return Array.from(candidates).map((el, i) => ({
            index: i, tag: el.tagName, class: el.className,
            text: el.textContent.trim().substring(0, 100),
            rect: el.getBoundingClientRect()
        })).filter(c => c.rect.width > 50 && c.rect.height > 50);
    }""")
    
    results["era_cards_found"] = cards
    
    for i, card in enumerate(cards[:10]):  # limit to 10
        try:
            page.goto(BASE, wait_until="networkidle", timeout=30000)
            time.sleep(0.5)
            
            # Re-query and click
            elements = page.query_selector_all('[class*="card"], [class*="era"], [class*="Card"], button, [role="button"]')
            visible = []
            for el in elements:
                box = el.bounding_box()
                if box and box["width"] > 50 and box["height"] > 50:
                    visible.append(el)
            
            if i < len(visible):
                visible[i].click()
                time.sleep(1.5)
                
                new_url = page.url
                ss_path = f"{SCREENSHOT_DIR}/era_card_{i}_click.png"
                page.screenshot(path=ss_path, full_page=True)
                
                results["era_cards"].append({
                    "card_index": i, "card_text": card["text"][:50],
                    "resulted_url": new_url, "screenshot": ss_path
                })
        except Exception as e:
            results["era_cards"].append({"card_index": i, "error": str(e)})


def test_auth_page(page):
    """Test auth page interactions."""
    page.goto(f"{BASE}/auth", wait_until="networkidle", timeout=30000)
    time.sleep(1)
    
    ss_path = f"{SCREENSHOT_DIR}/auth_initial.png"
    page.screenshot(path=ss_path, full_page=True)
    
    # Find inputs
    inputs = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('input')).map(inp => ({
            type: inp.type, name: inp.name, id: inp.id,
            placeholder: inp.placeholder, visible: inp.offsetParent !== null
        }))
    }""")
    
    # Find buttons
    buttons = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('button, [role="button"], a[class*="sign"], a[class*="auth"], a[class*="login"]')).map(b => ({
            tag: b.tagName, text: b.textContent.trim().substring(0, 50),
            class: b.className, type: b.type || ''
        }))
    }""")
    
    # Try filling email if present
    email_input = page.query_selector('input[type="email"], input[name="email"], input[placeholder*="email" i]')
    password_input = page.query_selector('input[type="password"]')
    
    fill_results = {}
    if email_input:
        try:
            email_input.fill("test@example.com")
            fill_results["email"] = "filled successfully"
        except Exception as e:
            fill_results["email"] = f"error: {e}"
    
    if password_input:
        try:
            password_input.fill("TestPassword123!")
            fill_results["password"] = "filled successfully"
        except Exception as e:
            fill_results["password"] = f"error: {e}"
    
    ss_path2 = f"{SCREENSHOT_DIR}/auth_filled.png"
    page.screenshot(path=ss_path2, full_page=True)
    
    results["auth_test"] = {
        "inputs": inputs, "buttons": buttons,
        "fill_results": fill_results, "url": page.url
    }


def check_links(page, all_links):
    """Check all discovered links for 404s."""
    checked = set()
    for link in all_links:
        href = link.get("href", "")
        if not href or href in checked:
            continue
        parsed = urlparse(href)
        if parsed.scheme not in ("http", "https", ""):
            continue
        # Only check same-domain + external
        checked.add(href)
        if len(checked) > 50:
            break
        try:
            resp = page.request.get(href, timeout=10000)
            if resp.status >= 400:
                results["broken_links"].append({"url": href, "status": resp.status, "text": link.get("text", "")})
        except:
            results["broken_links"].append({"url": href, "status": "timeout/error", "text": link.get("text", "")})


def generate_report():
    """Generate markdown report."""
    r = results
    lines = [
        "# FlipMyEra.com — UX Audit Report",
        f"\n**Date:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        f"**Audited URL:** {BASE}",
        "\n---\n",
        "## 📊 Summary\n",
    ]
    
    # Performance summary
    lines.append("### ⚡ Performance\n")
    lines.append("| Page | Load Time (s) | Status |")
    lines.append("|------|--------------|--------|")
    for key, data in r["pages"].items():
        if "desktop" in key:
            status = data.get("status", "?")
            lt = data.get("load_time", "?")
            lines.append(f"| {key} | {lt} | {status} |")
    
    # SEO
    lines.append("\n### 🔍 SEO\n")
    for page_name, seo in r["seo"].items():
        lines.append(f"#### {page_name}\n")
        lines.append(f"- **Title:** {seo['title'] or '⚠️ MISSING'}")
        lines.append(f"- **Meta Description:** {seo['meta_description'] or '⚠️ MISSING'}")
        lines.append(f"- **OG Image:** {seo['og_image'] or '⚠️ MISSING'}")
        lines.append(f"- **OG Title:** {seo['og_title'] or '⚠️ MISSING'}")
        lines.append(f"- **Canonical:** {seo['canonical'] or '⚠️ MISSING'}")
        lines.append("")
    
    # Accessibility
    lines.append("\n### ♿ Accessibility\n")
    for page_name, a11y in r["accessibility"].items():
        lines.append(f"#### {page_name}\n")
        if a11y["missing_alt"]:
            lines.append(f"- ⚠️ **{len(a11y['missing_alt'])} images missing alt text**")
            for img in a11y["missing_alt"][:5]:
                lines.append(f"  - `{img['src'][:80]}`")
        else:
            lines.append("- ✅ All images have alt text")
        
        if a11y["broken_images"]:
            lines.append(f"- ❌ **{len(a11y['broken_images'])} broken images**")
            for img in a11y["broken_images"][:5]:
                lines.append(f"  - `{img['src'][:80]}`")
        else:
            lines.append("- ✅ No broken images detected")
        
        if a11y["form_issues"]:
            lines.append(f"- ⚠️ **{len(a11y['form_issues'])} form inputs without labels**")
            for fi in a11y["form_issues"]:
                lines.append(f"  - `<{fi['tag'].lower()} type=\"{fi['type']}\">`")
        else:
            lines.append("- ✅ Form inputs have labels/placeholders")
        
        if a11y["headings"]:
            lines.append("- **Heading structure:**")
            for h in a11y["headings"]:
                indent = "  " * (int(h["tag"][1]) - 1)
                lines.append(f"  {indent}{h['tag']}: {h['text'][:60]}")
        lines.append("")
    
    # Console Errors
    lines.append("\n### 🐛 Console Errors\n")
    any_errors = False
    for page_name, errors in r["console_errors"].items():
        if errors:
            any_errors = True
            lines.append(f"#### {page_name}\n")
            for err in errors[:10]:
                lines.append(f"- [{err['type']}] `{err['text'][:120]}`")
            lines.append("")
    if not any_errors:
        lines.append("✅ No console errors detected\n")
    
    # Broken Links
    lines.append("\n### 🔗 Broken Links\n")
    if r["broken_links"]:
        for bl in r["broken_links"]:
            lines.append(f"- ❌ [{bl['status']}] `{bl['url'][:80]}` (text: \"{bl['text']}\")")
    else:
        lines.append("✅ No broken links detected\n")
    
    # Era Cards
    lines.append("\n### 🎴 Era Card Interactions\n")
    if r.get("era_cards_found"):
        lines.append(f"Found **{len(r['era_cards_found'])}** clickable card-like elements\n")
    for card in r["era_cards"]:
        if "error" in card:
            lines.append(f"- Card {card['card_index']}: ❌ Error — {card['error'][:80]}")
        else:
            lines.append(f"- Card {card['card_index']} (\"{card['card_text']}\"): → `{card['resulted_url']}`")
    lines.append("")
    
    # Auth Page
    lines.append("\n### 🔐 Auth Page Test\n")
    auth = r["auth_test"]
    if auth:
        lines.append(f"**URL:** {auth.get('url', 'N/A')}\n")
        lines.append(f"**Inputs found:** {len(auth.get('inputs', []))}")
        for inp in auth.get("inputs", []):
            lines.append(f"- `<input type=\"{inp['type']}\" name=\"{inp['name']}\" placeholder=\"{inp['placeholder']}\">`{' (hidden)' if not inp['visible'] else ''}")
        lines.append(f"\n**Buttons found:** {len(auth.get('buttons', []))}")
        for btn in auth.get("buttons", []):
            lines.append(f"- `<{btn['tag'].lower()}>` \"{btn['text']}\"")
        lines.append(f"\n**Form fill test:**")
        for field, result in auth.get("fill_results", {}).items():
            emoji = "✅" if "success" in result else "❌"
            lines.append(f"- {emoji} {field}: {result}")
    lines.append("")
    
    # Screenshots index
    lines.append("\n### 📸 Screenshots\n")
    lines.append("All screenshots saved to `projects/flip-my-era/screenshots/audit/`\n")
    for key, data in r["pages"].items():
        ss = data.get("screenshot", "")
        if ss:
            lines.append(f"- `{os.path.basename(ss)}` — {key}")
    lines.append("")
    
    # Recommendations
    lines.append("\n---\n")
    lines.append("## 🎯 Recommendations\n")
    
    recs = []
    # Check SEO gaps
    for p, seo in r["seo"].items():
        if not seo["meta_description"]:
            recs.append(f"Add meta description to **{p}**")
        if not seo["og_image"]:
            recs.append(f"Add og:image to **{p}**")
        if not seo["og_title"]:
            recs.append(f"Add og:title to **{p}**")
    
    # Check a11y
    for p, a11y in r["accessibility"].items():
        if a11y["missing_alt"]:
            recs.append(f"Add alt text to {len(a11y['missing_alt'])} images on **{p}**")
        if a11y["form_issues"]:
            recs.append(f"Add labels to {len(a11y['form_issues'])} form inputs on **{p}**")
    
    if r["broken_links"]:
        recs.append(f"Fix {len(r['broken_links'])} broken links")
    
    # Performance
    for p, perf in r["performance"].items():
        if perf["load_time_s"] > 3:
            recs.append(f"Optimize load time for **{p}** ({perf['load_time_s']}s)")
    
    if recs:
        for i, rec in enumerate(recs, 1):
            lines.append(f"{i}. {rec}")
    else:
        lines.append("No critical issues found! 🎉")
    
    with open(REPORT_PATH, "w") as f:
        f.write("\n".join(lines))
    
    print(f"Report written to {REPORT_PATH}")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        all_links = []
        pages_to_visit = [
            (BASE, "homepage"),
            (f"{BASE}/auth", "auth"),
        ]
        
        # Desktop pass
        print("=== Desktop (1440x900) ===")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        
        for url, label in pages_to_visit:
            print(f"  Visiting {label}...")
            links = collect_page_data(page, url, label, ctx, "desktop")
            if links:
                all_links.extend(links)
        
        # Discover more pages from links
        discovered = set()
        for link in all_links:
            href = link.get("href", "")
            parsed = urlparse(href)
            if parsed.netloc and "flipmyera.com" in parsed.netloc:
                path = parsed.path.rstrip("/")
                if path and path not in ("/", "/auth") and path not in discovered:
                    discovered.add(path)
                    pages_to_visit.append((href, f"page_{path.replace('/', '_').strip('_')}"))
        
        # Visit discovered pages
        for url, label in pages_to_visit[2:]:
            print(f"  Visiting discovered: {label}...")
            links = collect_page_data(page, url, label, ctx, "desktop")
            if links:
                all_links.extend(links)
        
        # Check links
        print("  Checking links...")
        check_links(page, all_links)
        
        # Test era cards
        print("  Testing era cards...")
        test_era_cards(page)
        
        # Test auth
        print("  Testing auth page...")
        test_auth_page(page)
        
        ctx.close()
        
        # Mobile pass
        print("\n=== Mobile (375x812) ===")
        ctx = browser.new_context(
            viewport={"width": 375, "height": 812},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = ctx.new_page()
        
        for url, label in pages_to_visit:
            print(f"  Visiting {label}...")
            collect_page_data(page, url, label, ctx, "mobile")
        
        ctx.close()
        browser.close()
    
    # Generate report
    generate_report()
    
    # Also dump raw JSON
    with open(f"{SCREENSHOT_DIR}/raw_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print("\n✅ Audit complete!")
    print(f"  Screenshots: {SCREENSHOT_DIR}/")
    print(f"  Report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
