import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const BAIL_BOND_LINE_MM = 7.2;
export const BAIL_BOND_PAGE_INNER_MM = 273;
export const BAIL_BOND_PAGE_NO_MM = 10;
export const BAIL_BOND_HEADER_MM = 30;
export const BAIL_BOND_NAME_MM = 6;
export const BAIL_BOND_AFTER_CHARGE_MM = 12;
export const BAIL_BOND_QUEST_INTRO_MM = 11;
export const BAIL_BOND_Q1_LABEL_MM = 6;
export const BAIL_BOND_Q2_LABEL_MM = 7;
export const BAIL_BOND_WARN_MM = 11;
export const BAIL_BOND_PETITION_SIGNS_MM = 13;
export const BAIL_BOND_SURETY_HEAD_MM = 18;
export const BAIL_BOND_IDENTITY_MM = 16;
export const BAIL_BOND_CLAUSE1_HEAD_MM = 6;
export const BAIL_BOND_CLAUSE1_TAIL_MM = 11;
export const BAIL_BOND_CLAUSE2_MM = 13;
export const BAIL_BOND_CLAUSE3_HEAD_MM = 6;
export const BAIL_BOND_CLAUSE3_TAIL_MM = 22;
export const BAIL_BOND_SURETY_SIGNS_MM = 24;
export const BAIL_BOND_APPOINT_HEAD_MM = 13.1;
export const BAIL_BOND_ASSET_HEAD_MM = 17.9;
export const BAIL_BOND_ASSET_SIGN_MM = 12;
export const BAIL_BOND_TABLE_ROW_MM = 7.8;
export const BAIL_BOND_TABLE_HEAD_MM = 13.1;
export const BAIL_BOND_APPOINT_DEFAULT = 10;
export const BAIL_BOND_ASSET_DEFAULT = 8;
export const BAIL_BOND_TABLE_MIN = 1;

export const BAIL_BOND_FLOW_FIELDS = [
  { key: "petitionCharge" as const, label: "ต้องหาว่า", minLines: 2 },
  { key: "q1Answer" as const, label: "ตอบ", minLines: 1 },
  { key: "q2Answer" as const, label: "ตอบ", minLines: 1 },
  { key: "clause1Charge" as const, label: "ต้องหาว่า", minLines: 2 },
  { key: "clause3Given" as const, label: "ข้อ  ๓.  เพื่อเป็นหลักฐานประกัน ข้าพเจ้าได้", minLines: 2 },
] as const;

export type BailBondFlowKey = (typeof BAIL_BOND_FLOW_FIELDS)[number]["key"];

export type BailBondAppointRow = {
  date: string;
  time: string;
  place: string;
  sign: string;
};

export type BailBondAssetRow = {
  item: string;
  qty: string;
  baht: string;
  satang: string;
  totalBaht: string;
  totalSatang: string;
  note: string;
};

export type BailBondFields = {
  station: string;
  day: string;
  month: string;
  year: string;
  petitioner: string;
  petitionerAge: string;
  petitionCharge: string;
  signPetitioner: string;
  q1Answer: string;
  q2Answer: string;
  signSuretyAsk: string;
  signInquiryAsk: string;
  writtenAt: string;
  suretyDay: string;
  suretyMonth: string;
  suretyYear: string;
  suretyName: string;
  suretyAge: string;
  race: string;
  nationality: string;
  houseNo: string;
  subdistrict: string;
  district: string;
  province: string;
  suretyStation: string;
  clause1Suspect: string;
  clause1Charge: string;
  amountNumber: string;
  amountText: string;
  clause3Given: string;
  signSurety: string;
  signReceiver: string;
  signWitness1: string;
  signWitness2: string;
  appointRows: BailBondAppointRow[];
  assetRows: BailBondAssetRow[];
  signAsset: string;
};

export function createEmptyBailBondAppointRow(): BailBondAppointRow {
  return { date: "", time: "", place: "", sign: "" };
}

export function createEmptyBailBondAssetRow(): BailBondAssetRow {
  return { item: "", qty: "", baht: "", satang: "", totalBaht: "", totalSatang: "", note: "" };
}

