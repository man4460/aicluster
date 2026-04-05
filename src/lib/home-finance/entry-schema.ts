import { z } from "zod";

/** ข้อความแรกจาก Zod 4 ให้ผู้ใช้ / ล็อกดีบัก */
export function zodFirstIssueMessage(err: z.ZodError): string {
  const i = err.issues[0];
  if (!i) return "ข้อมูลไม่ถูกต้อง";
  const head = i.path.length ? `${String(i.path[0])}: ` : "";
  return `${head}${i.message}`;
}

const ymdRequired = z.preprocess(
  (v: unknown) => (typeof v === "string" ? v.trim() : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
);

/** POST: ไม่มี / null / "" = ไม่มีวันครบกำหนด */
const ymdPostNullable = z.preprocess((v: unknown) => {
  if (v === "" || v === undefined || v === null) return null;
  return typeof v === "string" ? v.trim() : v;
}, z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]));

/** PATCH: undefined = ไม่แก้, null | "" = ล้าง */
const ymdPatchOptional = z.preprocess((v: unknown) => {
  if (v === undefined) return undefined;
  if (v === "" || v === null) return null;
  return typeof v === "string" ? v.trim() : v;
}, z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional());

function optStrPost(max: number) {
  return z.preprocess((v: unknown) => {
    if (v === "" || v === undefined || v === null) return null;
    return v;
  }, z.union([z.string().max(max), z.null()]));
}

function optStrPatch(max: number) {
  return z.preprocess((v: unknown) => {
    if (v === undefined) return undefined;
    if (v === "" || v === null) return null;
    return v;
  }, z.union([z.string().max(max), z.null()]).optional());
}

const optIdPost = z.preprocess((v: unknown) => {
  if (v === "" || v === undefined || v === null) return null;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  return v;
}, z.union([z.number().int().positive(), z.null()]));

const optIdPatch = z.preprocess((v: unknown) => {
  if (v === undefined) return undefined;
  if (v === "" || v === null) return null;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  return v;
}, z.union([z.number().int().positive(), z.null()]).optional());

/** รองรับตัวเลขจาก JSON เป็นตัวเลขหรือสตริง (คั่นหลักพัน) */
function amountFromUnknown(v: unknown): unknown {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = v.replace(/,/g, "").replace(/\s/g, "").trim();
    if (t === "") return v;
    const n = Number(t);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}

const amountPost = z.preprocess(amountFromUnknown, z.number().finite().positive().max(9_999_999.99));

const amountPatch = z.preprocess(amountFromUnknown, z.number().finite().positive().max(9_999_999.99).optional());

export const homeFinanceEntryPostSchema = z.object({
  entryDate: ymdRequired,
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryKey: z.string().min(2).max(64),
  categoryLabel: z.string().min(1).max(100),
  title: z.string().min(1).max(160),
  amount: amountPost,
  dueDate: ymdPostNullable,
  billNumber: optStrPost(100),
  vehicleType: optStrPost(40),
  serviceCenter: optStrPost(160),
  paymentMethod: optStrPost(40),
  note: optStrPost(600),
  slipImageUrl: optStrPost(512),
  linkedUtilityId: optIdPost,
  linkedVehicleId: optIdPost,
});

export const homeFinanceEntryPatchSchema = z.object({
  entryDate: ymdRequired.optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryKey: z.string().min(2).max(64).optional(),
  categoryLabel: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(160).optional(),
  amount: amountPatch,
  dueDate: ymdPatchOptional,
  billNumber: optStrPatch(100),
  vehicleType: optStrPatch(40),
  serviceCenter: optStrPatch(160),
  paymentMethod: optStrPatch(40),
  note: optStrPatch(600),
  slipImageUrl: optStrPatch(512),
  linkedUtilityId: optIdPatch,
  linkedVehicleId: optIdPatch,
});
