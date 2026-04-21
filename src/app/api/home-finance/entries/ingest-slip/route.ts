import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { writeSystemActivityLog } from "@/lib/audit-log";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { homeFinanceEntryPostSchema } from "@/lib/home-finance/entry-schema";
import { formatDbDateToYmd, parseYmdToDbDate } from "@/lib/home-finance/entry-date";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type AiSuggestion = {
  entryDate: string;
  type: "INCOME" | "EXPENSE";
  categoryKey: string;
  categoryLabel: string;
  title: string;
  amount: number;
  note: string | null;
  paymentMethod: string | null;
  billNumber: string | null;
  confidence: number;
  rawText: string;
  rawJson: unknown;
};

function todayBangkokYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function categoryLabelForKey(key: string): string {
  switch (key) {
    case "UTILITIES_ELECTRIC":
      return "ค่าไฟฟ้า";
    case "UTILITIES_WATER":
      return "ค่าน้ำประปา";
    case "VEHICLE_CAR":
      return "รถยนต์";
    case "VEHICLE_MOTORCYCLE":
      return "รถจักรยานยนต์";
    case "VEHICLE_SERVICE":
      return "ซ่อม/เข้าศูนย์รถ";
    case "GENERAL_FOOD":
      return "ค่าอาหาร";
    case "GENERAL_HOME_REPAIR":
      return "ค่าซ่อมบ้าน";
    case "GENERAL_SHOPPING":
      return "ของใช้ในบ้าน";
    case "GENERAL_HEALTH":
      return "สุขภาพ/ยา";
    case "GENERAL_EDUCATION":
      return "การศึกษา";
    case "GENERAL_TRAVEL":
      return "เดินทาง";
    case "GENERAL_INCOME":
      return "รายรับทั่วไป";
    default:
      return "อื่นๆ";
  }
}

function normalizeYmdLike(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const d = slash[1].padStart(2, "0");
    const m = slash[2].padStart(2, "0");
    return `${slash[3]}-${m}-${d}`;
  }
  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(/[,\s]/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function detectCategoryFromText(text: string, fallbackType: "INCOME" | "EXPENSE"): string {
  const t = text.toLowerCase();
  if (/(ไฟฟ้า|electric|mea|pea|การไฟฟ้า)/i.test(t)) return "UTILITIES_ELECTRIC";
  if (/(ค่าน้ำ|water|การประปา)/i.test(t)) return "UTILITIES_WATER";
  if (/(น้ำมัน|fuel|gas|diesel|เบนซิน)/i.test(t)) return "VEHICLE_CAR";
  if (/(ซ่อมรถ|service center|garage|อู่)/i.test(t)) return "VEHICLE_SERVICE";
  if (/(อาหาร|restaurant|grabfood|lineman|food)/i.test(t)) return "GENERAL_FOOD";
  if (fallbackType === "INCOME") return "GENERAL_INCOME";
  return "GENERAL_SHOPPING";
}

function amountFromRawText(text: string): number | null {
  const hit = text.match(/(?:จำนวนเงิน|ยอด|total|amount)[^\d]{0,12}([\d,]+(?:\.\d{1,2})?)/i);
  if (!hit) return null;
  return parseAmount(hit[1]);
}

function toClampedConfidence(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function normalizeAiSuggestion(
  aiRaw: unknown,
  fallbackType: "INCOME" | "EXPENSE",
  defaultCategoryKey: string,
): AiSuggestion {
  const root = aiRaw && typeof aiRaw === "object" ? (aiRaw as Record<string, unknown>) : {};
  const rawTextCandidate =
    typeof root.text === "string"
      ? root.text
      : typeof root.ocrText === "string"
        ? root.ocrText
        : typeof root.rawText === "string"
          ? root.rawText
          : "";
  const fields =
    root.fields && typeof root.fields === "object"
      ? (root.fields as Record<string, unknown>)
      : (root as Record<string, unknown>);

  const typeRaw = typeof fields.type === "string" ? fields.type.trim().toUpperCase() : "";
  const type: "INCOME" | "EXPENSE" = typeRaw === "INCOME" || typeRaw === "EXPENSE" ? typeRaw : fallbackType;

  const amount = parseAmount(fields.amount) ?? parseAmount(fields.total) ?? amountFromRawText(rawTextCandidate) ?? 0;
  const entryDate = normalizeYmdLike(fields.entryDate) ?? normalizeYmdLike(fields.date) ?? todayBangkokYmd();
  const titleRaw =
    typeof fields.title === "string"
      ? fields.title.trim()
      : typeof fields.merchant === "string"
        ? fields.merchant.trim()
        : "";
  const inferredCategory = detectCategoryFromText(
    `${titleRaw} ${rawTextCandidate}`.trim(),
    type,
  );
  const categoryKeyRaw = typeof fields.categoryKey === "string" ? fields.categoryKey.trim() : "";
  const categoryKey = categoryKeyRaw || defaultCategoryKey || inferredCategory;
  const billNumber =
    typeof fields.referenceNo === "string"
      ? fields.referenceNo.trim()
      : typeof fields.billNumber === "string"
        ? fields.billNumber.trim()
        : null;
  const paymentMethod = typeof fields.paymentMethod === "string" ? fields.paymentMethod.trim() : null;
  const noteCandidate = typeof fields.note === "string" ? fields.note.trim() : "";
  const confidence = toClampedConfidence(fields.confidence ?? root.confidence);

  return {
    entryDate,
    type,
    categoryKey,
    categoryLabel: categoryLabelForKey(categoryKey),
    title: titleRaw || (type === "INCOME" ? "รายการรายรับจากสลิป" : "รายการรายจ่ายจากสลิป"),
    amount,
    note: noteCandidate || null,
    paymentMethod: paymentMethod || null,
    billNumber: billNumber || null,
    confidence,
    rawText: rawTextCandidate.slice(0, 4000),
    rawJson: aiRaw,
  };
}

async function callOpenClaw(params: {
  fileBuffer: Buffer;
  mimeType: string;
  fallbackType: "INCOME" | "EXPENSE";
  defaultCategoryKey: string;
}): Promise<AiSuggestion> {
  const endpoint = process.env.OPENCLAW_URL?.trim() || process.env.OPENCLAW_API_URL?.trim() || "";
  const apiKey = process.env.OPENCLAW_API_KEY?.trim() || "";
  if (!endpoint) {
    return normalizeAiSuggestion({}, params.fallbackType, params.defaultCategoryKey);
  }
  const timeout = AbortSignal.timeout(25_000);
  const payload = {
    task: "receipt_ocr",
    mimeType: params.mimeType,
    imageBase64: params.fileBuffer.toString("base64"),
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "home_finance_receipt",
        schema: {
          type: "object",
          additionalProperties: true,
          properties: {
            fields: {
              type: "object",
              additionalProperties: true,
              properties: {
                amount: { type: ["string", "number", "null"] },
                total: { type: ["string", "number", "null"] },
                entryDate: { type: ["string", "null"] },
                date: { type: ["string", "null"] },
                title: { type: ["string", "null"] },
                merchant: { type: ["string", "null"] },
                referenceNo: { type: ["string", "null"] },
                paymentMethod: { type: ["string", "null"] },
                note: { type: ["string", "null"] },
                type: { type: ["string", "null"] },
                categoryKey: { type: ["string", "null"] },
                confidence: { type: ["number", "null"] },
              },
            },
            text: { type: ["string", "null"] },
            confidence: { type: ["number", "null"] },
          },
        },
      },
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: timeout,
    });
    const data = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok) {
      return normalizeAiSuggestion(data, params.fallbackType, params.defaultCategoryKey);
    }
    return normalizeAiSuggestion(data, params.fallbackType, params.defaultCategoryKey);
  } catch {
    return normalizeAiSuggestion({}, params.fallbackType, params.defaultCategoryKey);
  }
}

