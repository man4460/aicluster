/**
 * ตรวจลิงก์รูป/วิดีโอตัวอย่างโมดูลจุดตรวจ รปภ. — ต้องได้ HTTP 200
 * รัน: npx tsx scripts/check-smart-guard-demo-links.ts
 */
import {
  SMART_GUARD_CHECKPOINT_SAMPLE_IMAGES,
  SMART_GUARD_MODULE_COVER,
  SMART_GUARD_PORTAL_SAMPLE_BANNER,
  SMART_GUARD_SAMPLE_LOGO,
  SMART_GUARD_SAMPLE_YOUTUBE,
  SMART_GUARD_STAFF_SAMPLE_PHOTOS,
} from "../src/systems/smart-guard-tour/lib/portal-media";
import {
  LAUNDRY_PACKAGE_SAMPLE_IMAGES,
  LAUNDRY_PORTAL_SAMPLE_BANNER,
  LAUNDRY_PORTAL_SAMPLE_GALLERY,
  LAUNDRY_PORTAL_SAMPLE_LOGO,
} from "../src/systems/laundry/lib/portal-media";

async function headOk(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "MAWELL-demo-linkcheck/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "MAWELL-demo-linkcheck/1.0", Range: "bytes=0-0" },
        signal: AbortSignal.timeout(20_000),
      });
      return { ok: res.ok || res.status === 206, status: res.status };
    } catch {
      return { ok: false, status: 0 };
    }
  }
}

async function checkGroup(label: string, urls: readonly string[]) {
  console.log(`\n== ${label} (${urls.length}) ==`);
  let bad = 0;
  for (const url of urls) {
    const { ok, status } = await headOk(url);
    const short = url.replace(/^https?:\/\//, "").slice(0, 72);
    if (!ok) {
      bad += 1;
      console.log(`  ✗ ${status} ${short}`);
    } else {
      console.log(`  ✓ ${status} ${short}`);
    }
  }
  return bad;
}

async function main() {
  let bad = 0;
  bad += await checkGroup("smart-guard cover/banner/logo", [
    SMART_GUARD_MODULE_COVER,
    SMART_GUARD_PORTAL_SAMPLE_BANNER,
    SMART_GUARD_SAMPLE_LOGO,
  ]);
  bad += await checkGroup("smart-guard checkpoints", SMART_GUARD_CHECKPOINT_SAMPLE_IMAGES);
  bad += await checkGroup("smart-guard staff photos", SMART_GUARD_STAFF_SAMPLE_PHOTOS);
  bad += await checkGroup("smart-guard youtube", SMART_GUARD_SAMPLE_YOUTUBE);
  bad += await checkGroup("laundry portal", [
    LAUNDRY_PORTAL_SAMPLE_BANNER,
    LAUNDRY_PORTAL_SAMPLE_LOGO,
    ...LAUNDRY_PORTAL_SAMPLE_GALLERY,
    ...LAUNDRY_PACKAGE_SAMPLE_IMAGES,
  ]);
  console.log(bad === 0 ? "\nAll demo links OK" : `\nBroken links: ${bad}`);
  if (bad > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
