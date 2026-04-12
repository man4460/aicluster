/**
 * บัญชีทดลองสาธารณะ — ตั้งค่าใน .env (เซิร์ฟเวอร์เท่านั้น)
 *
 * NEXT_PUBLIC_DEMO_ENTRY=1 — แสดงปุ่มทดลองบนแดชบอร์ดหลัก (ไม่แสดงบนหน้าเข้าสู่ระบบ)
 * DEMO_ACCOUNT_USERNAME — username ในตาราง User (ต้องมี passwordHash)
 * DEMO_ACCOUNT_PASSWORD — รหัสแบบ plain text ที่ตรงกับรหัสจริงของ user นั้น (ระบบใช้ verifyPassword กับ hash ใน DB)
 *   ไม่ใส่ hash จาก DB ลง .env — ใส่รหัสที่พิมพ์ตอนสร้าง user
 * DEMO_ACCOUNT_USERNAMES — (ทางเลือก) รายชื่อยูสเซอร์ที่ถือว่าเป็นบัญชีทดลองคั่นด้วยจุลภาค สำหรับแบนเนอร์ออก
 */

function truthyEnv(v: string | undefined): boolean {
  const s = v?.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

/** แสดงปุ่มทดลองบนแดชบอร์ด (ต้องมี DEMO_ACCOUNT_* บนเซิร์ฟเวอร์ด้วย) */
export function isPublicDemoEntryFlagOn(): boolean {
  return truthyEnv(process.env.NEXT_PUBLIC_DEMO_ENTRY);
}

export function getDemoLoginUsername(): string | null {
  const u = process.env.DEMO_ACCOUNT_USERNAME?.trim();
  return u || null;
}

export function getDemoLoginPassword(): string | null {
  const p = process.env.DEMO_ACCOUNT_PASSWORD ?? "";
  return p.length > 0 ? p : null;
}

export function isDemoAccountConfiguredForEntry(): boolean {
  return Boolean(getDemoLoginUsername() && getDemoLoginPassword());
}

/** ยูสเซอร์ที่ถือว่าเป็นบัญชีทดลอง (แสดงแบนเนอร์ออก) */
export function listDemoSessionUsernames(): string[] {
  const primary = getDemoLoginUsername();
  const extra =
    process.env.DEMO_ACCOUNT_USERNAMES?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const out = new Set<string>();
  if (primary) out.add(primary);
  for (const x of extra) out.add(x);
  return [...out];
}

export function isDemoSessionUsername(username: string): boolean {
  return listDemoSessionUsernames().includes(username);
}
