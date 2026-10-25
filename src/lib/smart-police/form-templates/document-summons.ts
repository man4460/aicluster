export const DOCUMENT_SUMMONS_AUTHORITY =
  "อาศัยอำนาจตามประมวลกฎหมายวิธีพิจารณาความอาญา พุทธศักราช ๒๔๗๗ มาตรา ๑๓๒ (๔)";

export type DocumentSummonsFields = {
  docNo: string;
  issuePlace: string;
  issueDay: string;
  issueMonth: string;
  issueYear: string;
  caseNo: string;
  complainant: string;
  suspect: string;
  summonedName: string;
  houseNo: string;
  road: string;
  subDistrict: string;
  district: string;
  province: string;
  headman: string;
  kamnan: string;
  reason: string;
  orderText: string;
  placeToGo: string;
  appointDay: string;
  appointMonth: string;
  appointYear: string;
  appointTime: string;
  signName: string;
  signPrinted: string;
  signPosition: string;
  signPhone: string;
};

export function createEmptyDocumentSummonsFields(): DocumentSummonsFields {
  return {
    docNo: "",
    issuePlace: "",
    issueDay: "",
    issueMonth: "",
    issueYear: "",
    caseNo: "",
    complainant: "",
    suspect: "",
    summonedName: "",
    houseNo: "",
    road: "",
    subDistrict: "",
    district: "",
    province: "",
    headman: "",
    kamnan: "",
    reason: "",
    orderText: "",
    placeToGo: "",
    appointDay: "",
    appointMonth: "",
    appointYear: "",
    appointTime: "",
    signName: "",
    signPrinted: "",
    signPosition: "",
    signPhone: "",
  };
}
