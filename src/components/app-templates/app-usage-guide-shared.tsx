import type { ReactNode } from "react";

export type AppUsageGuideSection = {
  title: string;
  content: ReactNode;
};

const ol = "list-decimal space-y-2 pl-5 marker:font-semibold marker:text-[#4d47b6]";
const ul = "list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]";
const strong = "font-semibold text-[#2e2a58]";

/**
 * คู่มือติดตั้งไอคอน MAWELL บนหน้าจอโฮม — แนบท้ายคู่มือทุกโมดูลผ่าน AppUsageGuideModal
 * (รายละเอียดเทียบ PwaInstallGuideModals · ใช้ Safari / Chrome)
 */
export function appUsageGuideHomeScreenInstallContent(): ReactNode {
  return (
    <div className="space-y-4">
      <p>
        ติดตั้งเป็นแอปบนหน้าจอโฮมแล้วเปิดได้เร็วขึ้น แบบเต็มจอ (ไม่มีแถบ URL) เหมาะกับหน้าร้าน · มือถือพนักงาน ·
        และลูกค้าที่เข้าเว็บโมดูลบ่อย — ใช้เว็บ MAWELL เดิม ไม่ต้องโหลดจาก App Store / Play Store
      </p>

      <div className="space-y-2">
        <p className={strong}>iPhone / iPad (Safari เท่านั้น)</p>
        <ol className={ol}>
          <li>
            เปิดเว็บ MAWELL หรือลิงก์โมดูลใน <strong className={strong}>Safari</strong> (ไม่ใช้ Chrome บน iOS
            สำหรับขั้นตอนนี้ — เมนู «เพิ่มที่หน้าจอโฮม» อยู่ใน Safari)
          </li>
          <li>
            กดปุ่ม <strong className={strong}>แชร์</strong> (สี่เหลี่ยมมีลูกศรขึ้น)
            — บน iPhone มักอยู่แถบล่าง · บน iPad มักอยู่มุมขวาบน
          </li>
          <li>
            เลื่อนรายการแล้วเลือก <strong className={strong}>เพิ่มที่หน้าจอโฮม</strong> /{" "}
            <strong className={strong}>Add to Home Screen</strong>
          </li>
          <li>
            ตรวจชื่อไอคอน (แก้ได้) แล้วกด <strong className={strong}>เพิ่ม</strong> /{" "}
            <strong className={strong}>Add</strong>
          </li>
          <li>
            กลับหน้าจอโฮม → แตะไอคอน <strong className={strong}>MAWELL</strong> เพื่อเปิดแบบแอป
            (แถบ Safari หาย · ใช้ safe-area ของเครื่องอัตโนมัติ)
          </li>
        </ol>
        <p className="text-[13px] text-[#66638c]">
          ถ้าไม่เจอเมนู — ลองเลื่อนรายการแชร์ลง หรือกด «แก้ไขการดำเนินการ…» เพื่อเปิด «เพิ่มที่หน้าจอโฮม»
        </p>
      </div>

      <div className="space-y-2">
        <p className={strong}>Android (Chrome หรือ Edge แนะนำ)</p>
        <ol className={ol}>
          <li>
            เปิดเว็บ MAWELL ใน <strong className={strong}>Chrome</strong> (หรือ Edge)
          </li>
          <li>
            กดเมนู <strong className={strong}>⋮</strong> มุมขวาบน
          </li>
          <li>
            เลือก <strong className={strong}>ติดตั้งแอป</strong> / <strong className={strong}>Install app</strong>{" "}
            หรือ <strong className={strong}>เพิ่มไปยังหน้าจอหลัก</strong> /{" "}
            <strong className={strong}>Add to Home screen</strong>
            (ข้อความขึ้นกับเวอร์ชันเบราว์เซอร์)
          </li>
          <li>
            ยืนยัน <strong className={strong}>ติดตั้ง</strong> / <strong className={strong}>Install</strong>
          </li>
          <li>
            เปิดจากไอคอนบนหน้าจอโฮมหรือลิ้นชักแอป — ทำงานใกล้เคียงแอปเต็มจอ
          </li>
        </ol>
        <p className="text-[13px] text-[#66638c]">
          บางเครื่องขึ้นแบนเนอร์ «ติดตั้งแอป» ด้านล่างอัตโนมัติ — กดติดตั้งได้เลยโดยไม่ต้องเปิดเมนู ⋮
        </p>
      </div>

      <ul className={ul}>
        <li>
          ล็อกอินครั้งแรกหลังติดตั้งอาจต้องใส่รหัสอีกครั้ง — จากนั้นเซสชันจะจำในแอปหน้าจอโฮม
        </li>
        <li>
          ถ้าต้องการลบ: กดค้างไอคอนบนหน้าจอโฮม → ลบ/ถอนการติดตั้ง (ข้อมูลในระบบยังอยู่ที่บัญชีเว็บ)
        </li>
        <li>
          พนักงานหน้าร้านแนะนำติดทั้งแดชบอร์ดและลิงก์ QR พนักงาน (ถ้ามี) เป็นไอคอนแยกเพื่อสลับงานเร็ว
        </li>
      </ul>
    </div>
  );
}

