export type OralPleaFields = {
  idCardNo: string;
  rank: string;
  stationName: string;
  district: string;
  province: string;
  dayThai: string;
  monthThai: string;
  yearThai: string;
  interviewPlace: string;
  fullName: string;
  age: string;
  ethnicity: string;
  nationality: string;
  religion: string;
  occupation: string;
  houseNo: string;
  moo: string;
  road: string;
  tambon: string;
  amphoe: string;
  addressProvince: string;
  parentsName: string;
  birthTambon: string;
  birthAmphoe: string;
  birthProvince: string;
  incidentDay: string;
  incidentTime: string;
  charge: string;
  qaPages: string[];
  signComplainant: string;
  signOfficer: string;
};

export const ORAL_PLEA_DEFAULT_QA = [
  "ถาม ผู้ต้องหามีทนายความหรือไม่ ต้องการให้ผู้ใดร่วมฟังการสอบสวนหรือไม่ และตามที่ได้แจ้งข้อกล่าวหาให้ทราบแล้วนั้น เข้าใจดีแล้วหรือไม่ จะให้อย่างไร เคยต้องโทษคดีอาญาใด ๆ มาก่อนหรือไม่",
  "ตอบ ข้าฯ ไม่มีและไม่ต้องการทนายความหรือผู้ใดร่วมฟังการสอบสวน ข้าฯ ทราบสิทธิของผู้ต้องหาและข้อกล่าวหาดีโดยตลอดแล้ว ขอให้การรับสารภาพตลอดข้อกล่าวหา ข้าฯ ไม่เคยต้องหาหรือต้องโทษอาญาใด ๆ มาก่อน",
  "ถาม ขอทราบประวัติผู้ต้องหาพอสังเขป และผู้ต้องหาเคยต้องหาหรือต้องโทษคดีอาญาใด ๆ มาก่อนหรือไม่",
  "ตอบ ข้าฯ มีภูมิลำเนาตามที่อยู่ดังกล่าวข้างต้นและปัจจุบันพักอาศัยอยู่ที่ หากข้าฯ ย้ายที่อยู่เมื่อใด จะแจ้งให้พนักงานสอบสวนทราบทันที ข้าฯ จบการศึกษาชั้น ประกอบอาชีพ อยู่ที่ มีรายได้ประมาณเดือนละ บาท สถานภาพ ไม่เคยต้องหาหรือต้องโทษอาญาใด ๆ มาก่อน",
  "ถาม เหตุในคดีนี้เกิดที่ไหน เมื่อใด",
  "ตอบ เหตุเกิด เมื่อ เวลาประมาณ น.",
  "ถาม ผู้ต้องหาเคยมีสาเหตุโกรธเคืองกับผู้หนึ่งผู้ใดมาก่อนหรือไม่",
  "ตอบ ข้าฯ ไม่เคยมีสาเหตุโกรธเคืองกับผู้หนึ่งผู้ใดในคดีนี้มาก่อน",
].join("\n");

export function createEmptyOralPleaQaPages(): string[] {
  return [ORAL_PLEA_DEFAULT_QA, ""];
}

export function createEmptyOralPleaFields(): OralPleaFields {
  return {
    idCardNo: "",
    rank: "",
    stationName: "",
    district: "",
    province: "",
    dayThai: "",
    monthThai: "",
    yearThai: "",
    interviewPlace: "",
    fullName: "",
    age: "",
    ethnicity: "",
    nationality: "",
    religion: "",
    occupation: "",
    houseNo: "",
    moo: "",
    road: "",
    tambon: "",
    amphoe: "",
    addressProvince: "",
    parentsName: "",
    birthTambon: "",
    birthAmphoe: "",
    birthProvince: "",
    incidentDay: "",
    incidentTime: "",
    charge: "",
    qaPages: createEmptyOralPleaQaPages(),
    signComplainant: "",
    signOfficer: "",
  };
}

/** ข้อความที่ล้นหน้า pageIdx → ต้นหน้าถัดไป (ต่อใบถ้าจำเป็น) */
export function flowOralPleaQaOverflow(pages: string[], pageIdx: number, moved: string): string[] {
  const list = pages.length >= 2 ? [...pages] : [...pages, ""];
  while (pageIdx + 1 >= list.length) list.push("");
  const existing = list[pageIdx + 1] ?? "";
  const startsWithContinuation = existing.trim() !== "" && !/^\s*(ถาม|ตอบ)/.test(existing);
  const merged = !moved.trim()
    ? existing
    : !existing.trim()
      ? moved
      : startsWithContinuation
        ? `${moved}${existing.replace(/^\s+/, "")}`
        : `${moved}\n${existing}`;
  list[pageIdx + 1] = merged;
  return list;
}
