"use client";

import { FormModal } from "@/components/ui/FormModal";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { ClubEventPortalMemberSearch } from "@/systems/club-event/components/ClubEventPortalMemberSearch";

export function ClubEventMemberSearchPopup({
  open,
  onClose,
  slug,
  trialParam,
  clubName,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  trialParam?: string;
  clubName?: string;
}) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={clubName ? `ค้นหาสมาชิก · ${clubName}` : "ค้นหาสมาชิก"}
      size="md"
      footer={
        <button type="button" className={appTemplateOutlineButtonClass} onClick={onClose}>
          ปิด
        </button>
      }
    >
      <p className="mb-3 text-xs font-semibold text-[#66638c]">
        พิมพ์ชื่อ ชื่อเล่น หรือรหัสสมาชิก เพื่อค้นหา
      </p>
      <ClubEventPortalMemberSearch slug={slug} trialParam={trialParam} />
    </FormModal>
  );
}
