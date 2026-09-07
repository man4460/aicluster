/** ฟิลด์สมาชิกที่เปิดเผยได้บนเว็บสาธารณะ (ชื่อเต็มเปิดเสมอเมื่อเปิดค้นหา) */
export type ClubPortalMemberPublicFields = {
  photo: boolean;
  nickname: boolean;
  position: boolean;
  memberCode: boolean;
  phone: boolean;
  email: boolean;
  social: boolean;
  gender: boolean;
  /** ช่องเพิ่มเติมจากฟอร์มสมาชิก (ป้าย + ค่า) — ค้นหาและแสดงบนเว็บ */
  customFields: boolean;
};

export const DEFAULT_CLUB_PORTAL_MEMBER_FIELDS: ClubPortalMemberPublicFields = {
  photo: true,
  nickname: true,
  position: true,
  memberCode: false,
  phone: false,
  email: false,
  social: false,
  gender: false,
  customFields: true,
};

export const CLUB_PORTAL_MEMBER_FIELD_OPTIONS: {
  key: keyof ClubPortalMemberPublicFields;
  label: string;
  hint: string;
}[] = [
  { key: "photo", label: "รูปโปรไฟล์", hint: "รูปถ่ายสมาชิก" },
  { key: "nickname", label: "ชื่อเล่น", hint: "" },
  { key: "position", label: "ตำแหน่ง / บทบาท", hint: "" },
  { key: "memberCode", label: "รหัสสมาชิก", hint: "" },
  { key: "phone", label: "เบอร์โทร", hint: "ข้อมูลติดต่อส่วนตัว — ระวังก่อนเปิด" },
  { key: "email", label: "อีเมล", hint: "ข้อมูลติดต่อส่วนตัว — ระวังก่อนเปิด" },
  { key: "social", label: "โซเชียล / LINE", hint: "" },
  { key: "gender", label: "เพศ", hint: "" },
  {
    key: "customFields",
    label: "ช่องเพิ่มเติมจากฟอร์มสมาชิก",
    hint: "ค้นหาและแสดงป้าย/ค่าที่เพิ่มในหน้าจัดการสมาชิก (เช่น ไซส์เสื้อ)",
  },
];

export function parsePortalMemberFieldsJson(raw: string | null | undefined): ClubPortalMemberPublicFields {
  const base = { ...DEFAULT_CLUB_PORTAL_MEMBER_FIELDS };
  if (!raw?.trim()) return base;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return base;
    const o = parsed as Record<string, unknown>;
    for (const key of Object.keys(base) as (keyof ClubPortalMemberPublicFields)[]) {
      if (typeof o[key] === "boolean") base[key] = o[key];
    }
    // JSON เก่าที่ยังไม่มีคีย์ — ค่าเริ่มเปิด เพื่อให้ช่องเพิ่มค้นหาได้ทันที
    if (typeof o.customFields !== "boolean") base.customFields = true;
    return base;
  } catch {
    return base;
  }
}

export function serializePortalMemberFields(fields: ClubPortalMemberPublicFields): string {
  return JSON.stringify({
    photo: Boolean(fields.photo),
    nickname: Boolean(fields.nickname),
    position: Boolean(fields.position),
    memberCode: Boolean(fields.memberCode),
    phone: Boolean(fields.phone),
    email: Boolean(fields.email),
    social: Boolean(fields.social),
    gender: Boolean(fields.gender),
    customFields: Boolean(fields.customFields),
  });
}

export type ClubPortalPublicMemberCustomField = {
  label: string;
  value: string;
};

export type ClubPortalPublicMember = {
  id: string;
  name: string;
  photoUrl?: string | null;
  nickname?: string;
  position?: string;
  memberCode?: string;
  phone?: string;
  email?: string;
  social?: string;
  gender?: string;
  customFields?: ClubPortalPublicMemberCustomField[];
};

type MemberRow = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: string;
  phone: string;
  photoUrl: string | null;
  position: string;
  email: string;
  social: string;
  memberCode: string;
  customFieldsJson?: string | null;
};

function parseMemberCustomFieldsForPublic(
  raw: string | null | undefined,
): ClubPortalPublicMemberCustomField[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: ClubPortalPublicMemberCustomField[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const label = String((row as { label?: unknown }).label ?? "").trim();
      const value = String((row as { value?: unknown }).value ?? "").trim();
      if (!label || !value) continue;
      out.push({ label: label.slice(0, 80), value: value.slice(0, 200) });
    }
    return out;
  } catch {
    return [];
  }
}

/** คำค้นตรงกับป้ายหรือค่าในช่องเพิ่มเติมหรือไม่ */
export function memberCustomFieldsMatchQuery(
  customFieldsJson: string | null | undefined,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  const fields = parseMemberCustomFieldsForPublic(customFieldsJson);
  return fields.some(
    (f) => f.label.toLowerCase().includes(needle) || f.value.toLowerCase().includes(needle),
  );
}

export function projectPublicMember(
  row: MemberRow,
  fields: ClubPortalMemberPublicFields,
): ClubPortalPublicMember {
  const name = (row.name || `${row.firstName} ${row.lastName}`.trim()).trim() || "—";
  const out: ClubPortalPublicMember = { id: row.id, name };
  if (fields.photo && row.photoUrl) out.photoUrl = row.photoUrl;
  if (fields.nickname && row.nickname.trim()) out.nickname = row.nickname.trim();
  if (fields.position && row.position.trim()) out.position = row.position.trim();
  if (fields.memberCode && row.memberCode.trim()) out.memberCode = row.memberCode.trim();
  if (fields.phone && row.phone.trim()) out.phone = row.phone.trim();
  if (fields.email && row.email.trim()) out.email = row.email.trim();
  if (fields.social && row.social.trim()) out.social = row.social.trim();
  if (fields.gender && row.gender.trim()) out.gender = row.gender.trim();
  if (fields.customFields) {
    const custom = parseMemberCustomFieldsForPublic(row.customFieldsJson);
    if (custom.length > 0) out.customFields = custom;
  }
  return out;
}
