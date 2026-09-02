"use client";

import { FormModal } from "@/components/ui/FormModal";
import { LaundryCheckInForm } from "@/systems/laundry/components/LaundryCheckInForm";

export type LaundryCheckInModalProps = {
  open: boolean;
  onClose: () => void;
  onRequestSell?: () => void;
  onDeductSuccess?: (detail: { remainingSessions: number; packageName: string }) => void;
};

export function LaundryCheckInModal({ open, onClose, onRequestSell, onDeductSuccess }: LaundryCheckInModalProps) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="รับฝาก / หักแพ็กสมาชิก"
      description="ค้นหาเบอร์ลูกค้า แล้วหักครั้งจากแพ็กเหมา"
      size="lg"
    >
      <LaundryCheckInForm
        variant="modal"
        active={open}
        onRequestSell={onRequestSell}
        onDeductSuccess={onDeductSuccess}
      />
    </FormModal>
  );
}