export const APP_USAGE_GUIDE_HOME_SCREEN_SECTION: AppUsageGuideSection = {
  title: "สร้างแอปบนหน้าจอโฮม (iOS และ Android)",
  content: appUsageGuideHomeScreenInstallContent(),
};

/** การนำทางโมดูลร่วม — dock · ยุบหัว · โทเคน */
export const APP_USAGE_GUIDE_MOBILE_CHROME_SECTION: AppUsageGuideSection = {
  title: "มือถือ · ไอแพดแนวตั้ง · แถบหัว",
  content: (
    <ul className={ul}>
      <li>
        บนมือถือ / ไอแพดแนวตั้ง เมนูหลักของโมดูลอยู่ที่ <strong className={strong}>แถบล่าง (dock)</strong> —
        ไอคอนที่เลือกจะเปลี่ยนสี ไม่มีกล่องซ้อน
      </li>
      <li>
        ปุ่ม <strong className={strong}>ซ่อนส่วนหัว</strong> ยุบการ์ดชื่อโมดูลเพื่อได้พื้นที่ทำงาน —
        บนเดสก์ท็อปเมนูจะไปอยู่แถบม่วงด้านบน · กดปุ่มขยายเพื่อคืนหัวโมดูล
      </li>
      <li>
        แถบม่วงด้านบนแสดง <strong className={strong}>ยอดโทเคน</strong> (มือถือชิดขวา) · เมนูบัญชีที่รูปโปรไฟล์ ·
        โหมดทดลองจะมีป้ายบอกว่าไม่ใช่บัญชีจริง
      </li>
      <li>
        เวลาในระบบธุรกิจไทยอิง <strong className={strong}>Asia/Bangkok</strong> — วันเปิดร้าน · คิว ·
        «วันนี้» ในรายงานใช้เวลานี้
      </li>
    </ul>
  ),
};

/** รวมส่วนท้ายมาตรฐานทุกคู่มือ */
export function withAppUsageGuideStandardSections(
  sections: AppUsageGuideSection[],
  options?: { includeChrome?: boolean; includeHomeScreen?: boolean },
): AppUsageGuideSection[] {
  const includeChrome = options?.includeChrome !== false;
  const includeHomeScreen = options?.includeHomeScreen !== false;
  const extra: AppUsageGuideSection[] = [];
  if (includeChrome) extra.push(APP_USAGE_GUIDE_MOBILE_CHROME_SECTION);
  if (includeHomeScreen) extra.push(APP_USAGE_GUIDE_HOME_SCREEN_SECTION);
  const seen = new Set(sections.map((s) => s.title));
  return [...sections, ...extra.filter((s) => !seen.has(s.title))];
}
