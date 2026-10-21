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
  answerLawyer: string;
  currentStay: string;
  education: string;
  job: string;
  workplace: string;
  income: string;
  maritalStatus: string;
  incidentPlace: string;
  incidentWhen: string;
  incidentClock: string;
  answerGrudge: string;
  signComplainant: string;
  signOfficer: string;
};

export const ORAL_PLEA_DEFAULT_ANSWER_LAWYER =
  "ข้าฯ ไม่มีและไม่ต้องการทนายความหรือผู้ใดร่วมฟังการสอบสวน ข้าฯ ทราบสิทธิของผู้ต้องหาและข้อกล่าวหาดีโดยตลอดแล้ว ขอให้การรับสารภาพตลอดข้อกล่าวหา ข้าฯ ไม่เคยต้องหาหรือต้องโทษอาญาใด ๆ มาก่อน";

export const ORAL_PLEA_DEFAULT_ANSWER_GRUDGE =
  "ข้าฯ ไม่เคยมีสาเหตุโกรธเคืองกับผู้หนึ่งผู้ใดในคดีนี้มาก่อน";

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
    answerLawyer: ORAL_PLEA_DEFAULT_ANSWER_LAWYER,
    currentStay: "",
    education: "",
    job: "",
    workplace: "",
    income: "",
    maritalStatus: "",
    incidentPlace: "",
    incidentWhen: "",
    incidentClock: "",
    answerGrudge: ORAL_PLEA_DEFAULT_ANSWER_GRUDGE,
    signComplainant: "",
    signOfficer: "",
  };
}
