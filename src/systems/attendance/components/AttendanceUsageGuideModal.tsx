"use client";

import { AppUsageGuideModal } from "@/components/app-templates";
import {
  FACE_DESCRIPTOR_LENGTH,
  FACE_ENROLL_DUPLICATE_DISTANCE,
  FACE_ENROLL_MAX_SAMPLES,
  FACE_MATCH_MAX_DISTANCE,
  FACE_MATCH_MAX_RATIO,
  FACE_MATCH_MIN_MARGIN,
  FACE_MATCH_SINGLE_CANDIDATE_MAX_DISTANCE,
  FACE_MATCH_STRONG_MAX_DISTANCE,
  FACE_MATCH_SUPPORT_DISTANCE,
  FACE_SAMPLE_MAX_SPREAD,
} from "@/lib/attendance/face-descriptor";
import {
  FACE_CAMERA_IDEAL_HEIGHT,
  FACE_CAMERA_IDEAL_WIDTH,
  FACE_CAPTURE_FRAMES,
  FACE_MAX_ROLL_DEG,
  FACE_MAX_SECOND_FACE_RATIO,
  FACE_MAX_YAW_RATIO,
  FACE_MAX_BRIGHTNESS,
  FACE_MIN_BOX_RATIO,
  FACE_MIN_BRIGHTNESS,
  FACE_MIN_CONTRAST,
  FACE_MIN_DETECTION_SCORE,
  FACE_MIN_FRAME_MOTION,
  FACE_MIN_SHARPNESS,
} from "@/systems/attendance/lib/face-api-client";

const listClass = "list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]";
const orderedClass = "list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]";
const strongClass = "font-semibold text-[#2e2a58]";
const numClass = "rounded-md bg-[#f4f2ff] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#4d47b6]";

/** จุดตรวจของด่านคุณภาพภาพ (ต่อหนึ่งเฟรม) */
const FRAME_CHECKS: Array<{ label: string; rule: string }> = [
  { label: "พบใบหน้าในภาพ", rule: "ตัวตรวจจับต้องคืนกรอบใบหน้าอย่างน้อย 1 กรอบ" },
  { label: "คะแนนความมั่นใจของกรอบ", rule: `≥ ${FACE_MIN_DETECTION_SCORE}` },
  { label: "มีคนเดียวในเฟรม", rule: `ใบหน้าอันดับ 2 ต้องเล็กกว่า ${Math.round(FACE_MAX_SECOND_FACE_RATIO * 100)}% ของใบหน้าหลัก` },
  { label: "ขนาดใบหน้าเทียบเฟรม", rule: `≥ ${Math.round(FACE_MIN_BOX_RATIO * 100)}% ของด้านสั้นของภาพ` },
  { label: "เวกเตอร์ใบหน้าครบมิติ", rule: `${FACE_DESCRIPTOR_LENGTH} ค่า` },
  { label: "หน้าเอียง (roll)", rule: `≤ ${FACE_MAX_ROLL_DEG}°` },
  { label: "หันหน้า (yaw)", rule: `ความเยื้องจมูก ≤ ${FACE_MAX_YAW_RATIO} เท่าของระยะระหว่างตา` },
  { label: "ความคมชัด", rule: `variance ของ Laplacian ≥ ${FACE_MIN_SHARPNESS}` },
  { label: "ความสว่างเฉลี่ย", rule: `${FACE_MIN_BRIGHTNESS}–${FACE_MAX_BRIGHTNESS} (สเกล 0–255)` },
  { label: "คอนทราสต์", rule: `ส่วนเบี่ยงเบนมาตรฐาน ≥ ${FACE_MIN_CONTRAST}` },
];

