"use client";

import { useEffect, useState } from "react";
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
  onRowsChange,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: ClubSubmissionRow[];
  fields?: ClubDynamicLinkField[];
  onRowsChange?: (rows: ClubSubmissionRow[]) => void;
}) {
  const [tab, setTab] = useState<ClubEventSubmissionsTab>("summary");
  const [localRows, setLocalRows] = useState(rows);

  useEffect(() => {
    if (open) setLocalRows(rows);
  }, [open, rows]);

  function patchRow(id: string, patch: Partial<ClubSubmissionRow>) {
    setLocalRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      onRowsChange?.(next);
      return next;
    });
  }

  return (
    <FormModal open={open} onClose={onClose} title={`คำตอบ · ${title}`} mobileCentered size="lg">
      {localRows.length === 0 ? (
        <ClubEventLinkSubmissionsView rows={localRows} fields={fields} tab={tab} onPatchSubmission={patchRow} />
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
            <p className="text-xs font-bold text-[#4d47b6]">รวม {localRows.length} คน</p>
          </div>
          <ClubEventLinkSubmissionsView
            rows={localRows}
            fields={fields}
            tab={tab}
            onPatchSubmission={patchRow}
          />
        </div>
      )}
    </FormModal>
  );
}
