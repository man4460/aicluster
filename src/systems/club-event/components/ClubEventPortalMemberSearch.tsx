"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Phone, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ClubPortalPublicMember } from "@/systems/club-event/lib/portal-member-fields";
import {
  clubEventOutlineButtonClass,
  clubEventPortalFieldClass,
} from "@/systems/club-event/lib/ui-tokens";

const GENDER_LABEL: Record<string, string> = {
  MALE: "ชาย",
  FEMALE: "หญิง",
  OTHER: "อื่นๆ",
};

function normalizeLineId(raw: string): string {
  return raw
    .trim()
    .replace(/^line\s*[:：]\s*/i, "")
    .replace(/^@+/, "")
    .trim();
}

function MemberContactActions({
  phone,
  social,
  email,
}: {
  phone?: string;
  social?: string;
  email?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lineId = social ? normalizeLineId(social) : "";
  const phoneDigits = phone ? phone.replace(/\D/g, "") : "";

  const copyLine = useCallback(async () => {
    if (!lineId) return;
    try {
      await navigator.clipboard.writeText(lineId.startsWith("@") ? lineId : `@${lineId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, [lineId]);

  if (!phone && !social && !email) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {phoneDigits ? (
        <a
          href={`tel:${phoneDigits}`}
          className={cn(
            clubEventOutlineButtonClass,
            "inline-flex min-h-9 items-center gap-1.5 px-3 text-xs font-bold",
          )}
          aria-label={`โทร ${phone}`}
          title="โทร"
        >
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{phone}</span>
        </a>
      ) : null}

      {lineId ? (
        <>
          <a
            href={`https://line.me/ti/p/~${encodeURIComponent(lineId)}`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              clubEventOutlineButtonClass,
              "inline-flex min-h-9 items-center gap-1.5 px-3 text-xs font-bold text-[#06C755]",
            )}
            aria-label={`เปิด LINE ${lineId}`}
            title="เปิด LINE"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="max-w-[10rem] truncate">LINE {lineId}</span>
          </a>
          <button
            type="button"
            className={cn(
              clubEventOutlineButtonClass,
              "inline-flex min-h-9 min-w-9 items-center justify-center px-2 text-xs font-bold",
            )}
            onClick={() => void copyLine()}
            aria-label={copied ? "คัดลอก LINE แล้ว" : `คัดลอก LINE ${lineId}`}
            title={copied ? "คัดลอกแล้ว" : "คัดลอก LINE"}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </>
      ) : null}

      {email ? (
        <a
          href={`mailto:${email}`}
          className={cn(
            clubEventOutlineButtonClass,
            "inline-flex min-h-9 items-center gap-1.5 px-3 text-xs font-bold",
          )}
          aria-label={`อีเมล ${email}`}
          title="ส่งอีเมล"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="max-w-[12rem] truncate">{email}</span>
        </a>
      ) : null}
    </div>
  );
}

export function ClubEventPortalMemberSearch({
  slug,
  trialParam,
}: {
  slug: string;
  trialParam?: string;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<ClubPortalPublicMember[] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqSeq = useRef(0);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setMembers(null);
        setError(null);
        setLoading(false);
        return;
      }
      const seq = ++reqSeq.current;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (trialParam) params.set("t", trialParam);
        const res = await fetch(
          `/api/club-event/public/${encodeURIComponent(slug)}/members/search?${params}`,
        );
        const data = (await res.json()) as {
          members?: ClubPortalPublicMember[];
          error?: string;
        };
        if (seq !== reqSeq.current) return;
        if (!res.ok) throw new Error(data.error ?? "ค้นหาไม่สำเร็จ");
        setMembers(data.members ?? []);
      } catch (e) {
        if (seq !== reqSeq.current) return;
        setMembers(null);
        setError(e instanceof Error ? e.message : "ค้นหาไม่สำเร็จ");
      } finally {
        if (seq === reqSeq.current) setLoading(false);
      }
    },
    [slug, trialParam],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(q);
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, runSearch]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">ค้นหาสมาชิก</span>
        <div
          className={cn(
            clubEventPortalFieldClass,
            "flex !h-auto !min-h-[44px] !max-h-none items-center gap-2.5",
            "!border-white/55 !bg-white/45 !shadow-none backdrop-blur-md",
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-[#66638c]" aria-hidden />
          <input
            type="search"
            className="min-h-[40px] min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold leading-none text-[#1e1b4b] outline-none ring-0 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            placeholder="ค้นหาชื่อ · ชื่อเล่น · รหัสสมาชิก…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            aria-busy={loading}
          />
        </div>
      </label>

      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {q.trim().length > 0 && q.trim().length < 2 ? (
        <p className="text-sm font-semibold text-[#66638c]">พิมพ์อย่างน้อย 2 ตัวอักษร</p>
      ) : null}

      {loading && members === null ? (
        <p className="text-sm font-semibold text-[#66638c]">กำลังค้นหา…</p>
      ) : null}

      {members && members.length === 0 ? (
        <p className="text-sm font-semibold text-[#66638c]">ไม่พบสมาชิกที่ตรงกับคำค้น</p>
      ) : null}

      {members && members.length > 0 ? (
        <ul className="divide-y divide-slate-200/80 rounded-2xl border border-slate-200/80 bg-white/70">
          {members.map((m) => (
            <li key={m.id} className="flex items-start gap-3 p-3 sm:p-4">
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.photoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-[#4d47b6]"
                  aria-hidden
                >
                  {(m.name || "?").slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-bold text-[#1e1b4b]">{m.name}</p>
                {m.nickname ? (
                  <p className="text-sm font-semibold text-[#66638c]">ชื่อเล่น: {m.nickname}</p>
                ) : null}
                {m.position ? (
                  <p className="text-sm font-semibold text-[#66638c]">{m.position}</p>
                ) : null}
                {m.memberCode ? (
                  <p className="text-sm font-semibold text-[#66638c]">รหัส: {m.memberCode}</p>
                ) : null}
                {m.gender ? (
                  <p className="text-sm font-semibold text-[#66638c]">
                    เพศ: {GENDER_LABEL[m.gender] ?? m.gender}
                  </p>
                ) : null}
                <MemberContactActions phone={m.phone} social={m.social} email={m.email} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
