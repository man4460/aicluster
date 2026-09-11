/** HTML ใบประกาศนียบัตรจบหลักสูตร — A4 แนวนอน · ลวดลายตามตัวอย่าง · โทน LMS · ไม่มีกล่องข้อความ */

export type LmsCertificateHtmlInput = {
  instituteName: string;
  learnerName: string;
  courseTitle: string;
  /** เช่น «ให้ไว้ ณ วันที่ 30 ธันวาคม พ.ศ. 2569» */
  issueDateLabel: string;
  certCode: string;
  signerName?: string;
  /** ตำแหน่งผู้ลงนาม เช่น ประธานการจัดงาน */
  signerTitle?: string;
  note?: string;
  /** โลโก้สถาบัน (data URL หรือ absolute URL) */
  logoUrl?: string;
  /** รูปลายเซ็น (data URL หรือ absolute URL) */
  signatureUrl?: string;
  /** QR data URL สำหรับตรวจสอบใบประกาศ */
  qrDataUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** ขนาดพิกเซลอ้างอิง A4 landscape ที่ 96dpi ประมาณ 1123×794 */
export const LMS_CERT_PX = { width: 1123, height: 794 } as const;

/** โทนข้อความโมดูล LMS */
const C = {
  ink: "#1e1b4b",
  violet: "#4d47b6",
  navy: "#0b2a5b",
  navyMid: "#163a72",
  navyLight: "#1e4a8c",
  muted: "#66638c",
  soft: "#5f5a8a",
} as const;

/** ถ้วยลายน้ำเทาอ่อน — แบบตัวอย่าง (html2canvas จับ <img>) */
const TROPHY_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 190" fill="none">
      <path fill="#c5cad3" d="M48 22h64v10H48zm10 10h44c3 24 10 38 22 46-8 5-13 13-13 24v8H49v-8c0-11-5-19-13-24 12-8 19-22 22-46zm-4 86h52v10H54zm8 10h36l5 28H57z"/>
      <path fill="#b0b6c0" d="M38 32c-14 3-24 16-24 32 0 13 8 24 18 27 3-10 8-18 13-24V32zm84 0v35c5 6 10 14 13 24 10-3 18-14 18-27 0-16-10-29-24-32z"/>
      <path fill="#d1d5db" d="M70 22h20v8H70zM62 148h36v8H62z"/>
    </svg>`,
  );

/**
 * ริบบิ้นมุมล่างตามตัวอย่าง — คลื่นกรมท่าซ้อนหลายชั้น
 * ใช้ <img> data-URI (html2canvas ไม่เรนเดอร์ SVG inline ดี)
 */
const WAVE_RIBBON_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 280" fill="none" preserveAspectRatio="none">
      <path fill="#0b2a5b" d="M0 280V95c38 8 68 36 102 72 28 30 62 64 118 78 28 7 58 12 90 14 36 2 72 1 110-4V280H0z"/>
      <path fill="#163a72" d="M0 280V128c32 6 58 28 88 56 26 24 56 52 100 64 24 6 50 10 78 12 30 2 60 1 92-3V280H0z"/>
      <path fill="#1e4a8c" d="M0 280V158c26 4 48 20 74 42 22 18 48 40 86 50 20 5 42 8 66 9 26 1 52 0 80-3V280H0z"/>
      <path fill="#0b2a5b" d="M0 280V188c20 3 36 14 56 30 18 14 40 30 70 38 16 4 34 6 52 7 22 1 44 0 68-2V280H0z"/>
      <path fill="#254f96" opacity=".9" d="M0 280V210c16 2 28 10 44 22 14 10 32 22 56 28 12 3 26 5 40 5 18 1 36 0 54-1V280H0z"/>
    </svg>`,
  );

/**
 * ลำดับขนาด: ชื่อผู้เรียน > หัวข้อ > ชื่อคอร์ส > บรรทัดผ่านอบรม > บทนำ/วันที่/ผู้ลงนาม
 * ลวดลาย: ถ้วยเทาซ้าย–ขวา + ริบบิ้นกรมท่ามุมล่างตามตัวอย่าง
 * ไม่มีกล่องข้อความ · QR ล้วน
 */
