import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const origin = 'https://mingalaredu.com';
const draft = process.env.SHOW_DRAFT_FEES === '1';
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const read = (file) => readFile(file, 'utf8');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat();
}
const files = await walk(root);
const existing = new Set(files.map((file) => path.relative(root, file).replaceAll('\\', '/')));
const decode = (value) => value.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code))).replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const plain = (html) => decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((match) => [match[1].toLowerCase(), decode(match[2] ?? match[3])]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => attrs(match[0]));
const typed = (nodes, type) => nodes.filter((node) => node['@type'] === type || Array.isArray(node['@type']) && node['@type'].includes(type));
function flatten(value) {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(flatten)];
}
function resolves(url, base = `${origin}/`) {
  let target;
  try { target = new URL(url, base); } catch { return false; }
  if (target.origin !== origin) return true;
  const local = decodeURIComponent(target.pathname).replace(/^\//, '');
  return existing.has(local) || existing.has(`${local.replace(/\/$/, '')}/index.html`) || local === '' && existing.has('index.html');
}
const required = ['index.html', 'en/index.html', 'my/index.html', 'en/study-in-china/index.html', 'en/study-in-china/china-top-universities-bachelor/index.html', '404.html', 'CNAME', 'robots.txt', 'llms.txt', 'sitemap-index.xml'];
for (const file of required) check(existing.has(file), `Missing dist/${file}`);
const fees = JSON.parse(await read('src/data/fees.json'));
const products = JSON.parse(await read('src/data/products.json'));
const amounts = [...new Set(Object.values(fees.rates).flatMap((rate) => [rate.stage1, rate.stage2]).concat(fees.discount.value))];
const amountPattern = new RegExp(`(?<![\\d.])(?:${amounts.map((value) => `${value}|${Number(value).toLocaleString('en-US')}`).join('|')})(?![\\d.])`);
const documents = new Map();
const titles = new Map();
const descriptions = new Map();
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  if (!/\.(?:html|js|css|json|xml|txt|svg)$/i.test(relative)) continue;
  const text = await read(file);
  check(!/one\s+to\s+korea|otk|guarantee|합격\s*보장/i.test(text), `${relative}: forbidden brand or claim`);
  check(!/fonts\.(?:googleapis|gstatic)\.com|cdn\.tailwindcss\.com/i.test(text), `${relative}: external font or Tailwind CDN`);
  if (/\.html$/.test(relative)) {
    const visible = plain(text);
    check(!/100\s*%/.test(visible), `${relative}: percentage claim`);
    check(!/TODO/i.test(text.replace(/<!--\s*TODO: Burmese translation\s*-->/g, '')), `${relative}: unresolved TODO exposed`);
    if (!draft && fees.status === 'draft') {
      check(!amountPattern.test(visible), `${relative}: draft fee amount in visible HTML`);
      for (const script of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) check(!amountPattern.test(script[1]), `${relative}: draft fee amount in script or JSON-LD`);
    }
    const route = relative === 'index.html' ? '/' : relative === '404.html' ? '/404.html' : `/${relative.replace(/index\.html$/, '')}`;
    const links = tags(text, 'link');
    const metas = tags(text, 'meta');
    const title = decode(text.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
    const description = metas.find((meta) => meta.name === 'description')?.content ?? '';
    check(title.length >= 50 && title.length <= 60, `${relative}: title length ${title.length}, expected 50–60`);
    check(description.length >= 150 && description.length <= 160, `${relative}: description length ${description.length}, expected 150–160`);
    check(!titles.has(title), `${relative}: duplicate title with ${titles.get(title)}`); titles.set(title, relative);
    check(!descriptions.has(description), `${relative}: duplicate description with ${descriptions.get(description)}`); descriptions.set(description, relative);
    const canonical = links.filter((link) => link.rel === 'canonical');
    check(canonical.length === 1 && canonical[0].href === `${origin}${route}`, `${relative}: canonical must be ${origin}${route}`);
    const meta = (key) => metas.find((item) => item.property === key)?.content;
    check(meta('og:title') === title && meta('og:description') === description && meta('og:url') === `${origin}${route}`, `${relative}: Open Graph differs from metadata`);
    check(Boolean(meta('og:type')) && Boolean(meta('og:image')), `${relative}: missing OG type/image`);
    check(resolves(meta('og:image') || '/missing-image'), `${relative}: OG image does not resolve`);
    const alternate = Object.fromEntries(links.filter((link) => link.rel === 'alternate' && link.hreflang).map((link) => [link.hreflang, link.href]));
    const suffix = route.replace(/^\/(?:en|my)\//, '');
    const normal = /^\/(?:en|my)\//.test(route);
    const en = normal ? `${origin}/en/${suffix}` : `${origin}/en/`;
    const my = normal ? `${origin}/my/${suffix}` : `${origin}/my/`;
    check(alternate.en === en && alternate.my === my && alternate['x-default'] === en, `${relative}: incorrect hreflang alternates`);
    let nodes = [];
    const ld = [...text.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    check(ld.length > 0, `${relative}: no static JSON-LD`);
    for (const block of ld) {
      try { nodes.push(...flatten(JSON.parse(block[1]))); } catch (error) { check(false, `${relative}: invalid JSON-LD: ${error.message}`); }
    }
    const org = typed(nodes, 'Organization');
    check(org.length === 1 && org[0]['@id'] === `${origin}/#org` && org[0].name === 'Mingalar Edu', `${relative}: expected one Mingalar Edu Organization #org`);
    if (normal) {
      check(typed(nodes, 'BreadcrumbList').length === 1, `${relative}: missing unique BreadcrumbList`);
      const faqs = typed(nodes, 'FAQPage');
      check(faqs.length === 1, `${relative}: missing unique FAQPage`);
      for (const faq of faqs) {
        check(Array.isArray(faq.mainEntity) && faq.mainEntity.length > 0, `${relative}: empty FAQPage`);
        const visibleFaq = [...text.matchAll(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi)].map((match) => ({ question: plain(match[1]), answer: plain(match[2]) }));
        check(visibleFaq.length === faq.mainEntity?.length, `${relative}: visible FAQ count differs from JSON-LD`);
        for (const question of faq.mainEntity ?? []) {
          check(visible.includes(plain(question.name ?? '')), `${relative}: FAQ question absent from static text`);
          const answer = plain(question.acceptedAnswer?.text ?? '');
          check(answer.length > 0 && visible.includes(answer), `${relative}: FAQ answer absent from static text`);
          check(visibleFaq.some((item) => item.question === plain(question.name ?? '') && item.answer === answer), `${relative}: FAQ question/answer pairing differs from JSON-LD`);
        }
      }
    }
    if (/\/guide\//.test(route)) {
      const articles = typed(nodes, 'Article');
      check(articles.length === 1 && (articles[0].author?.name ?? articles[0].author?.[0]?.name) === 'Steven', `${relative}: guide Article author must be Steven`);
    }
    if (route.startsWith('/my/')) check(text.includes('<!-- TODO: Burmese translation -->'), `${relative}: missing Burmese translation comment`);
    for (const tag of [...tags(text, 'a'), ...tags(text, 'link'), ...tags(text, 'script'), ...tags(text, 'img')]) {
      const target = tag.href ?? tag.src;
      if (!target || /^(?:tel:|mailto:|viber:|data:|javascript:)/i.test(target)) continue;
      check(resolves(target, `${origin}${route}`), `${relative}: broken internal URL ${target}`);
    }
    for (const image of tags(text, 'img')) check(/\.webp(?:[?#]|$)/.test(image.src ?? '') && Boolean(image.width) && Boolean(image.height), `${relative}: images require WebP, width and height`);
    check(!/<video\b[^>]*\bautoplay\b/i.test(text), `${relative}: autoplay video`);
    documents.set(route, { alternate, text, visible, relative });
  } else if (/\.(?:js|json|xml|txt)$/.test(relative) && !draft && fees.status === 'draft') {
    check(!amountPattern.test(text), `${relative}: draft numeric fee payload in public artifact`);
  }
}
for (const [route, doc] of documents) {
  if (!/^\/(?:en|my)\//.test(route)) continue;
  for (const lang of ['en', 'my']) {
    let targetRoute;
    try { targetRoute = new URL(doc.alternate[lang]).pathname; }
    catch { check(false, `${doc.relative}: missing or invalid ${lang} hreflang URL`); continue; }
    check(documents.has(targetRoute), `${doc.relative}: missing ${lang} translation route`);
    check(documents.get(targetRoute)?.alternate.en === doc.alternate.en && documents.get(targetRoute)?.alternate.my === doc.alternate.my, `${doc.relative}: nonreciprocal hreflang`);
  }
}
for (const product of products) for (const lang of ['en', 'my']) {
  const route = `/${lang}/study-in-${product.country}/${product.slug}/`;
  const doc = documents.get(route);
  check(Boolean(doc), `Missing product route ${route}`);
  if (!doc) continue;
  if (!draft && fees.status === 'draft') check(doc.visible.includes('Fees: contact us'), `${doc.relative}: hidden fees need contact label`);
  if (draft) {
    const rate = fees.rates[product.code];
    const rows = [...doc.text.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]);
    const row = rows.find((value) => plain(value).includes(product.code));
    check(Boolean(row), `${doc.relative}: missing static fee row for ${product.code}`);
    if (row) {
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => plain(match[1]).replaceAll(',', ''));
      const expected = [rate.stage1, rate.stage2, rate.rejected_stage2].map((value) => `${fees.currency} ${value}`);
      check(JSON.stringify(cells) === JSON.stringify(expected), `${doc.relative}: fee row must show ${expected.join(' / ')}`);
    }
    check(doc.visible.includes(Number(fees.discount.value).toLocaleString('en-US')) && doc.visible.includes(fees.discount.valid_until), `${doc.relative}: voucher amount or expiry missing`);
  }
}
if (existing.has('CNAME')) check((await read(path.join(root, 'CNAME'))).trim() === 'mingalaredu.com', 'CNAME does not match domain');
if (existing.has('robots.txt')) {
  const original = await read('robots.txt');
  const robots = await read(path.join(root, 'robots.txt'));
  check(robots.replace(/^Sitemap:.*$/gm, '').trim() === original.replace(/^Sitemap:.*$/gm, '').trim(), 'robots directives changed');
  check(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`), 'robots does not reference sitemap-index.xml');
}
const sitemapUrls = new Set();
for (const relative of existing) if (/sitemap.*\.xml$/.test(relative)) {
  const xml = await read(path.join(root, relative));
  for (const loc of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapUrls.add(decode(loc[1]));
    check(resolves(decode(loc[1])), `${relative}: broken sitemap location ${loc[1]}`);
  }
}
for (const route of documents.keys()) if (/^\/(?:en|my)\//.test(route)) check(sitemapUrls.has(`${origin}${route}`), `Sitemap missing ${route}`);
const css = (await Promise.all(files.filter((file) => file.endsWith('.css')).map(read))).join('\n');
check(/@font-face/.test(css) && /Noto Sans Myanmar/i.test(css), 'Missing self-hosted Noto Sans Myanmar font-face');
check(!/fonts\.(?:googleapis|gstatic)\.com|cdn\.tailwindcss\.com/i.test(css), 'External font or Tailwind CDN');
const fontFiles = files.filter((file) => /noto-sans-myanmar.*\.woff2?$/.test(file));
check(fontFiles.length > 0, 'No self-hosted Myanmar font assets');
for (const file of fontFiles) check((await stat(file)).size > 0, `Empty font ${file}`);
if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join('\n'));
  console.error(`${failures.length} acceptance failure(s).`);
  process.exitCode = 1;
} else {
  assert(documents.size > 0);
  console.log(`Verified ${documents.size} static HTML pages, SEO/schema, links, assets and ${draft ? 'draft-visible' : 'production-hidden'} fees.`);
}