/** จุดตรวจระดับชุดภาพ + การจับคู่ */
const MATCH_CHECKS: Array<{ label: string; rule: string }> = [
  { label: "จำนวนเฟรมที่ใช้ได้", rule: `≥ 2 จาก ${FACE_CAPTURE_FRAMES} เฟรม` },
  { label: "ภาพขยับตามธรรมชาติ", rule: `ความต่างระหว่างเฟรม ≥ ${FACE_MIN_FRAME_MOTION} (กันรูปถ่าย/ภาพค้าง)` },
  { label: "ตัดเฟรมหลุดกลุ่ม", rule: `ระยะจากเฟรมตัวกลาง ≤ ${FACE_SAMPLE_MAX_SPREAD}` },
  { label: "ระยะห่างจากใบหน้าที่ลงทะเบียน", rule: `≤ ${FACE_MATCH_MAX_DISTANCE} (ผ่อนเป็น ${FACE_MATCH_STRONG_MAX_DISTANCE} เมื่อตรงกับ ≥ 2 มุมของคนเดียวกัน · ถ้ามีแค่ 1 คนในรายชื่อ ≤ ${FACE_MATCH_SINGLE_CANDIDATE_MAX_DISTANCE})` },
  { label: "ระยะห่างจากอันดับ 2 (margin)", rule: `≥ ${FACE_MATCH_MIN_MARGIN}` },
  { label: "อัตราส่วนอันดับ 1 : อันดับ 2", rule: `≤ ${FACE_MATCH_MAX_RATIO}` },
  { label: "เสียงโหวตจากหลายเฟรม", rule: "ต้องเกินครึ่งของรอบที่ตรวจ และไม่มีคนอื่นได้คะแนนเท่ากัน" },
  { label: "พิกัดอยู่ในรัศมีจุดเช็ค", rule: "เทียบระยะจริงกับรัศมีที่ตั้งไว้ (ฝั่งเซิร์ฟเวอร์)" },
];

const TOTAL_CHECKS = FRAME_CHECKS.length + MATCH_CHECKS.length;

