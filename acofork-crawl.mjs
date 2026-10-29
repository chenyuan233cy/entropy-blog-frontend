import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../.runtime/acofork');
const PAGES = path.join(OUT, 'pages');
const BASE = 'https://www.acofork.com';
fs.mkdirSync(PAGES, { recursive: true });
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
});
const page = await ctx.newPage();

const cssSeen = new Map();
page.on('response', async (res) => {
  const u = res.url();
  if (u.split('?')[0].endsWith('.css') && !cssSeen.has(u)) {
    try { cssSeen.set(u, await res.text()); } catch (e) {}
  }
});

async function extract() {
  return await page.evaluate(() => {
    const vis = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      return true;
    };
    const txt = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');

    const main = document.querySelector('main') || document.body;

    const blocks = [];
    const walkBlock = (rootEl, depth) => {
      if (depth > 4) return;
      for (const el of rootEl.children) {
        const tag = el.tagName.toLowerCase();
        const slot = el.getAttribute('data-slot') || '';
        const cls = (el.className && typeof el.className === 'string') ? el.className : '';
        const ownHeading = el.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4');
        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (area < 6000) continue;
        const full = txt(el);
        blocks.push({
          depth: depth,
          tag: tag,
          slot: slot,
          heading: ownHeading ? txt(ownHeading) : '',
          headingLevel: ownHeading ? ownHeading.tagName.toLowerCase() : '',
          text: full.slice(0, 1600),
          len: full.length,
          area: Math.round(area),
          childCount: el.children.length,
          classSample: cls.slice(0, 240)
        });
        if (full.length > 240) walkBlock(el, depth + 1);
      }
    };
    walkBlock(main, 0);

    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5')].filter(vis).map((h) => ({
      level: h.tagName.toLowerCase(), text: txt(h), id: h.id || ''
    }));

    const navs = [];
    const navRoots = document.querySelectorAll('nav, [data-slot="sidebar"], [data-sidebar], header, aside, [role="navigation"]');
    for (const n of navRoots) {
      const items = [...n.querySelectorAll('a')].filter(vis).map((a) => ({
        text: txt(a),
        href: a.getAttribute('href'),
        abs: a.href,
        active: a.getAttribute('data-active') || a.getAttribute('aria-current') || '',
        target: a.getAttribute('target') || '',
        title: a.getAttribute('title') || ''
      }));
      if (!items.length) continue;
      const groups = [...n.querySelectorAll('[data-slot="sidebar-group-label"], [data-sidebar="group-label"]')]
        .filter(vis).map((g) => txt(g));
      navs.push({
        tag: n.tagName.toLowerCase(),
        slot: n.getAttribute('data-slot') || n.getAttribute('data-sidebar') || '',
        ariaLabel: n.getAttribute('aria-label') || '',
        groups: groups,
        itemCount: items.length,
        items: items
      });
    }

    const footers = [...document.querySelectorAll('footer')].map((f) => ({
      text: txt(f),
      links: [...f.querySelectorAll('a')].map((a) => ({ text: txt(a), href: a.href })),
      iframes: [...f.querySelectorAll('iframe')].map((i) => i.getAttribute('src')),
      html: f.outerHTML.slice(0, 5000)
    }));

    const controls = [...document.querySelectorAll('button, [role="button"], summary, input, select, textarea')]
      .filter(vis).map((b) => ({
        tag: b.tagName.toLowerCase(),
        text: txt(b).slice(0, 90),
        ariaLabel: b.getAttribute('aria-label') || '',
        slot: b.getAttribute('data-slot') || '',
        type: b.getAttribute('type') || '',
        title: b.getAttribute('title') || '',
        placeholder: b.getAttribute('placeholder') || ''
      }));

    const links = [...document.querySelectorAll('a[href]')].map((a) => ({
      text: txt(a), href: a.getAttribute('href'), abs: a.href, target: a.getAttribute('target') || ''
    }));

    const htmlEl = document.documentElement;
    const themeState = {
      htmlClass: htmlEl.className,
      colorSchemeMeta: (document.querySelector('meta[name="color-scheme"]') || {}).content || '',
      themeColorMeta: (document.querySelector('meta[name="theme-color"]') || {}).content || '',
      storage: (function () { try { var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify(o); } catch (e) { return 'n/a'; } })()
    };

    const imgs = [...document.querySelectorAll('img')].filter(vis).map((i) => ({
      src: i.currentSrc || i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight,
      loading: i.getAttribute('loading') || ''
    }));

    const iframes = [...document.querySelectorAll('iframe')].map((f) => ({
      src: f.getAttribute('src'), title: f.getAttribute('title') || '', w: f.getAttribute('width'), h: f.getAttribute('height')
    }));

    return {
      url: location.href,
      title: document.title,
      metaDescription: (document.querySelector('meta[name="description"]') || {}).content || '',
      lang: htmlEl.lang,
      bodyText: txt(document.body).slice(0, 24000),
      blockCount: blocks.length,
      blocks: blocks,
      headings: headings,
      navs: navs,
      footers: footers,
      controls: controls,
      links: links,
      imgs: imgs,
      iframes: iframes,
      themeState: themeState,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyFont: getComputedStyle(document.body).fontFamily,
      bodyColor: getComputedStyle(document.body).color,
      scrollH: document.documentElement.scrollHeight
    };
  });
}

async function visit(url, opts) {
  opts = opts || {};
  const rec = { url: url, at: new Date().toISOString() };
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    rec.status = resp ? resp.status() : null;
    await page.waitForTimeout(1400);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    rec.finalUrl = page.url();
    Object.assign(rec, await extract());
    rec.html = await page.content();
    if (opts.screenshot) {
      const p = path.join(opts.screenshotDir, opts.screenshot);
      await page.screenshot({ path: p, fullPage: true });
      rec.screenshot = p;
    }
  } catch (e) {
    rec.error = String(e).slice(0, 500);
  }
  return rec;
}

const slug = process.argv[2] || 'home';
const target = process.argv[3] || (BASE + '/');
const shot = process.argv[4] || '';
const rec = await visit(target, shot ? { screenshot: shot, screenshotDir: path.resolve(process.cwd(), '../docs/refs') } : {});
fs.writeFileSync(path.join(PAGES, slug + '.json'), JSON.stringify(rec, null, 1));
fs.writeFileSync(path.join(PAGES, slug + '.html'), rec.html || '');
console.log(JSON.stringify({
  slug: slug, status: rec.status, title: rec.title, error: rec.error || null,
  blocks: rec.blockCount, headings: (rec.headings || []).length,
  links: (rec.links || []).length, scrollH: rec.scrollH, shot: shot || null
}));

for (const pair of cssSeen) {
  const u = pair[0];
  const body = pair[1];
  const name = u.split('/').pop().split('?')[0];
  fs.writeFileSync(path.join(OUT, 'css', name), body);
}

await browser.close();
