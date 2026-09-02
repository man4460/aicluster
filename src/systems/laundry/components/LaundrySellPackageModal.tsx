"use client";

import { FormModal } from "@/components/ui/FormModal";

/** ขายแพ็กเหมา — placeholder จนกว่าจะ merge UI เต็ม */
export function LaundrySellPackageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  return (
    <FormModal open={open} onClose={onClose} title="ขายแพ็กเหมา" mobileCentered>
      <p className="text-sm text-[#66638c]">ฟีเจอร์ขายแพ็กเหมาจะเปิดใช้ในอัปเดตถัดไป</p>
    </FormModal>
  );
}