function CheckTable({ rows, startAt }: { rows: Array<{ label: string; rule: string }>; startAt: number }) {
  return (
    <ol className="space-y-1.5">
      {rows.map((row, i) => (
        <li key={row.label} className="flex gap-2">
          <span className="mt-0.5 shrink-0 rounded-md bg-[#ecebff] px-1.5 text-[11px] font-bold text-[#4d47b6]">
            {startAt + i}
          </span>
          <span className="min-w-0">
            <strong className={strongClass}>{row.label}</strong> — {row.rule}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function AttendanceUsageGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AppUsageGuideModal
      open={open}
      onClose={onClose}
      title="คู่มือการทำงาน — เช็คอินอัจฉริยะ"
      subtitle={`เช็คอิน–เช็คเอาท์ · สแกนใบหน้า · กะงาน · รายงาน · QR จุดเช็คอิน · เครื่องสแกนภายนอก · รายละเอียดเชิงเทคนิค ${TOTAL_CHECKS} จุดตรวจ`}
      sections={[
        {
          title: "คุณสมบัติของระบบ",
          content: (
            <ul className={listClass}>
              <li>เช็คอิน–เช็คเอาท์ด้วยเบอร์โทร สำหรับพนักงานในรายชื่อและผู้มาติดต่อจากภายนอก</li>
              <li>
                <strong className={strongClass}>สแกนใบหน้า</strong> — กดปุ่มเดียว กล้องเปิด ระบบระบุตัวตนและบันทึกเช็คอินให้ทันที
              </li>
              <li>ตรวจพิกัด GPS เทียบรัศมีจุดเช็ค กันเช็คอินจากที่อื่น</li>
              <li>กะงานหลายกะ นับสาย/ออกก่อน และเก็บรูปใบหน้าตอนเช็คอินเป็นหลักฐาน</li>
              <li>รายงานย้อนหลังกรองตามวัน/พนักงาน/สถานะ สำหรับคำนวณเงินเดือน</li>
              <li>QR และลิงก์สาธารณะ แยกระหว่างเช็คอินทั่วไปกับคีออสก์สแกนใบหน้า (ไอแพด/แท็บเล็ต)</li>
              <li>API สำหรับเครื่องสแกนภายนอก เช่น ESP32 ทั้งใบหน้าและลายนิ้วมือ</li>
              <li>ประมวลผลใบหน้าในเครื่องผู้ใช้ ไม่ส่งภาพไปบริการภายนอก</li>
            </ul>
          ),
        },
        {
          title: "ลำดับเริ่มต้นแนะนำ",
          content: (
            <>
              <p>
                ตั้งค่าที่เมนู <strong className={strongClass}>ตั้งค่า</strong> ให้ครบก่อน แล้วจึงเผยแพร่{" "}
                <strong className={strongClass}>QR จุดเช็คอิน</strong> ให้ทีมใช้งาน
              </p>
              <ol className={orderedClass}>
                <li>กำหนดกะ เวลาเข้า–ออก และนโยบายสาย/ขาด</li>
                <li>เพิ่มพนักงานให้ครบทุกคนในรายชื่อ</li>
                <li>เปิดสวิตช์เช็คอินด้วยใบหน้า แล้วลงทะเบียนใบหน้าพนักงานทีละคน (แนะนำ 3 มุมขึ้นไป)</li>
                <li>เลือกลิงก์ที่จะใช้ — เช็คอินทั่วไป หรือคีออสก์สแกนใบหน้า</li>
                <li>ทดสอบเช็คอินจริงหน้างานก่อนเริ่มใช้กับทีม</li>
              </ol>
            </>
          ),
        },
        {
          title: "สแกนใบหน้า — พนักงานต้องกดอะไร",
          content: (
            <>
              <ol className={orderedClass}>
                <li>เปิดลิงก์/สแกน QR ของ «คีออสก์สแกนใบหน้า» ที่หน้าจอจุดเช็ค (วาง iPad ค้างไว้)</li>
                <li>
                  กดปุ่ม <strong className={strongClass}>สแกนใบหน้าเช็คเข้า</strong> (เขียว) ตอนมาเข้างาน หรือ{" "}
                  <strong className={strongClass}>สแกนใบหน้าเช็คออก</strong> (แดง) ตอนเลิกงาน
                </li>
                <li>มองตรงกล้อง กดปุ่มสแกน — ระบบนับถอยหลัง 3–2–1 แล้วถ่ายหลายเฟรมอัตโนมัติ</li>
                <li>ระบบเทียบกับรายชื่อ ตรวจพิกัด แล้วบันทึกเช็คเข้า/เช็คออกพร้อมรูปใบหน้า</li>
              </ol>
              <p>
                กล่องแจ้งผลใต้กล้อง — <strong className={strongClass}>เขียว</strong> เมื่อเช็คเข้า ·{" "}
                <strong className={strongClass}>แดง</strong> เมื่อเช็คออก · สำเร็จขึ้น «ตรงกับ: ชื่อ» ·
                ไม่สำเร็จบอกสาเหตุและ «กรุณาถ่ายใหม่» แล้วเปิดกล้องให้ลองต่อทันที
                ส่วนเช็คอินด้วยเบอร์โทรยังใช้ได้ที่ลิงก์เช็คอินทั่วไป
              </p>
            </>
          ),
        },
        {
          title: "ลงทะเบียนใบหน้าให้แม่นยำ",
          content: (
            <>
              <p>
                ที่เมนู <strong className={strongClass}>รายชื่อพนักงาน</strong> กดปุ่มลงทะเบียนใบหน้าของแต่ละคน
                เก็บได้ถึง {FACE_ENROLL_MAX_SAMPLES} มุม โดยระบบจะบอกมุมถัดไปให้ทำตาม
              </p>
              <ul className={listClass}>
                <li>
                  เก็บอย่างน้อย 3 มุมก่อนใช้สแกนได้ — ครบ {FACE_ENROLL_MAX_SAMPLES} มุมได้แม่นขึ้น ลำดับที่ระบบสั่ง:
                  มองตรง · หันซ้ายเล็กน้อย · หันขวาเล็กน้อย · มองตรงยิ้ม · ก้มหน้าเล็กน้อย · เงยหน้าเล็กน้อย ·
                  หันซ้ายมากขึ้น · หันขวามากขึ้น
                </li>
                <li>เก็บเพิ่มทีละมุมได้ ไม่ทับของเดิม — หรือกดเริ่มชุดใหม่เมื่อพนักงานเปลี่ยนลักษณะ เช่น ใส่แว่นถาวร</li>
                <li>ถ่ายในแสงใกล้เคียงกับจุดเช็คจริง จะจับคู่ได้แม่นกว่าถ่ายในห้องที่แสงต่างกันมาก</li>
                <li>ถ้าใบหน้าใกล้กับพนักงานที่ลงทะเบียนไว้แล้ว ระบบจะเตือนกันถ่ายผิดคน (ยืนยันทับได้กรณีฝาแฝด)</li>
                <li>หน้ารายชื่อแสดงจำนวนมุมที่เก็บไว้ ใช้ตรวจว่าใครยังลงทะเบียนไม่ครบ</li>
              </ul>
            </>
          ),
        },
        {
          title: "ความแม่นยำและความปลอดภัย",
          content: (
            <ul className={listClass}>
              <li>คัดคุณภาพภาพก่อนประมวลผล — ความคมชัด แสง คอนทราสต์ ขนาดใบหน้าในเฟรม และมุมเอียง/หันหน้า</li>
              <li>ถ่ายหลายเฟรมแล้วตัดเฟรมที่หลุดกลุ่มออก ก่อนสรุปเป็นค่าเดียว</li>
              <li>ตัดสินจากการโหวตหลายเฟรม ต้องได้เสียงข้างมากและไม่มีคนอื่นเสมอกัน</li>
              <li>ถ้าใบหน้าใกล้เคียงกันสองคน ระบบปฏิเสธและแจ้งให้ลองใหม่ ดีกว่าเสี่ยงบันทึกผิดคน</li>
              <li>ปฏิเสธเมื่อมีหลายใบหน้าในเฟรม — ให้เหลือคนเดียวหน้ากล้อง</li>
              <li>ตรวจว่าภาพขยับตามธรรมชาติ ลดการใช้รูปถ่ายหรือจอมือถือมาส่อง</li>
              <li>ยิ่งลงทะเบียนหลายมุม ระบบยิ่งยืนยันได้มั่นใจขึ้นและปฏิเสธคนถูกน้อยลง</li>
              <li>เก็บเฉพาะค่าตัวเลขลักษณะใบหน้าไว้เทียบ ไม่ส่งภาพออกไปบริการภายนอก</li>
            </ul>
          ),
        },
        {
          title: "เชิงเทคนิค · ซอฟต์แวร์และโมเดลที่ใช้",
          content: (
            <>
              <p>
                ทำงานด้วยไลบรารี <strong className={strongClass}>@vladmandic/face-api 1.7.15</strong> (ต่อยอดจาก
                face-api.js) บน <strong className={strongClass}>TensorFlow.js</strong> ประมวลผลในเบราว์เซอร์ของเครื่องที่สแกน
                (เร่งด้วย WebGL) โมเดลทั้งหมดโฮสต์ไว้ในระบบเองที่ <span className={numClass}>/models/face-api</span> —
                ไม่เรียก CDN หรือบริการรู้จำใบหน้าภายนอก
              </p>
              <ul className={listClass}>
                <li>
                  <strong className={strongClass}>ตรวจจับใบหน้า</strong> — SSD MobileNet v1 (~5.6 MB) ใช้เป็นตัวหลัก ·
                  สำรองด้วย TinyFaceDetector (~193 KB, input 416 px) เมื่อเครื่องโหลดโมเดลใหญ่ไม่ได้
                </li>
                <li>
                  <strong className={strongClass}>แลนด์มาร์ก 68 จุด</strong> (~357 KB) — ใช้จัดแนว/หมุนใบหน้าให้ตรงก่อนถอดเวกเตอร์
                  และคำนวณมุมเอียง–หันหน้า · สำรองรุ่น tiny (~77 KB)
                </li>
                <li>
                  <strong className={strongClass}>จดจำใบหน้า</strong> — โครงข่าย ResNet-34 (~6.4 MB) สายเดียวกับ dlib
                  face recognition ให้เวกเตอร์ <span className={numClass}>{FACE_DESCRIPTOR_LENGTH} มิติ</span> ต่อใบหน้า
                </li>
                <li>
                  <strong className={strongClass}>การเทียบ</strong> — L2-normalize แล้ววัดระยะยูคลิด · เก็บได้ถึง{" "}
                  {FACE_ENROLL_MAX_SAMPLES} มุมต่อคน · ถือว่า “ยืนยันซ้ำ” เมื่อระยะ ≤ {FACE_MATCH_SUPPORT_DISTANCE} กับมุมอื่นด้วย
                </li>
                <li>
                  <strong className={strongClass}>การถ่ายภาพ</strong> — ขอกล้อง {FACE_CAMERA_IDEAL_WIDTH}×
                  {FACE_CAMERA_IDEAL_HEIGHT} ถ่าย {FACE_CAPTURE_FRAMES} เฟรมต่อการสแกน แล้วเฉลี่ยเฉพาะเฟรมที่ผ่านเกณฑ์
                </li>
                <li>
                  <strong className={strongClass}>ที่เก็บข้อมูล</strong> — บันทึกเฉพาะชุดตัวเลขเวกเตอร์ในฐานข้อมูลของระบบ
                  พร้อมรูปตอนเช็คอินเป็นหลักฐาน · เครื่องภายนอกยิงผ่าน HTTPS ด้วย Bearer key ที่เก็บแบบแฮชและมีจำกัดอัตราเรียก
                </li>
              </ul>
            </>
          ),
        },
        {
          title: `เชิงเทคนิค · จุดตรวจทั้งหมด ${TOTAL_CHECKS} จุด`,
          content: (
            <>
              <p>
                หนึ่งครั้งที่กดสแกน ระบบตรวจ <strong className={strongClass}>{FRAME_CHECKS.length} จุดต่อเฟรม</strong> (คูณ{" "}
                {FACE_CAPTURE_FRAMES} เฟรม) และอีก <strong className={strongClass}>{MATCH_CHECKS.length} จุด</strong>{" "}
                ระดับชุดภาพและการจับคู่ ต้องผ่านทั้งหมดจึงบันทึกเวลาให้
              </p>
              <p className="pt-1 text-xs font-bold uppercase tracking-wider text-[#4d47b6]">ด่านคุณภาพภาพ (ต่อเฟรม)</p>
              <CheckTable rows={FRAME_CHECKS} startAt={1} />
              <p className="pt-2 text-xs font-bold uppercase tracking-wider text-[#4d47b6]">ด่านชุดภาพและการจับคู่</p>
              <CheckTable rows={MATCH_CHECKS} startAt={FRAME_CHECKS.length + 1} />
              <p className="pt-1">
                นอกจากนี้ตอนลงทะเบียนยังตรวจซ้ำอีกชั้น — ถ้าใบหน้าใหม่ห่างจากพนักงานคนอื่นน้อยกว่า{" "}
                <span className={numClass}>{FACE_ENROLL_DUPLICATE_DISTANCE}</span> ระบบจะเตือนว่าอาจถ่ายผิดคน
              </p>
            </>
          ),
        },
        {
          title: "เชิงเทคนิค · ความแม่นยำกี่เปอร์เซ็นต์",
          content: (
            <>
              <ul className={listClass}>
                <li>
                  <strong className={strongClass}>ตัวโมเดล</strong> — โครงข่ายจดจำใบหน้าที่ใช้ รายงานความถูกต้อง{" "}
                  <span className={numClass}>99.38%</span> บนชุดทดสอบมาตรฐาน LFW ที่เกณฑ์ระยะ 0.6 (เป็นตัวเลขของโมเดล
                  ไม่ใช่การรับประกันหน้างาน)
                </li>
                <li>
                  <strong className={strongClass}>ระบบนี้ตั้งเกณฑ์เข้มกว่ามาตรฐาน</strong> — ใช้{" "}
                  <span className={numClass}>{FACE_MATCH_MAX_DISTANCE}</span> แทน 0.6 บวกเงื่อนไข margin{" "}
                  {FACE_MATCH_MIN_MARGIN} · ratio {FACE_MATCH_MAX_RATIO} · และการโหวตหลายเฟรม จึงมีโอกาส{" "}
                  <strong className={strongClass}>รับผิดคน (false accept) ต่ำมาก</strong> แลกกับบางครั้งต้องสแกนซ้ำ
                </li>
                <li>
                  <strong className={strongClass}>ประมาณการหน้างาน</strong> — ลงทะเบียน 3 มุมขึ้นไป แสงสม่ำเสมอ กล้อง 720p:
                  ผ่านในครั้งแรกราว <span className={numClass}>95–99%</span> ต่อการสแกน และเกือบทั้งหมดผ่านภายในครั้งที่สอง ·
                  ถ้าลงทะเบียนมุมเดียวหรือแสงย้อนหลัง จะลดลงมาราว <span className={numClass}>80–90%</span>
                </li>
                <li>
                  <strong className={strongClass}>เมื่อไม่มั่นใจ ระบบเลือกปฏิเสธ</strong> — กรณีคลุมเครือจะไม่บันทึกแล้วให้ลองใหม่
                  เพราะบันทึกผิดคนแก้ยากกว่าการสแกนซ้ำ
                </li>
                <li>
                  <strong className={strongClass}>ข้อจำกัดที่ยังแม่นน้อย</strong> — ฝาแฝดเหมือน · หน้าถูกปิดบางส่วน (แมสก์/ผมปิดตา)
                  · แว่นสะท้อนแสงจัด · ยืนย้อนแสงหน้าต่าง · กล้องความละเอียดต่ำมากหรือเลนส์เปื้อน
                </li>
                <li>
                  <strong className={strongClass}>ลายนิ้วมือผ่าน ESP32</strong> — ความแม่นยำเป็นของเซ็นเซอร์ที่ใช้
                  (เซ็นเซอร์ทั่วไปสเปกราว FAR &lt; 0.001% · FRR &lt; 1%) ระบบเราทำหน้าที่ผูก slot กับพนักงานและบันทึกเวลา
                </li>
              </ul>
              <p>
                <strong className={strongClass}>วิธีวัดจริงที่ร้านคุณ:</strong> ให้พนักงาน 10 คนสแกนคนละ 10 ครั้งในจุดติดตั้งจริง
                (100 ครั้ง) แล้วนับสองตัวเลข — ผ่านในครั้งแรกกี่ครั้ง (ยิ่งสูงยิ่งดี) และระบบทักชื่อผิดคนกี่ครั้ง (ควรเป็น 0)
                ถ้าผ่านครั้งแรกต่ำกว่า 90% ให้เพิ่มมุมใบหน้าและปรับแสงที่จุดเช็คก่อนปรับอย่างอื่น
              </p>
            </>
          ),
        },
        {
          title: "ลิงก์และ QR — เลือกให้ตรงงาน",
          content: (
            <ul className={listClass}>
              <li>
                <strong className={strongClass}>เช็คอินทั่วไป</strong> — พนักงานกรอกเบอร์โทร หรือผู้มาติดต่อจากภายนอกลงชื่อ
                เหมาะกับให้แต่ละคนสแกน QR จากมือถือตัวเอง
              </li>
              <li>
                <strong className={strongClass}>คีออสก์สแกนใบหน้า</strong> — เปิดค้างบนไอแพด/แท็บเล็ตที่จุดเช็ค
                แยกปุ่มเช็คเข้า (เขียว) และเช็คออก (แดง) หน้าจอจัดกลางเต็มจอ
              </li>
              <li>ทั้งสองแบบมีลิงก์คัดลอกที่หน้าแดชบอร์ด และมีโปสเตอร์ QR แยกกันในเมนู <strong className={strongClass}>จัดการเช็คอิน → QR จุดเช็คอิน</strong></li>
              <li>วางไว้จุดที่แสงพอและมีสัญญาณอินเทอร์เน็ต แล้วทดสอบจากเครื่องจริงก่อนใช้งาน</li>
            </ul>
          ),
        },
        {
          title: "เมนู: แดชบอร์ด",
          content: (
            <ul className={listClass}>
              <li>การ์ดสรุปวันนี้ — เข้างานแล้ว มาสาย ยังเหลือ กำลังทำงาน ออกงานแล้ว</li>
              <li>
                รายชื่อ <strong className={strongClass}>เช็คเข้าวันนี้</strong> และ{" "}
                <strong className={strongClass}>เช็คออกวันนี้</strong> แยก 2 คอลัมน์ — มีรูปคลิกดูใหญ่
                ป้ายประเภทเช็ค (สแกนใบหน้า · เช็คแบบเดิม · แอป ฯลฯ) และป้ายมาสาย/ออกก่อน
              </li>
              <li>อัปเดตทันทีเมื่อมีคนเช็คเข้า/ออก — ไม่ต้องรีเฟรชหน้า</li>
              <li>คัดลอกลิงก์เช็คอินทั่วไปและลิงก์คีออสก์ใบหน้าได้จากการ์ดลิงก์</li>
              <li>เหมาะให้หัวหน้างานตรวจความพร้อมทีมก่อนเริ่มกะ</li>
            </ul>
          ),
        },
        {
          title: "เมนู: ตั้งค่า",
          content: (
            <ul className={listClass}>
              <li>แท็บหลักด้านล่าง (มือถือ) หรือแท็บที่ 4 บนเดสก์ท็อป — กะเวลางาน สาขา · จุดเช็ค รัศมี GPS สวิตช์สแกนใบหน้า และ Device API</li>
              <li>เพิ่มจุดเช็คตามแพ็กรายเดือน (199 = 5 จุด · 299 = 20 · 399 = 40 · 499+ = ไม่จำกัด)</li>
            </ul>
          ),
        },
        {
          title: "เมนู: จัดการเช็คอิน",
          content: (
            <ul className={listClass}>
              <li>รายชื่อพนักงาน — เพิ่ม/แก้ไขพนักงาน ลงทะเบียนใบหน้า และผูก slot ลายนิ้วมือ · ระบบจับคู่ใบหน้าเฉพาะในรายชื่อขององค์กรนี้เท่านั้น</li>
              <li>QR จุดเช็คอิน — โปสเตอร์ QR และลิงก์สาธารณะแยกต่อจุด (เช็คอินทั่วไปและคีออสก์สแกนใบหน้า)</li>
            </ul>
          ),
        },
        {
          title: "เมนู: รายงาน",
          content: (
            <ul className={listClass}>
              <li>ดูประวัติเข้างานย้อนหลังตามช่วงวันที่ พร้อมกรองพนักงานและสถานะ</li>
              <li>ใช้ส่งต่อคำนวณเงินเดือน และตรวจเหตุผิดปกติ เช่น ลืมเช็คเอาท์</li>
              <li>กดดูรูปใบหน้าตอนเช็คอินเพื่อยืนยันตัวบุคคลย้อนหลังได้</li>
            </ul>
          ),
        },
        {
          title: "เชื่อมเครื่องสแกนภายนอก (ESP32)",
          content: (
            <>
              <p>
                ที่หน้า <strong className={strongClass}>ตั้งค่า</strong> เปิดใช้ API อุปกรณ์ สร้างคีย์ แล้วกดปุ่ม
                «วิธีใช้ / คัดลอกโค้ด» เพื่อคัดลอกตัวอย่างไปใช้กับบอร์ดได้เลย
              </p>
              <ul className={listClass}>
                <li>ลายนิ้วมือ — ผูก slot ของเซ็นเซอร์กับพนักงาน แล้วอุปกรณ์ส่งเลข slot มาเช็คอิน</li>
                <li>ใบหน้า — อุปกรณ์คำนวณค่าลักษณะใบหน้าเอง ส่งได้หลายเฟรมเพื่อให้ระบบโหวตให้แม่นขึ้น</li>
                <li>คีย์เก็บแบบเข้ารหัส เห็นเต็มครั้งเดียวตอนสร้าง — สร้างใหม่ได้ถ้าคีย์รั่ว</li>
                <li>ไม่ส่งพิกัดได้ ระบบจะใช้พิกัดจุดเช็คที่ตั้งไว้ เหมาะกับเครื่องติดตั้งอยู่กับที่</li>
              </ul>
            </>
          ),
        },
        {
          title: "ข้อความที่พบบ่อย — แก้อย่างไร",
          content: (
            <ul className={listClass}>
              <li>«ไม่พบใบหน้าชัดเจน» หรือ «ใบหน้าเล็กเกินไป» — เข้าใกล้กล้องให้ใบหน้าเต็มกรอบมากขึ้น</li>
              <li>«ภาพเบลอ» — อยู่นิ่งสักครู่ก่อนกด หรือเช็ดเลนส์กล้อง</li>
              <li>«แสงน้อย/แสงจ้าเกินไป» — เลี่ยงยืนหันหลังให้หน้าต่างหรือไฟจ้า</li>
              <li>«หันหน้า/หน้าเอียงมากเกินไป» — ตั้งหัวตรงและมองตรงเข้ากล้อง</li>
              <li>«มีหลายใบหน้าในเฟรม» — ให้เหลือคนเดียวหน้ากล้องขณะสแกน</li>
              <li>«ใบหน้าคล้ายหลายคน» — ลองใหม่ในแสงดีขึ้น และเพิ่มมุมใบหน้าให้พนักงานคนนั้น</li>
              <li>«ไม่ตรงกับใบหน้าในรายชื่อ» — ตรวจว่าลงทะเบียนใบหน้าแล้ว หรือใช้เช็คอินด้วยเบอร์ไปก่อน · กดสแกนใหม่</li>
              <li>กล้องตัดพื้นหลังออก (พื้นหลังดำ) — มักมาจาก Windows Studio Effects ไม่ใช่แอป · ดูคู่มือย่อที่ปุ่ม «?» บนหน้าคีออสก์</li>
              <li>«อยู่นอกรัศมีจุดเช็ค» — ตรวจว่าอยู่ในพื้นที่จริง และอนุญาตให้เบราว์เซอร์เข้าถึงตำแหน่ง</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