export function createEmptyBailBondFields(): BailBondFields {
  return {
    station: "",
    day: "",
    month: "",
    year: "",
    petitioner: "",
    petitionerAge: "",
    petitionCharge: "",
    signPetitioner: "",
    q1Answer: "",
    q2Answer: "",
    signSuretyAsk: "",
    signInquiryAsk: "",
    writtenAt: "",
    suretyDay: "",
    suretyMonth: "",
    suretyYear: "",
    suretyName: "",
    suretyAge: "",
    race: "",
    nationality: "",
    houseNo: "",
    subdistrict: "",
    district: "",
    province: "",
    suretyStation: "",
    clause1Suspect: "",
    clause1Charge: "",
    amountNumber: "",
    amountText: "",
    clause3Given: "",
    signSurety: "",
    signReceiver: "",
    signWitness1: "",
    signWitness2: "",
    appointRows: Array.from({ length: BAIL_BOND_APPOINT_DEFAULT }, () => createEmptyBailBondAppointRow()),
    assetRows: Array.from({ length: BAIL_BOND_ASSET_DEFAULT }, () => createEmptyBailBondAssetRow()),
    signAsset: "",
  };
}

export function addBailBondAppointRow(rows: BailBondAppointRow[]): BailBondAppointRow[] {
  return [...rows, createEmptyBailBondAppointRow()];
}

export function removeLastBailBondAppointRow(rows: BailBondAppointRow[]): BailBondAppointRow[] {
  if (rows.length <= BAIL_BOND_APPOINT_DEFAULT) return rows;
  return rows.slice(0, -1);
}

export function addBailBondAssetRow(rows: BailBondAssetRow[]): BailBondAssetRow[] {
  return [...rows, createEmptyBailBondAssetRow()];
}

export function removeLastBailBondAssetRow(rows: BailBondAssetRow[]): BailBondAssetRow[] {
  if (rows.length <= BAIL_BOND_ASSET_DEFAULT) return rows;
  return rows.slice(0, -1);
}

