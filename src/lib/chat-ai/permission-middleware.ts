import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { chatAiDisabledResponse, isChatAiDisabled } from "@/lib/chat-ai/feature";
import { prisma } from "@/lib/prisma";
import { computeDashboardAccessAllowed } from "@/lib/tokens/dashboard-access";

export type ChatAiAuthedUser = {
  id: string;
  username: string;
  /** ชื่อที่ใช้เรียกในแชท (fullName ถ้ามี ไม่เช่นนั้น username) */
  displayName: string;
  role: "USER" | "ADMIN";
  tokens: number;
  subscriptionType: "BUFFET" | "DAILY";
  subscriptionTier: "NONE" | "TIER_199" | "TIER_299" | "TIER_399" | "TIER_499" | "TIER_599";
  lastBuffetBillingMonth: string | null;
};

export async function requireChatAiPermission(): Promise<
  { ok: true; user: ChatAiAuthedUser } | { ok: false; response: NextResponse }
> {
  if (isChatAiDisabled()) {
    return { ok: false, response: chatAiDisabledResponse() };
  }

  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const row = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      tokens: true,
      subscriptionType: true,
      subscriptionTier: true,
      lastBuffetBillingMonth: true,
    },
  });
  if (!row) {
    return { ok: false, response: NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 }) };
  }
  if (!computeDashboardAccessAllowed(row)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "บัญชีถูกล็อคหรือมียอดค้าง — กรุณาชำระที่หน้าเติมโทเคน" },
        { status: 403 },
      ),
    };
  }
  const displayName = row.fullName?.trim() || row.username;
  return {
    ok: true,
    user: {
      id: row.id,
      username: row.username,
      displayName,
      role: row.role,
      tokens: row.tokens,
      subscriptionType: row.subscriptionType,
      subscriptionTier: row.subscriptionTier,
      lastBuffetBillingMonth: row.lastBuffetBillingMonth,
    },
  };
}
