import type {
  BarberCostCategory,
  BarberCostEntry,
  BarberCostEntryInput,
  BarberCostEntryPatch,
} from "@/systems/barber/barber-cost-client";

/** ฝังใน BarberCostPanel — ร้านตัดผมใช้ค่าเริ่มต้น หอพักส่ง implementation จาก dorm-cost-client */
export type ModuleCostPanelOps = {
  createCategory: (name: string) => Promise<BarberCostCategory>;
  updateCategory: (id: number, name: string) => Promise<BarberCostCategory>;
  deleteCategory: (id: number) => Promise<void>;
  createEntry: (input: BarberCostEntryInput) => Promise<BarberCostEntry>;
  updateEntry: (id: number, patch: BarberCostEntryPatch) => Promise<BarberCostEntry>;
  deleteEntry: (id: number) => Promise<void>;
  uploadSlip: (file: File) => Promise<string>;
};
