/** CSS แบบฟอร์มราชการคำให้การ (พิมพ์ A4) */
export const OFFICIAL_STATEMENT_FORM_CSS = `
.sp-off {
  font-family: "TH Sarabun New", "Sarabun", "Cordia New", Tahoma, sans-serif;
  color: #111;
  font-size: 15px;
  line-height: 1.35;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  box-sizing: border-box;
  padding: 10mm 12mm 12mm;
}
.sp-off * { box-sizing: border-box; }
.sp-off-head { text-align: center; margin-bottom: 6px; }
.sp-off-garuda { width: 56px; height: auto; display: block; margin: 0 auto 2px; }
.sp-off-org { font-size: 14.5px; font-weight: 700; margin: 0; }
.sp-off-title {
  font-size: 15.5px; font-weight: 700; margin: 2px 0 8px;
}
.sp-off-grid {
  display: grid;
  grid-template-columns: 46mm 1fr;
  gap: 0;
  min-height: 200mm;
}
.sp-off-side {
  border-right: 1px solid #222;
  padding: 4px 8px 8px 0;
  font-size: 13.5px;
  position: relative;
}
.sp-off-main { padding: 0 0 8px 10px; font-size: 14.5px; }
.sp-off-field { margin-bottom: 10px; }
.sp-off-label { font-weight: 700; display: inline; }
.sp-off-dot, .sp-off-input {
  border: none;
  border-bottom: 1px dotted #333;
  background: transparent;
  font: inherit;
  color: inherit;
  outline: none;
  min-width: 2em;
  padding: 0 2px 1px;
  vertical-align: baseline;
}
.sp-off-input { width: 100%; display: block; margin-top: 2px; min-height: 1.35em; }
.sp-off-input-inline { display: inline-block; width: auto; min-width: 4em; margin: 0 2px; }
.sp-off-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 6px; margin-bottom: 8px; }
.sp-off-flex1 { flex: 1 1 6rem; min-width: 4rem; }
.sp-off-case {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px 8px;
  align-items: stretch;
  margin: 10px 0 12px;
}
.sp-off-case-label { writing-mode: horizontal-tb; font-weight: 700; align-self: center; }
.sp-off-brace {
  font-size: 42px; line-height: 0.9; font-weight: 400;
  align-self: center; padding: 0 2px;
}
.sp-off-case-lines { display: flex; flex-direction: column; justify-content: space-around; gap: 10px; }
.sp-off-case-line { display: flex; align-items: baseline; gap: 6px; }
.sp-off-hint { font-size: 12px; color: #333; font-weight: 400; }
.sp-off-qa { margin-top: 14px; border-top: 1px solid #222; padding-top: 10px; }
.sp-off-qa-title { text-align: center; font-weight: 700; margin-bottom: 8px; font-size: 15px; }
.sp-off-qa-block { margin-bottom: 10px; border: 1px solid #333; }
.sp-off-qa-q { background: #f3f8fc; padding: 6px 8px; border-bottom: 1px solid #333; }
.sp-off-qa-a { padding: 6px 8px; min-height: 3.2em; }
.sp-off-qa-textarea {
  width: 100%; border: none; background: transparent; font: inherit;
  resize: vertical; outline: none; min-height: 2.4em; line-height: 1.4;
}
.sp-off-sign {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin-top: 20px; text-align: center; font-size: 14px;
}
.sp-off-sign-line { border-bottom: 1px dotted #333; height: 28px; margin: 8px 16px 4px; }
@media print {
  .sp-off { box-shadow: none; padding: 8mm 10mm; }
}
`;
