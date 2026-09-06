"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import type { ClubDynamicLinkField } from "@/systems/club-event/lib/mappers";
import type { ClubSubmissionRow } from "@/systems/club-event/lib/submission-summary";
import {
  ClubEventLinkSubmissionsView,
  type ClubEventSubmissionsTab,
} from "@/systems/club-event/components/ClubEventLinkSubmissionsView";
import {
  clubEventFilterChipClass,
  clubEventFilterChipShellClass,
} from "@/systems/club-event/lib/ui-tokens";

export function ClubEventLinkSubmissionsModal({
  open,
  onClose,
  title,
  rows,
  fields = [],
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: ClubSubmissionRow[];
  fields?: ClubDynamicLinkField[];
}) {
  const [tab, setTab] = useState<ClubEventSubmissionsTab>("summary");

  return (
    <FormModal open={open} onClose={onClose} title={`คำตอบ · ${title}`} mobileCentered size="lg">
      {rows.length === 0 ? (
        <ClubEventLinkSubmissionsView rows={rows} fields={fields} tab={tab} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <nav className={clubEventFilterChipShellClass} role="tablist" aria-label="มุมมองคำตอบ">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "summary"}
                className={clubEventFilterChipClass(tab === "summary")}
                onClick={() => setTab("summary")}
              >
                สรุปตามคำถาม
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "list"}
                className={clubEventFilterChipClass(tab === "list")}
                onClick={() => setTab("list")}
              >
                รายการรายคน
              </button>
            </nav>
            <p className="text-xs font-bold text-[#4d47b6]">รวม {rows.length} คน</p>
          </div>
          <ClubEventLinkSubmissionsView rows={rows} fields={fields} tab={tab} />
        </div>
      )}
    </FormModal>
  );
}
