/**
 * ทดสอบ HTTP ของรูป Unsplash ที่ใช้ใน drink-pos (seed + suggest)
 * รัน: node scripts/verify-drink-images.mjs
 */
import { readFileSync } from "fs";
import {
  DRINK_POS_CATEGORY_IMAGES,
  DRINK_POS_PRODUCT_IMAGES,
  DRINK_POS_DEFAULT_IMAGE,
} from "../src/lib/drink-pos/drink-stock-images.ts";

const ctl = (ms) => {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
};

async function check(url) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctl(8000) });
    return { url, ok: r.ok, status: r.status };
  } catch {
    return { url, ok: false, status: "ERR" };
  }
}

function photoId(url) {
  const m = url.match(/photo-([^?]+)/);
  return m ? m[1].slice(0, 40) : url;
}

async function runGroup(label, urls) {
  const unique = [...new Set(urls)];
  const results = await Promise.all(unique.map(check));
  const bad = results.filter((x) => !x.ok);
  for (const x of results) {
    console.log(x.ok ? "OK" : "FAIL", x.status, photoId(x.url));
  }
  console.log(`--- ${label}: ${bad.length ? `${bad.length}/${unique.length} failed` : `all ${unique.length} OK`}\n`);
  return bad;
}

const stockUrls = [
  ...DRINK_POS_CATEGORY_IMAGES,
  ...DRINK_POS_PRODUCT_IMAGES,
  DRINK_POS_DEFAULT_IMAGE,
];

const suggestSrc = readFileSync(
  new URL("../src/systems/drink-pos/lib/suggest-stock-image.ts", import.meta.url),
  "utf8",
);
const suggestUrls = [
  ...new Set(suggestSrc.match(/https:\/\/images\.unsplash\.com\/[^"]+/g) ?? []),
];

let allBad = [];
allBad = allBad.concat(await runGroup("drink-stock-images", stockUrls));
allBad = allBad.concat(await runGroup("suggest-stock-image", suggestUrls));

process.exit(allBad.length ? 1 : 0);
