/** HTML ใบประกาศนียบัตรจบหลักสูตร — A4 แนวนอน · โทน LMS · ไม่มีเส้น/กล่องข้อความ */

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

/** โทนโมดูล LMS (คู่กับ ui-tokens / brand gradient) */
const C = {
  ink: "#1e1b4b",
  violet: "#4d47b6",
  brand: "#5b61ff",
  brandDeep: "#0000BF",
  pink: "#ec4899",
  muted: "#66638c",
  soft: "#5f5a8a",
} as const;

/** ถ้วยรางวัล data-URI — โทนม่วงโมดูล (html2canvas จับ <img> ได้) */
const TROPHY_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" fill="none">
      <path fill="#5b61ff" d="M35 18h50v8H35zm8 8h34c2 18 8 28 17 34-6 4-10 10-10 18v6H36v-6c0-8-4-14-10-18 9-6 15-16 17-34zm-3 66h40v8H40zm6 8h28l4 22H45z"/>
      <path fill="#4d47b6" opacity=".7" d="M28 26c-10 2-18 12-18 24 0 10 6 18 14 20 2-8 6-14 10-18V26zm64 0v26c4 4 8 10 10 18 8-2 14-10 14-20 0-12-8-22-18-24z"/>
      <path fill="#1e1b4b" d="M48 100h24l3 18H45z"/>
    </svg>`,
  );

/**
 * ลำดับขนาด: ชื่อผู้เรียน > หัวข้อ > ชื่อคอร์ส > บรรทัดผ่านอบรม > บทนำ/วันที่/ผู้ลงนาม > ตำแหน่ง/QR
 * ไม่มีเส้นตกแต่ง · ไม่มีกล่องข้อความ/แคปซูล · QR ล้วน
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
    background: linear-gradient(180deg, #ffffff 0%, #f7f4ff 55%, #eef0ff 100%);
    font-family: "Sarabun", "TH Sarabun New", "Tahoma", "Segoe UI", sans-serif;
    color: ${C.ink};
    position: relative;
    overflow: hidden;
  }

  .trophy {
    position: absolute;
    top: 46%;
    width: 200px;
    height: 230px;
    opacity: 0.12;
    z-index: 0;
    pointer-events: none;
  }
  .trophy--left { left: 40px; transform: translateY(-50%); }
  .trophy--right { right: 40px; transform: translateY(-50%) scaleX(-1); }

  .wave {
    position: absolute;
    bottom: 0;
    width: 340px;
    height: 250px;
    z-index: 1;
    pointer-events: none;
  }
  .wave--left { left: 0; }
  .wave--right { right: 0; transform: scaleX(-1); }

  .wave-base {
    position: absolute;
    left: -30px;
    bottom: -40px;
    width: 320px;
    height: 260px;
    background: ${C.brandDeep};
    border-radius: 0 120% 0 0;
  }
  .wave-mid {
    position: absolute;
    left: -10px;
    bottom: -20px;
    width: 250px;
    height: 190px;
    background: ${C.violet};
    border-radius: 0 110% 0 0;
  }
  .wave-top {
    position: absolute;
    left: 10px;
    bottom: 0;
    width: 190px;
    height: 130px;
    background: ${C.brand};
    border-radius: 0 100% 0 0;
    opacity: 0.9;
  }
  .wave-accent {
    position: absolute;
    left: -5px;
    bottom: -5px;
    width: 150px;
    height: 64px;
    background: ${C.pink};
    border-radius: 0 90% 0 0;
    opacity: 0.75;
  }

  .content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 44px 140px 28px;
  }

  .logo {
    width: 76px;
    height: 76px;
    border-radius: 9999px;
    background: linear-gradient(135deg, ${C.brandDeep}, ${C.brand} 50%, ${C.pink});
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 14px;
    flex-shrink: 0;
    box-shadow: 0 8px 22px rgba(91, 97, 255, 0.28);
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
    font-size: 36px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: ${C.ink};
    line-height: 1.35;
  }

  .lead {
    margin: 0 0 18px;
    font-size: 14px;
    font-weight: 500;
    color: ${C.muted};
  }

  .recipient {
    margin: 0 0 18px;
    padding: 0 8px;
    font-size: 46px;
    font-weight: 800;
    color: ${C.ink};
    line-height: 1.5;
    letter-spacing: 0.01em;
    max-width: 860px;
  }

  .body {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 600;
    color: ${C.soft};
    line-height: 1.5;
    max-width: 760px;
  }

  .course {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.4;
    color: ${C.violet};
    max-width: 820px;
  }

  .date {
    margin: 16px 0 0;
    font-size: 14px;
    font-weight: 500;
    color: ${C.muted};
  }

  .sign-block {
    margin-top: auto;
    padding-top: 20px;
    padding-bottom: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 220px;
  }
  .sign-img {
    height: 52px;
    max-width: 200px;
    object-fit: contain;
    margin-bottom: 6px;
  }
  .sign-scribble {
    width: 170px;
    height: 36px;
    margin-bottom: 6px;
    background:
      radial-gradient(circle at 12% 60%, transparent 40%, ${C.violet} 41%, ${C.violet} 48%, transparent 50%),
      radial-gradient(circle at 38% 40%, transparent 42%, ${C.brand} 43%, ${C.brand} 50%, transparent 52%),
      radial-gradient(circle at 62% 55%, transparent 40%, ${C.violet} 41%, ${C.violet} 48%, transparent 50%),
      radial-gradient(circle at 88% 35%, transparent 42%, ${C.ink} 43%, ${C.ink} 50%, transparent 52%);
    background-size: 40px 36px, 48px 36px, 44px 36px, 40px 36px;
    background-repeat: no-repeat;
    background-position: 0 0, 40px 0, 85px 0, 130px 0;
    opacity: 0.9;
  }
  .sign-name {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: ${C.ink};
  }
  .sign-role {
    margin: 3px 0 0;
    font-size: 12px;
    font-weight: 500;
    color: ${C.muted};
  }
  .note {
    margin-top: 8px;
    font-size: 11px;
    color: ${C.muted};
    max-width: 480px;
    opacity: 0.85;
  }

  /* QR ล้วน — ไม่มีกล่อง / มุม L / แคปซูล */
  .qr-plain {
    position: absolute;
    right: 36px;
    bottom: 36px;
    z-index: 4;
    text-align: center;
  }
  .qr-img {
    width: 96px;
    height: 96px;
    display: block;
    margin: 0 auto;
    background: #fff;
    border-radius: 8px;
  }
  .qr-hint {
    margin: 6px 0 0;
    font-size: 10px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(30, 27, 75, 0.45);
    max-width: 110px;
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

    <div class="wave wave--left" aria-hidden="true">
      <div class="wave-base"></div>
      <div class="wave-mid"></div>
      <div class="wave-top"></div>
      <div class="wave-accent"></div>
    </div>
    <div class="wave wave--right" aria-hidden="true">
      <div class="wave-base"></div>
      <div class="wave-mid"></div>
      <div class="wave-top"></div>
      <div class="wave-accent"></div>
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
