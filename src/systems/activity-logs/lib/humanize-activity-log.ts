/**
 * แปลงบันทึกความเคลื่อนไหว (action / model / payload) เป็นข้อความภาษาไทยที่อ่านง่าย
 * รองรับทั้ง payload จาก writeSystemActivityLog แบบย่อ และ args เต็มจาก Prisma audit hook
 */

const MODEL_LABELS: Record<string, string> = {
  User: "บัญชีผู้ใช้",
  TrialSession: "เซสชันทดลอง",
  AppModule: "โมดูลระบบ",
  ChatThread: "กระทู้/ห้องแชท",
  ChatMessage: "ข้อความแชท",
  TopUpOrder: "คำสั่งเติมโทเคน",
  DormitoryProfile: "โปรไฟล์หอพัก",
  BarberShopProfile: "โปรไฟล์ร้านตัดผม",
  Room: "ห้องพัก",
  Tenant: "ผู้เช่า",
  UtilityBill: "บิลค่าน้ำ/ไฟ",
  SplitBillPayment: "รายการจ่ายเงิน (หอพัก)",
  DormitoryCostCategory: "หมวดต้นทุน (หอพัก)",
  DormitoryCostEntry: "รายการต้นทุน (หอพัก)",
  BarberPackage: "แพ็กบริการ (ร้านตัดผม)",
  BarberCustomer: "ลูกค้า (ร้านตัดผม)",
  BarberBooking: "การจอง (ร้านตัดผม)",
  BarberCustomerSubscription: "แพ็กลูกค้า (ร้านตัดผม)",
  BarberServiceLog: "ประวัติบริการ (ร้านตัดผม)",
  BarberStylist: "ช่าง (ร้านตัดผม)",
  BarberPortalStaffPing: "สถานะพนักงาน (ร้านตัดผม)",
  BarberCostCategory: "หมวดค่าใช้จ่าย (ร้านตัดผม)",
  BarberCostEntry: "รายการค่าใช้จ่าย (ร้านตัดผม)",
  AttendanceSettings: "ตั้งค่าเวลาเข้างาน",
  AttendanceLocation: "จุดเช็คอิน",
  AttendanceShift: "กะงาน",
  AttendanceRosterEntry: "ตารางกะ",
  AttendanceLog: "บันทึกเวลาเข้า–ออก",
  HomeFinanceEntry: "รายรับ–รายจ่าย (บ้าน)",
  HomeFinanceCategory: "หมวดรายรับ–รายจ่าย",
  HomeUtilityProfile: "มิเตอร์/ค่าไฟน้ำ (บ้าน)",
  HomeVehicleProfile: "ยานพาหนะ (บ้าน)",
  HomeFinanceReminder: "การแจ้งเตือน (รายรับ–รายจ่าย)",
  CarWashPackage: "แพ็กคาร์แคร์",
  CarWashBundle: "ชุดแพ็กคาร์แคร์",
  CarWashVisit: "รายการเข้าใช้คาร์แคร์",
  CarWashComplaint: "ข้อร้องเรียนคาร์แคร์",
  CarWashCostCategory: "หมวดต้นทุนคาร์แคร์",
  CarWashCostEntry: "รายการต้นทุนคาร์แคร์",
  MqttTenantProfile: "โปรไฟล์ MQTT",
  MqttCredential: "ข้อมูลล็อกอิน MQTT",
  MqttAclRule: "กฎสิทธิ์ MQTT",
  MqttClientSessionLog: "เซสชัน MQTT",
  MqttMessageStatDaily: "สถิติข้อความ MQTT",
  BuildingPosCategory: "หมวดเมนู POS ร้านอาหาร",
  BuildingPosMenuItem: "รายการเมนู POS",
  BuildingPosIngredient: "วัตถุดิบ POS",
  BuildingPosPurchaseOrder: "ใบสั่งซื้อ POS",
  BuildingPosPurchaseLine: "รายการในใบสั่งซื้อ POS",
  BuildingPosMenuRecipeLine: "สูตรเมนู POS",
  BuildingPosOrder: "ออเดอร์ POS",
  BuildingPosStaffLink: "ลิงก์พนักงาน POS",
  VillageProfile: "โปรไฟล์หมู่บ้าน",
  VillageHouse: "บ้านในหมู่บ้าน",
  VillageResident: "ผู้อยู่อาศัย",
  VillageCommonFeeRow: "รายการค่าส่วนกลาง",
  VillageSlipSubmission: "สลิปโอนหมู่บ้าน",
  ParkingSite: "ลานจอดรถ",
  ParkingSpot: "ช่องจอด",
  ParkingSession: "เซสชันจอดรถ",
  SystemActivityLog: "บันทึกความเคลื่อนไหว",
};

const ACTION_VERBS: Record<string, string> = {
  CREATE: "เพิ่มข้อมูลใน",
  UPDATE: "แก้ไขข้อมูลใน",
  UPSERT: "เพิ่มหรือแก้ไขข้อมูลใน",
  DELETE: "ลบข้อมูลใน",
  CREATE_MANY: "เพิ่มหลายรายการใน",
  UPDATE_MANY: "แก้ไขหลายรายการใน",
  DELETE_MANY: "ลบหลายรายการใน",
};

