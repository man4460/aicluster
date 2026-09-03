/** HTML ใบประกาศนียบัตรจบหลักสูตร — แบบทางการ (กรอบคู่ · ครีม · ฟอนต์ไทย) สำหรับแปลงเป็น PDF */

export type LmsCertificateHtmlInput = {
  instituteName: string;
  learnerName: string;
  courseTitle: string;
  issueDateLabel: string;
  certCode: string;
  signerName?: string;
  note?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLmsCertificateDocumentHtml(input: LmsCertificateHtmlInput): string {
  const institute = escapeHtml(input.instituteName || "สถาบัน");
  const learner = escapeHtml(input.learnerName);
  const course = escapeHtml(input.courseTitle);
  const dateLabel = escapeHtml(input.issueDateLabel);
  const code = escapeHtml(input.certCode);
  const signer = input.signerName ? escapeHtml(input.signerName) : "";
  const note = input.note ? escapeHtml(input.note.slice(0, 160)) : "";

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ใบประกาศนียบัตร ${code}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&family=Cormorant+Garamond:wght@600;700&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }
  #lms-cert-root {
    width: 1123px;
    height: 794px;
    margin: 0;
    padding: 28px;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(196, 163, 90, 0.12), transparent 55%),
      linear-gradient(180deg, #fbf7ef 0%, #f3ebe0 55%, #efe6d8 100%);
    font-family: "Sarabun", "TH Sarabun New", "Tahoma", sans-serif;
    color: #1e1b4b;
    position: relative;
  }
  .outer {
    width: 100%;
    height: 100%;
    border: 3px solid #1e3a5f;
    padding: 10px;
    position: relative;
  }
  .inner {
    width: 100%;
    height: 100%;
    border: 2px solid #c4a35a;
    padding: 36px 48px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }
  .corner {
    position: absolute;
    width: 28px;
    height: 28px;
    border: 2px solid #c4a35a;
  }
  .corner.tl { top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
  .corner.tr { top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
  .corner.bl { bottom: 14px; left: 14px; border-right: 0; border-top: 0; }
  .corner.br { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }
  .seal {
    width: 64px;
    height: 64px;
    border-radius: 9999px;
    border: 3px double #c4a35a;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    background: rgba(255,255,255,0.55);
    color: #1e3a5f;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-weight: 700;
    font-size: 22px;
    letter-spacing: 0.04em;
  }
  .institute {
    font-size: 20px;
    font-weight: 700;
    color: #1e3a5f;
    letter-spacing: 0.04em;
    margin: 0 0 4px;
  }
  .en-label {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: 13px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #8a7348;
    margin: 8px 0 2px;
  }
  .title {
    font-size: 34px;
    font-weight: 700;
    color: #1e3a5f;
    margin: 0 0 18px;
    letter-spacing: 0.06em;
  }
  .lead {
    font-size: 15px;
    color: #5b5678;
    margin: 0 0 10px;
  }
  .recipient {
    font-size: 36px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px;
    padding: 0 12px 8px;
    border-bottom: 2px solid #1e3a5f;
    min-width: 420px;
    max-width: 820px;
    line-height: 1.25;
  }
  .body {
    font-size: 16px;
    color: #4b5563;
    margin: 14px 0 6px;
    max-width: 780px;
    line-height: 1.6;
  }
  .course {
    font-size: 22px;
    font-weight: 700;
    color: #312e81;
    margin: 0 0 18px;
    max-width: 820px;
    line-height: 1.35;
  }
  .meta {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 4px;
  }
  .footer {
    margin-top: auto;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
    padding-top: 18px;
  }
  .footer-col {
    flex: 1;
    text-align: center;
  }
  .sign-line {
    width: 180px;
    margin: 0 auto 6px;
    border-top: 1px solid #94a3b8;
    padding-top: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }
  .sign-role {
    font-size: 12px;
    color: #64748b;
  }
  .note {
    margin-top: 10px;
    font-size: 11px;
    color: #94a3b8;
    max-width: 640px;
  }
  .code-badge {
    font-size: 12px;
    color: #64748b;
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>
  <div id="lms-cert-root">
    <div class="outer">
      <div class="inner">
        <span class="corner tl" aria-hidden="true"></span>
        <span class="corner tr" aria-hidden="true"></span>
        <span class="corner bl" aria-hidden="true"></span>
        <span class="corner br" aria-hidden="true"></span>
        <div class="seal">★</div>
        <p class="institute">${institute}</p>
        <p class="en-label">Certificate of Completion</p>
        <h1 class="title">ใบประกาศนียบัตร</h1>
        <p class="lead">ขอมอบให้แก่</p>
        <p class="recipient">${learner}</p>
        <p class="body">ซึ่งได้ผ่านการเรียนและแบบทดสอบหลักสูตรเรียบร้อยแล้ว</p>
        <p class="course">${course}</p>
        <p class="meta">วันที่ออกใบประกาศ · ${dateLabel}</p>
        <p class="code-badge">รหัสใบประกาศ · ${code}</p>
        <div class="footer">
          <div class="footer-col">
            <div class="sign-line">${signer || "—"}</div>
            <div class="sign-role">${signer ? "ผู้ลงนาม / Authorized Signatory" : "ผู้ลงนาม"}</div>
          </div>
          <div class="footer-col">
            <div class="sign-line">${institute}</div>
            <div class="sign-role">สถาบันผู้ออกใบประกาศ</div>
          </div>
        </div>
        ${note ? `<p class="note">${note}</p>` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}