function parseType(raw: FormDataEntryValue | null): "INCOME" | "EXPENSE" {
  if (typeof raw === "string" && raw.trim().toUpperCase() === "INCOME") return "INCOME";
  return "EXPENSE";
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json(
      {
        error:
          ctx?.isStaff === true
            ? "บัญชีพนักงานไม่สามารถใช้รายรับ-รายจ่ายได้ — โปรดเข้าด้วยบัญชีเจ้าของ"
            : "ไม่มีสิทธิ์เข้าใช้",
      },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }
  const fallbackType = parseType(form.get("preferredType"));
  const defaultCategoryKey =
    typeof form.get("defaultCategoryKey") === "string" && form.get("defaultCategoryKey")!.toString().trim()
      ? form.get("defaultCategoryKey")!.toString().trim()
      : fallbackType === "INCOME"
        ? "GENERAL_INCOME"
        : "GENERAL_SHOPPING";

  const isPdf = file.type === "application/pdf";
  if (!isPdf && !ALLOWED_IMAGES.has(file.type)) {
    return NextResponse.json({ error: "รองรับ JPG PNG WEBP GIF หรือ PDF" }, { status: 400 });
  }
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (fileBuffer.length > maxBytes) {
    return NextResponse.json(
      { error: isPdf ? "PDF ใหญ่เกิน 5MB" : "ไฟล์ใหญ่เกิน 3MB" },
      { status: 400 },
    );
  }

  const ext = isPdf
    ? "pdf"
    : file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "home-finance");
  await mkdir(dir, { recursive: true });
  const filename = `${ctx.billingUserId.slice(0, 12)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dir, filename), fileBuffer);
  const imageUrl = `/uploads/home-finance/${filename}`;

  const ai = await callOpenClaw({
    fileBuffer,
    mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
    fallbackType,
    defaultCategoryKey,
  });

  const payload = {
    entryDate: ai.entryDate,
    type: ai.type,
    categoryKey: ai.categoryKey,
    categoryLabel: ai.categoryLabel,
    title: ai.title,
    amount: ai.amount,
    dueDate: null,
    billNumber: ai.billNumber,
    vehicleType: null,
    serviceCenter: null,
    paymentMethod: ai.paymentMethod,
    note: ai.note,
    attachmentUrls: [imageUrl],
    linkedUtilityId: null,
    linkedVehicleId: null,
  };

  const predictedEntryDate = parseYmdToDbDate(payload.entryDate);
  async function createExtractionAudit(args: {
    status: "SAVED" | "NEEDS_REVIEW" | "FAILED" | "DUPLICATE";
    entryId?: number | null;
    errorMessage?: string | null;
  }) {
    await prisma.homeFinanceSlipExtraction.create({
      data: {
        ownerUserId: ctx.billingUserId,
        entryId: args.entryId ?? null,
        sourceUrl: imageUrl,
        mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
        status: args.status,
        confidence: ai.confidence,
        predictedType: payload.type,
        predictedAmount: payload.amount > 0 ? payload.amount : null,
        predictedEntryDate,
        predictedTitle: payload.title,
        predictedBillNumber: payload.billNumber,
        predictedPaymentMethod: payload.paymentMethod,
        rawOcrText: ai.rawText || null,
        rawAiJson: ai.rawJson as Prisma.InputJsonValue,
        errorMessage: args.errorMessage ?? null,
      },
    });
  }

  const parsed = homeFinanceEntryPostSchema.safeParse(payload);
  if (!parsed.success) {
    await createExtractionAudit({
      status: "NEEDS_REVIEW",
      errorMessage: "AI อ่านข้อมูลไม่ครบ",
    });
    return NextResponse.json(
      {
        status: "needs_review",
        error: "AI อ่านข้อมูลไม่ครบ — โปรดตรวจทานก่อนบันทึก",
        imageUrl,
        suggestion: payload,
        confidence: ai.confidence,
      },
      { status: 422 },
    );
  }

  const entryDate = parseYmdToDbDate(parsed.data.entryDate);
  if (!entryDate) {
    await createExtractionAudit({
      status: "NEEDS_REVIEW",
      errorMessage: "AI อ่านวันที่ไม่ถูกต้อง",
    });
    return NextResponse.json(
      {
        status: "needs_review",
        error: "AI อ่านวันที่ไม่ถูกต้อง — โปรดตรวจทานก่อนบันทึก",
        imageUrl,
        suggestion: payload,
        confidence: ai.confidence,
      },
      { status: 422 },
    );
  }

  const duplicate = await prisma.homeFinanceEntry.findFirst({
    where: {
      ownerUserId: ctx.billingUserId,
      type: parsed.data.type,
      entryDate,
      amount: parsed.data.amount,
      ...(parsed.data.billNumber ? { billNumber: parsed.data.billNumber } : {}),
    },
    select: { id: true, entryDate: true, title: true, amount: true },
    orderBy: { id: "desc" },
  });
  if (duplicate) {
    await createExtractionAudit({
      status: "DUPLICATE",
      errorMessage: `พบรายการซ้ำกับ #${duplicate.id}`,
    });
    return NextResponse.json(
      {
        status: "needs_review",
        error: "พบรายการซ้ำใกล้เคียงในระบบ — โปรดตรวจทานก่อนบันทึก",
        imageUrl,
        suggestion: payload,
        confidence: ai.confidence,
        duplicateEntry: {
          id: duplicate.id,
          entryDate: formatDbDateToYmd(duplicate.entryDate),
          title: duplicate.title,
          amount: Number(duplicate.amount),
        },
      },
      { status: 409 },
    );
  }

  const attachmentJson: Prisma.InputJsonValue = [imageUrl];
  const row = await prisma.homeFinanceEntry.create({
    data: {
      ownerUserId: ctx.billingUserId,
      entryDate,
      type: parsed.data.type,
      categoryKey: parsed.data.categoryKey,
      categoryLabel: parsed.data.categoryLabel.trim().slice(0, 100),
      title: parsed.data.title.trim(),
      amount: parsed.data.amount,
      dueDate: null,
      billNumber: parsed.data.billNumber?.trim() || null,
      vehicleType: null,
      serviceCenter: null,
      paymentMethod: parsed.data.paymentMethod?.trim() || null,
      note: parsed.data.note?.trim() || null,
      slipImageUrl: imageUrl,
      attachmentUrls: attachmentJson,
      linkedUtilityId: null,
      linkedVehicleId: null,
    },
    select: { id: true, entryDate: true, title: true, amount: true },
  });

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "CREATE",
    modelName: "HomeFinanceEntry",
    payload: {
      id: row.id,
      ownerUserId: ctx.billingUserId,
      title: row.title,
      amount: Number(row.amount),
      via: "SLIP_AI_OPENCLAW",
      confidence: ai.confidence,
      ocrTextSample: ai.rawText.slice(0, 300),
    },
  });
  await createExtractionAudit({
    status: "SAVED",
    entryId: row.id,
  });

  return NextResponse.json({
    status: "saved",
    confidence: ai.confidence,
    imageUrl,
    suggestion: payload,
    entry: {
      id: row.id,
      entryDate: formatDbDateToYmd(row.entryDate),
      title: row.title,
      amount: Number(row.amount),
    },
  });
}