const FIELD_LABELS: Record<string, string> = {
  id: "รหัส",
  ownerUserId: "เจ้าของข้อมูล",
  authorId: "ผู้สร้าง",
  userId: "ผู้ใช้",
  title: "หัวข้อ",
  amount: "จำนวนเงิน",
  note: "หมายเหตุ",
  status: "สถานะ",
  name: "ชื่อ",
  phone: "เบอร์โทร",
  email: "อีเมล",
  username: "ชื่อผู้ใช้",
  fullName: "ชื่อเต็ม",
  role: "บทบาท",
  tokens: "โทเคน",
  subscriptionTier: "ระดับแพ็กเกจ",
  subscriptionType: "ประเภทแพ็กเกจ",
  remainingSessions: "จำนวนครั้งที่เหลือ",
  saleReceiptImageUrl: "รูปใบเสร็จขายแพ็ก",
  isActive: "เปิดใช้งาน",
  isDone: "ทำเสร็จแล้ว",
  dueDate: "วันครบกำหนด",
  paymentStatus: "สถานะการจ่าย",
  paidAt: "วันที่จ่าย",
  receiptNumber: "เลขที่ใบเสร็จ",
  amountToPay: "ยอดที่ต้องจ่าย",
  roomKind: "ประเภทห้องแชท",
  content: "เนื้อหา",
  threadId: "กระทู้",
};

function modelLabel(modelName: string): string {
  return MODEL_LABELS[modelName] ?? `ข้อมูล (${modelName})`;
}

/** ชื่อส่วนของระบบภาษาไทยสำหรับหัวตาราง */
export function activityLogModelLabelTh(modelName: string): string {
  return modelLabel(modelName);
}

function actionVerb(action: string): string {
  return ACTION_VERBS[action] ?? `ดำเนินการ (${action}) กับ`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return "ว่าง";
  if (typeof v === "boolean") return v ? "ใช่" : "ไม่";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string") return truncate(v, 48);
  if (typeof v === "bigint") return v.toString();
  return "";
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

/** สรุปค่าใน where แบบอ่านง่าย */
function summarizeWhere(where: unknown): string {
  if (where == null) return "";
  if (!isPlainObject(where)) return "";

  if (typeof where.id === "string" || typeof where.id === "number") {
    return `รหัส ${where.id}`;
  }

  const idIn = where.id;
  if (isPlainObject(idIn) && Array.isArray(idIn.in)) {
    const n = idIn.in.length;
    return `เลือก ${n} รายการตามรหัส`;
  }

  const keys = Object.keys(where).filter((k) => k !== "AND" && k !== "OR" && k !== "NOT");
  if (keys.length === 1) {
    const k = keys[0]!;
    const val = where[k];
    if (val === null || typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      return `${fieldLabel(k)} = ${formatScalar(val)}`;
    }
  }

  if (keys.length <= 4) {
    return `ค้นหาตามเงื่อนไข (${keys.map(fieldLabel).join(", ")})`;
  }
  return "ค้นหาตามเงื่อนไขหลายข้อ";
}

/** สรุปฟิลด์ใน data (สร้าง/แก้ไข) */
function summarizeDataFields(data: Record<string, unknown>, max = 10): string {
  const parts: string[] = [];
  const skip = new Set(["updatedAt", "createdAt", "passwordHash"]);
  for (const [k, v] of Object.entries(data)) {
    if (skip.has(k)) continue;
    if (parts.length >= max) break;

    const label = fieldLabel(k);
    if (v === null) {
      parts.push(`${label}: ล้างค่า`);
      continue;
    }
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      if ("connect" in o || "disconnect" in o || "set" in o || "create" in o) {
        parts.push(`${label}: ปรับความเชื่อมโยง`);
        continue;
      }
      parts.push(`${label}: ข้อมูลซับซ้อน`);
      continue;
    }
    const s = formatScalar(v);
    if (s) parts.push(`${label}: ${s}`);
  }
  const rest = Object.keys(data).filter((k) => !skip.has(k)).length;
  const suffix = rest > max ? ` …(และอีกประมาณ ${rest - max} ฟิลด์)` : "";
  return parts.join(" · ") + suffix;
}

function looksLikePrismaArgs(p: Record<string, unknown>): boolean {
  if ("data" in p || "where" in p) return true;
  if ("where" in p && ("create" in p || "update" in p)) return true;
  return false;
}

