import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";

const bodySchema = z.object({
  amountBaht: z.number().optional(),
});

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await req.json();
  } catch {
    // ignore
  }
  bodySchema.safeParse({});

  return NextResponse.json(
    {
      ok: false,
      error:
        "ไม่มีแพ็กเหมาทั้งระบบแล้ว — สมัครรายโมดูลที่หน้า ระบบทั้งหมด (1 บาท/วัน หรือแพ็ก 199 ต่อโมดูล)",
    },
    { status: 410 },
  );
}
