/** HTML ใบประกาศนียบัตรจบหลักสูตร — A4 แนวนอน · ลวดลาย CSS (html2canvas-safe) · ไม่มีกล่องข้อความ */

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

const C = {
  ink: "#1e1b4b",
  navy: "#0b2a5b",
  navyMid: "#143868",
  navyLight: "#1a4578",
  navySoft: "#24508a",
  muted: "#66638c",
} as const;

/**
 * ลำดับขนาด: ชื่อผู้เรียน > หัวข้อ > ชื่อคอร์ส > บรรทัดผ่านอบรม > บทนำ/วันที่/ผู้ลงนาม
 * ลวดลาย: ถ้วยเทา (CSS) + ริบบิ้นกรมท่ามุมล่าง (CSS ล้วน — html2canvas จับได้จริง)
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

  /* —— ถ้วยลายน้ำ (CSS shapes — ไม่พึ่ง SVG ที่ html2canvas มักหาย) —— */
  .trophy {
    position: absolute;
    top: 44%;
    width: 168px;
    height: 200px;
    z-index: 0;
    pointer-events: none;
    opacity: 0.13;
    transform: translateY(-50%);
  }
  .trophy--left { left: 48px; }
  .trophy--right { right: 48px; transform: translateY(-50%) scaleX(-1); }

  .trophy-cup {
    position: absolute;
    left: 34px;
    top: 28px;
    width: 100px;
    height: 78px;
    background: #b8bec8;
    border-radius: 8px 8px 42px 42px;
  }
  .trophy-rim {
    position: absolute;
    left: 28px;
    top: 22px;
    width: 112px;
    height: 16px;
    background: #c5cad3;
    border-radius: 6px;
  }
  .trophy-handle {
    position: absolute;
    top: 36px;
    width: 28px;
    height: 48px;
    border: 10px solid #b0b6c0;
    border-radius: 50%;
    background: transparent;
  }
  .trophy-handle--l { left: 6px; border-right: 0; border-radius: 50% 0 0 50%; }
  .trophy-handle--r { right: 6px; border-left: 0; border-radius: 0 50% 50% 0; }
  .trophy-stem {
    position: absolute;
    left: 72px;
    top: 104px;
    width: 24px;
    height: 36px;
    background: #b8bec8;
  }
  .trophy-base {
    position: absolute;
    left: 48px;
    top: 138px;
    width: 72px;
    height: 14px;
    background: #c5cad3;
    border-radius: 4px;
  }
  .trophy-plinth {
    position: absolute;
    left: 40px;
    top: 150px;
    width: 88px;
    height: 18px;
    background: #aeb4be;
    border-radius: 4px;
  }

  /* —— ริบบิ้นมุมล่างแบบตัวอย่าง (กรมท่าซ้อนหลายชั้น CSS) —— */
  .ribbon {
    position: absolute;
    bottom: 0;
    width: 420px;
    height: 280px;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
  }
  .ribbon--left { left: 0; }
  .ribbon--right { right: 0; transform: scaleX(-1); }

  .ribbon-layer {
    position: absolute;
    left: -80px;
    bottom: -60px;
  }
  .ribbon-l1 {
    width: 460px;
    height: 320px;
    background: ${C.navy};
    border-radius: 0 85% 0 0;
  }
  .ribbon-l2 {
    width: 380px;
    height: 250px;
    left: -50px;
    bottom: -40px;
    background: ${C.navyMid};
    border-radius: 0 90% 0 0;
  }
  .ribbon-l3 {
    width: 300px;
    height: 190px;
    left: -20px;
    bottom: -20px;
    background: ${C.navyLight};
    border-radius: 0 95% 0 0;
  }
  .ribbon-l4 {
    width: 220px;
    height: 130px;
    left: 10px;
    bottom: 0;
    background: ${C.navySoft};
    border-radius: 0 100% 0 0;
    opacity: 0.95;
  }
  .ribbon-l5 {
    width: 150px;
    height: 70px;
    left: 30px;
    bottom: 0;
    background: ${C.navy};
    border-radius: 0 110% 0 0;
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
    right: 44px;
    bottom: 44px;
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
    text-shadow: 0 1px 2px rgba(11, 42, 91, 0.55);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
</head>
<body>
  <div id="lms-cert-root">
    <div class="trophy trophy--left" aria-hidden="true">
      <div class="trophy-rim"></div>
      <div class="trophy-cup"></div>
      <div class="trophy-handle trophy-handle--l"></div>
      <div class="trophy-handle trophy-handle--r"></div>
      <div class="trophy-stem"></div>
      <div class="trophy-base"></div>
      <div class="trophy-plinth"></div>
    </div>
    <div class="trophy trophy--right" aria-hidden="true">
      <div class="trophy-rim"></div>
      <div class="trophy-cup"></div>
      <div class="trophy-handle trophy-handle--l"></div>
      <div class="trophy-handle trophy-handle--r"></div>
      <div class="trophy-stem"></div>
      <div class="trophy-base"></div>
      <div class="trophy-plinth"></div>
    </div>

    <div class="ribbon ribbon--left" aria-hidden="true">
      <div class="ribbon-layer ribbon-l1"></div>
      <div class="ribbon-layer ribbon-l2"></div>
      <div class="ribbon-layer ribbon-l3"></div>
      <div class="ribbon-layer ribbon-l4"></div>
      <div class="ribbon-layer ribbon-l5"></div>
    </div>
    <div class="ribbon ribbon--right" aria-hidden="true">
      <div class="ribbon-layer ribbon-l1"></div>
      <div class="ribbon-layer ribbon-l2"></div>
      <div class="ribbon-layer ribbon-l3"></div>
      <div class="ribbon-layer ribbon-l4"></div>
      <div class="ribbon-layer ribbon-l5"></div>
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
