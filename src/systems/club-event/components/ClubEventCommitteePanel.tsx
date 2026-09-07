"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  clubEventCardIconTileClass,
  clubEventTonedRowCardClass,
} from "@/systems/club-event/lib/card-tones";
import type { ClubCommitteeMember, ClubEventProfileDto } from "@/systems/club-event/lib/mappers";
import {
  clubEventFieldClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
} from "@/systems/club-event/lib/ui-tokens";

export function ClubEventCommitteePanel({
  initialCommittee,
  publicUrl,
}: {
  initialCommittee: ClubCommitteeMember[];
  publicUrl?: string | null;
}) {
  const notice = useAppNoticePopup();
  const [committee, setCommittee] = useState<ClubCommitteeMember[]>(initialCommittee);
  const [saving, setSaving] = useState(false);

  const saveCommittee = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/club-event/session/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ committee }),
      });
      const data = (await res.json()) as { profile?: ClubEventProfileDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.profile) setCommittee(data.profile.committee);
      notice.success("บันทึกกรรมการแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {notice.popup}
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            type="button"
            className={clubEventPrimaryButtonClass}
            disabled={saving}
            onClick={() => void saveCommittee()}
          >
            {saving ? "กำลังบันทึก…" : "บันทึกโครงสร้าง"}
          </button>
        </div>
        <div className="space-y-2">
          {committee.map((row, idx) => (
            <div key={idx} className={cn(clubEventTonedRowCardClass("indigo"), "sm:items-stretch")}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={clubEventCardIconTileClass("indigo")} aria-hidden>
                  <UserCog className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
                  <input
                    className={clubEventFieldClass}
                    placeholder="ตำแหน่ง"
                    value={row.role}
                    onChange={(e) => {
                      const next = [...committee];
                      next[idx] = { ...row, role: e.target.value };
                      setCommittee(next);
                    }}
                  />
                  <input
                    className={clubEventFieldClass}
                    placeholder="ชื่อ"
                    value={row.name}
                    onChange={(e) => {
                      const next = [...committee];
                      next[idx] = { ...row, name: e.target.value };
                      setCommittee(next);
                    }}
                  />
                  <input
                    className={clubEventFieldClass}
                    placeholder="เบอร์โทร"
                    value={row.phone ?? ""}
                    onChange={(e) => {
                      const next = [...committee];
                      next[idx] = { ...row, phone: e.target.value };
                      setCommittee(next);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className={cn(clubEventOutlineButtonClass, "w-full")}
            onClick={() => setCommittee([...committee, { role: "", name: "" }])}
          >
            + เพิ่มตำแหน่ง
          </button>
        </div>
        {publicUrl ? (
          <p className="text-xs text-[#5f5a8a]">
            พอร์ทัลสาธารณะ:{" "}
            <a
              href={publicUrl}
              className="font-semibold text-[#0000BF] underline"
              target="_blank"
              rel="noreferrer"
            >
              {publicUrl}
            </a>
          </p>
        ) : null}
      </div>
    </>
  );
}
