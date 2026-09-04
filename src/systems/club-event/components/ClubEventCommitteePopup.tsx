"use client";

import { FormModal } from "@/components/ui/FormModal";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import type { ClubCommitteeMember } from "@/systems/club-event/lib/mappers";

export function ClubEventCommitteePopup({
  open,
  onClose,
  committee,
  clubName,
}: {
  open: boolean;
  onClose: () => void;
  committee: ClubCommitteeMember[];
  clubName?: string;
}) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={clubName ? `คณะกรรมการ · ${clubName}` : "คณะกรรมการ"}
      size="md"
      footer={
        <button type="button" className={appTemplateOutlineButtonClass} onClick={onClose}>
          ปิด
        </button>
      }
    >
      {committee.length === 0 ? (
        <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีรายชื่อคณะกรรมการ</p>
      ) : (
        <ul className="space-y-3">
          {committee.map((m, i) => (
            <li
              key={`${m.role}-${m.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3"
            >
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0000BF]/10 text-sm font-black text-[#0000BF]">
                  {(m.name || "?").slice(0, 1)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#1e1b4b]">{m.name}</p>
                <p className="truncate text-xs font-semibold text-[#66638c]">{m.role}</p>
                {m.phone ? <p className="truncate text-xs text-[#4d47b6]">{m.phone}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </FormModal>
  );
}