export function buildLmsCertificateDocumentHtml(input: LmsCertificateHtmlInput): string {
  const institute = escapeHtml(input.instituteName || "สถาบัน");
  const learner = escapeHtml(input.learnerName);
  const course = escapeHtml(input.courseTitle);
  const dateLabel = escapeHtml(input.issueDateLabel);
  const code = escapeHtml(input.certCode);
  const signer = input.signerName ? escapeHtml(input.signerName) : escapeHtml(institute);
  const signerTitle = escapeHtml(input.signerTitle || "ผู้ออกใบประกาศ");
  const note = input.note ? escapeHtml(input.note.slice(0, 160)) : "";
  const logoUrl = input.logoUrl ? escapeHtml(input.logoUrl) : "";
  const signatureUrl = input.signatureUrl ? escapeHtml(input.signatureUrl) : "";
  const qrDataUrl = input.qrDataUrl ? escapeHtml(input.qrDataUrl) : "";

  const logoBlock = logoUrl
    ? `<img class="logo-img" src="${logoUrl}" alt="" crossorigin="anonymous" />`
    : `<span class="logo-fallback">โลโก้</span>`;

  const signVisual = signatureUrl
    ? `<img class="sign-img" src="${signatureUrl}" alt="" crossorigin="anonymous" />`
    : `<div class="sign-scribble" aria-hidden="true"></div>`;

  const qrBlock = qrDataUrl
    ? `<div class="qr-plain">
        <img class="qr-img" src="${qrDataUrl}" alt="QR ตรวจสอบใบประกาศ" />
        <p class="qr-hint">สแกนตรวจสอบ</p>
      </div>`
    : `<div class="qr-plain"><p class="qr-hint">${code}</p></div>`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ใบประกาศนียบัตร ${code}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }

  #lms-cert-root {
    width: ${LMS_CERT_PX.width}px;
    height: ${LMS_CERT_PX.height}px;
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: "Sarabun", "TH Sarabun New", "Tahoma", "Segoe UI", sans-serif;
    color: ${C.ink};
    position: relative;
    overflow: hidden;
  }

  /* ถ้วยลายน้ำซ้าย–ขวา แบบตัวอย่าง */
  .trophy {
    position: absolute;
    top: 48%;
    width: 240px;
    height: 280px;
    opacity: 0.14;
    z-index: 0;
    pointer-events: none;
  }
  .trophy--left { left: 8px; transform: translateY(-52%); }
  .trophy--right { right: 8px; transform: translateY(-52%) scaleX(-1); }

  /* ริบบิ้นคลื่นมุมล่าง — กรมท่าซ้อนตามตัวอย่าง */
  .ribbon {
    position: absolute;
    bottom: 0;
    width: 400px;
    height: 260px;
    z-index: 1;
    pointer-events: none;
  }
  .ribbon--left { left: 0; }
  .ribbon--right { right: 0; transform: scaleX(-1); }
  .ribbon img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: fill;
  }

  .content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 44px 150px 36px;
  }

  .logo {
    width: 72px;
    height: 72px;
    border-radius: 9999px;
    background: ${C.navy};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 14px;
    flex-shrink: 0;
  }
  .logo-img { width: 100%; height: 100%; object-fit: cover; }
  .logo-fallback {
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .title {
    margin: 0 0 12px;
    font-size: 38px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: ${C.ink};
    line-height: 1.3;
  }

  .lead {
    margin: 0 0 20px;
    font-size: 15px;
    font-weight: 400;
    color: #1a1a1a;
  }

  .recipient {
    margin: 0 0 20px;
    padding: 0 8px;
    font-size: 48px;
    font-weight: 800;
    color: ${C.ink};
    line-height: 1.45;
    letter-spacing: 0.01em;
    max-width: 860px;
  }

  .body {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.5;
    max-width: 760px;
  }

  .course {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.4;
    color: ${C.ink};
    max-width: 820px;
  }

  .date {
    margin: 18px 0 0;
    font-size: 15px;
    font-weight: 400;
    color: #1a1a1a;
  }

  .sign-block {
    margin-top: auto;
    padding-top: 24px;
    padding-bottom: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 220px;
  }
  .sign-img {
    height: 52px;
    max-width: 200px;
    object-fit: contain;
    margin-bottom: 4px;
  }
  .sign-scribble {
    width: 170px;
    height: 40px;
    margin-bottom: 4px;
    background:
      radial-gradient(circle at 12% 60%, transparent 40%, #111 41%, #111 48%, transparent 50%),
      radial-gradient(circle at 38% 40%, transparent 42%, #111 43%, #111 50%, transparent 52%),
      radial-gradient(circle at 62% 55%, transparent 40%, #111 41%, #111 48%, transparent 50%),
      radial-gradient(circle at 88% 35%, transparent 42%, #111 43%, #111 50%, transparent 52%);
    background-size: 40px 36px, 48px 36px, 44px 36px, 40px 36px;
    background-repeat: no-repeat;
    background-position: 0 2px, 40px 0, 85px 2px, 130px 0;
    opacity: 0.9;
  }
  .sign-name {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: ${C.ink};
  }
  .sign-role {
    margin: 2px 0 0;
    font-size: 13px;
    font-weight: 400;
    color: #333;
  }
  .note {
    margin-top: 8px;
    font-size: 11px;
    color: ${C.muted};
    max-width: 480px;
  }

  .qr-plain {
    position: absolute;
    right: 40px;
    bottom: 40px;
    z-index: 4;
    text-align: center;
  }
  .qr-img {
    width: 88px;
    height: 88px;
    display: block;
    margin: 0 auto;
    background: #fff;
    border-radius: 6px;
  }
  .qr-hint {
    margin: 5px 0 0;
    font-size: 10px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(11, 42, 91, 0.5);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
</head>
<body>
  <div id="lms-cert-root">
    <img class="trophy trophy--left" src="${TROPHY_IMG}" alt="" />
    <img class="trophy trophy--right" src="${TROPHY_IMG}" alt="" />

    <div class="ribbon ribbon--left" aria-hidden="true">
      <img src="${WAVE_RIBBON_IMG}" alt="" />
    </div>
    <div class="ribbon ribbon--right" aria-hidden="true">
      <img src="${WAVE_RIBBON_IMG}" alt="" />
    </div>

    <div class="content">
      <div class="logo">${logoBlock}</div>
      <h1 class="title">ประกาศนียบัตร</h1>
      <p class="lead">ใบประกาศนียบัตรให้ไว้เพื่อแสดงว่า</p>
      <p class="recipient">${learner}</p>
      <p class="body">ได้ผ่านการฝึกอบรมออนไลน์ ในหัวข้อ</p>
      <p class="course">“ ${course} ”</p>
      <p class="date">${dateLabel}</p>

      <div class="sign-block">
        ${signVisual}
        <p class="sign-name">${signer}</p>
        <p class="sign-role">${signerTitle}</p>
        ${note ? `<p class="note">${note}</p>` : ""}
      </div>
    </div>

    ${qrBlock}
  </div>
</body>
</html>`;
}