function humanizePrismaStyle(action: string, modelName: string, p: Record<string, unknown>): string {
  const label = modelLabel(modelName);
  const verb = actionVerb(action);

  if (action === "DELETE" || action === "DELETE_MANY") {
    const w = summarizeWhere(p.where);
    return w ? `${verb}${label} — ${w}` : `${verb}${label}`;
  }

  if (action === "CREATE_MANY" && Array.isArray(p.data)) {
    return `${verb}${label} — จำนวน ${p.data.length} แถว`;
  }

  if (action === "UPDATE_MANY") {
    const w = summarizeWhere(p.where);
    const data = p.data;
    const extra = isPlainObject(data) ? summarizeDataFields(data, 8) : "";
    const base = w ? `${verb}${label} — เงื่อนไข: ${w}` : `${verb}${label}`;
    return extra ? `${base} — เปลี่ยน: ${extra}` : base;
  }

  if (action === "UPSERT") {
    const w = summarizeWhere(p.where);
    const create = isPlainObject(p.create) ? summarizeDataFields(p.create, 6) : "";
    const update = isPlainObject(p.update) ? summarizeDataFields(p.update, 6) : "";
    const bits = [create ? `ถ้ายังไม่มี: ${create}` : "", update ? `ถ้ามีแล้ว: ${update}` : ""].filter(
      Boolean,
    );
    const head = w ? `${verb}${label} — ${w}` : `${verb}${label}`;
    return bits.length ? `${head} — ${bits.join(" · ")}` : head;
  }

  if (action === "CREATE" && isPlainObject(p.data)) {
    const body = summarizeDataFields(p.data, 12);
    return body ? `${verb}${label} — ${body}` : `${verb}${label}`;
  }

  if (action === "UPDATE" && isPlainObject(p.data)) {
    const w = summarizeWhere(p.where);
    const body = summarizeDataFields(p.data, 12);
    const head = w ? `${verb}${label} — ${w}` : `${verb}${label}`;
    return body ? `${head} — ปรับ: ${body}` : head;
  }

  if (isPlainObject(p.data)) {
    const body = summarizeDataFields(p.data, 8);
    const w = summarizeWhere(p.where);
    const head = w ? `${verb}${label} — ${w}` : `${verb}${label}`;
    return body ? `${head} — ${body}` : head;
  }

  return `${verb}${label}`;
}

/** payload แบบที่ API เขียนเอง (ไม่ใช่ args เต็มของ Prisma) */
function humanizeManualPayload(action: string, modelName: string, p: Record<string, unknown>): string | null {
  const label = modelLabel(modelName);
  const verb = actionVerb(action);

  if ("changes" in p && isPlainObject(p.changes) && !("where" in p)) {
    const id = p.id != null ? String(p.id) : null;
    const ch = summarizeDataFields(p.changes, 14);
    const head = id ? `${verb}${label} — รหัส ${id}` : `${verb}${label}`;
    return ch ? `${head} — ปรับ: ${ch}` : head;
  }

  if (modelName === "HomeFinanceEntry" && action === "CREATE" && typeof p.title === "string" && p.amount != null) {
    return `บันทึกรายรับ–รายจ่ายใหม่ — «${truncate(p.title, 40)}» จำนวน ${formatScalar(p.amount)} บาท${p.id != null ? ` (รหัส ${p.id})` : ""}`;
  }

  if (modelName === "HomeFinanceReminder" && action === "CREATE" && typeof p.title === "string") {
    return `สร้างการแจ้งเตือน — «${truncate(p.title, 40)}»${p.id != null ? ` (รหัส ${p.id})` : ""}`;
  }

  if (action === "DELETE" && p.id != null && Object.keys(p).length <= 3) {
    return `${verb}${label} — รหัส ${p.id}`;
  }

  if (action === "CREATE" && p.id != null && isPlainObject(p) && !("data" in p)) {
    const body = summarizeDataFields(p, 10);
    if (body) return `${verb}${label} — ${body}`;
  }

  return null;
}

/**
 * ข้อความสรุปหนึ่งย่อหน้า (หรือสองบรรทัด) สำหรับแสดงในแถวตาราง
 */
export function humanizeActivityLogRow(action: string, modelName: string, payload: unknown): string {
  let p: unknown = payload;
  if (typeof p === "string") {
    const raw = p;
    try {
      p = JSON.parse(raw) as unknown;
    } catch {
      return truncate(raw, 200);
    }
  }

  if (p == null) {
    return `${actionVerb(action)}${modelLabel(modelName)} — ไม่มีรายละเอียดเพิ่มเติม`;
  }

  if (!isPlainObject(p)) {
    return `${actionVerb(action)}${modelLabel(modelName)} — ${truncate(String(p), 160)}`;
  }

  const manual = humanizeManualPayload(action, modelName, p);
  if (manual) return truncate(manual, 520);

  if (looksLikePrismaArgs(p)) {
    return truncate(humanizePrismaStyle(action, modelName, p), 520);
  }

  const fallback = summarizeDataFields(p, 12);
  const head = `${actionVerb(action)}${modelLabel(modelName)}`;
  return truncate(fallback ? `${head} — ${fallback}` : `${head} — มีข้อมูลประกอบในฐานข้อมูล`, 520);
}

export function actionLabelTh(action: string): string {
  const m: Record<string, string> = {
    CREATE: "เพิ่มข้อมูล",
    UPDATE: "แก้ไขข้อมูล",
    UPSERT: "เพิ่มหรือแก้ไข",
    DELETE: "ลบข้อมูล",
    CREATE_MANY: "เพิ่มหลายรายการ",
    UPDATE_MANY: "แก้ไขหลายรายการ",
    DELETE_MANY: "ลบหลายรายการ",
  };
  return m[action] ?? action;
}