export type BailBondPageSlice = {
  key: BailBondFlowKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type BailBondPageKind = "petition" | "schedule";

export type BailBondPageModel = {
  index: number;
  kind: BailBondPageKind;
  showHeader: boolean;
  showPageNo: boolean;
  showName: boolean;
  petitionCharge: BailBondPageSlice[];
  showAfterCharge: boolean;
  showQuestIntro: boolean;
  showQ1Label: boolean;
  q1Answer: BailBondPageSlice[];
  showQ2Label: boolean;
  q2Answer: BailBondPageSlice[];
  showPetitionClose: boolean;
  showSuretyOpen: boolean;
  clause1Charge: BailBondPageSlice[];
  showClause2: boolean;
  clause3Given: BailBondPageSlice[];
  showSuretyClose: boolean;
  appointRows: BailBondAppointRow[];
  appointOffset: number;
  showAsset: boolean;
  assetRows: BailBondAssetRow[];
  assetOffset: number;
  showAssetSign: boolean;
};

function emptyPetition(index: number): BailBondPageModel {
  return {
    index,
    kind: "petition",
    showHeader: index === 0,
    showPageNo: index > 0,
    showName: false,
    petitionCharge: [],
    showAfterCharge: false,
    showQuestIntro: false,
    showQ1Label: false,
    q1Answer: [],
    showQ2Label: false,
    q2Answer: [],
    showPetitionClose: false,
    showSuretyOpen: false,
    clause1Charge: [],
    showClause2: false,
    clause3Given: [],
    showSuretyClose: false,
    appointRows: [],
    appointOffset: 0,
    showAsset: false,
    assetRows: [],
    assetOffset: 0,
    showAssetSign: false,
  };
}

function emptySchedule(index: number, pageNo: boolean): BailBondPageModel {
  return {
    ...emptyPetition(index),
    kind: "schedule",
    showHeader: false,
    showPageNo: pageNo,
  };
}

export function packBailBondPages(
  fields: BailBondFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): BailBondPageModel[] {
  const pages: BailBondPageModel[] = [];
  let page = emptyPetition(0);
  let used = BAIL_BOND_HEADER_MM;

  function remaining(): number {
    return BAIL_BOND_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPetition(pages.length);
    used = BAIL_BOND_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlow(def: (typeof BAIL_BOND_FLOW_FIELDS)[number]) {
    let rest = fields[def.key];
    let first = true;
    let sliceIndex = 0;
    let placed = 0;
    let hops = 0;
    while (hops++ < 400) {
      const indentCh = first && def.label ? def.label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const availLines = Math.floor(remaining() / BAIL_BOND_LINE_MM);
      if (availLines < 1) {
        flush();
        continue;
      }
      const stillNeed = Math.max(def.minLines - placed, contentLines, 1);
      const takeLines = Math.min(availLines, stillNeed);
      const [head, tail] =
        contentLines > takeLines
          ? splitArrestTextByLines(rest, takeLines, indentCh, countLines)
          : [rest, ""];
      if (!head && tail) {
        flush();
        continue;
      }
      const slice: BailBondPageSlice = {
        key: def.key,
        label: def.label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && def.label),
        sliceIndex,
      };
      if (def.key === "petitionCharge") page.petitionCharge.push(slice);
      else if (def.key === "q1Answer") page.q1Answer.push(slice);
      else if (def.key === "q2Answer") page.q2Answer.push(slice);
      else if (def.key === "clause1Charge") page.clause1Charge.push(slice);
      else page.clause3Given.push(slice);
      used += takeLines * BAIL_BOND_LINE_MM + 0.35;
      placed += takeLines;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest && placed >= def.minLines) break;
      if (rest) flush();
    }
  }

  page.showName = true;
  used += BAIL_BOND_NAME_MM;
  addFlow(BAIL_BOND_FLOW_FIELDS[0]);
  need(BAIL_BOND_AFTER_CHARGE_MM);
  page.showAfterCharge = true;
  used += BAIL_BOND_AFTER_CHARGE_MM;

  need(BAIL_BOND_QUEST_INTRO_MM + BAIL_BOND_Q1_LABEL_MM);
  page.showQuestIntro = true;
  page.showQ1Label = true;
  used += BAIL_BOND_QUEST_INTRO_MM + BAIL_BOND_Q1_LABEL_MM;
  addFlow(BAIL_BOND_FLOW_FIELDS[1]);
  need(BAIL_BOND_Q2_LABEL_MM);
  page.showQ2Label = true;
  used += BAIL_BOND_Q2_LABEL_MM;
  addFlow(BAIL_BOND_FLOW_FIELDS[2]);
  need(BAIL_BOND_WARN_MM + BAIL_BOND_PETITION_SIGNS_MM);
  page.showPetitionClose = true;
  used += BAIL_BOND_WARN_MM + BAIL_BOND_PETITION_SIGNS_MM;

  need(BAIL_BOND_SURETY_HEAD_MM + BAIL_BOND_IDENTITY_MM + BAIL_BOND_CLAUSE1_HEAD_MM);
  page.showSuretyOpen = true;
  used += BAIL_BOND_SURETY_HEAD_MM + BAIL_BOND_IDENTITY_MM + BAIL_BOND_CLAUSE1_HEAD_MM;
  addFlow(BAIL_BOND_FLOW_FIELDS[3]);
  need(BAIL_BOND_CLAUSE1_TAIL_MM + BAIL_BOND_CLAUSE2_MM + BAIL_BOND_CLAUSE3_HEAD_MM);
  page.showClause2 = true;
  used += BAIL_BOND_CLAUSE1_TAIL_MM + BAIL_BOND_CLAUSE2_MM + BAIL_BOND_CLAUSE3_HEAD_MM;
  addFlow(BAIL_BOND_FLOW_FIELDS[4]);
  need(BAIL_BOND_CLAUSE3_TAIL_MM + BAIL_BOND_SURETY_SIGNS_MM);
  page.showSuretyClose = true;
  used += BAIL_BOND_CLAUSE3_TAIL_MM + BAIL_BOND_SURETY_SIGNS_MM;
  pages.push(page);

  function chunkPad<T>(rows: T[], size: number, empty: () => T): { rows: T[]; offset: number }[] {
    const src = rows.length ? rows : [empty()];
    const out: { rows: T[]; offset: number }[] = [];
    for (let i = 0; i < src.length; i += size) {
      const part = src.slice(i, i + size);
      out.push({
        offset: i,
        rows: i === 0 ? [...part, ...Array.from({ length: Math.max(0, size - part.length) }, empty)] : part,
      });
    }
    return out.length ? out : [{ offset: 0, rows: Array.from({ length: size }, empty) }];
  }

  const appointChunks = chunkPad(fields.appointRows, BAIL_BOND_APPOINT_DEFAULT, createEmptyBailBondAppointRow);
  const assetChunks = chunkPad(fields.assetRows, BAIL_BOND_ASSET_DEFAULT, createEmptyBailBondAssetRow);
  const scheduleCount = Math.max(appointChunks.length, assetChunks.length, 1);
  for (let i = 0; i < scheduleCount; i += 1) {
    const sch = emptySchedule(pages.length, i > 0);
    const appoint = appointChunks[i] ?? { offset: 0, rows: [] as BailBondAppointRow[] };
    const asset = assetChunks[i] ?? { offset: 0, rows: [] as BailBondAssetRow[] };
    sch.appointRows = appoint.rows;
    sch.appointOffset = appoint.offset;
    sch.showAsset = asset.rows.length > 0;
    sch.assetRows = asset.rows;
    sch.assetOffset = asset.offset;
    sch.showAssetSign = i === scheduleCount - 1;
    pages.push(sch);
  }

  return pages;
}
