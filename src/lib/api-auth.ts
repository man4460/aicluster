import { getSession } from "@/lib/auth/session";

export async function requireSession() {
  const session = await getSession();
  if (!session) return { ok: false as const, status: 401 as const };
  return { ok: true as const, session };
}

export async function requireAdmin() {
  const r = await requireSession();
  if (!r.ok) return { ok: false as const, status: 401 as const };
  if (r.session.role !== "ADMIN") return { ok: false as const, status: 403 as const };
  return { ok: true as const, session: r.session };
}
