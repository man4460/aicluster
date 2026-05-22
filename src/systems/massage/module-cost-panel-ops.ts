import type {
  MassageCostCategory,
  MassageCostEntry,
  MassageCostEntryInput,
  MassageCostEntryPatch,
} from "@/systems/massage/MassageCostClient";

/** ฝังใน MassageCostPanel — ร้านนวดใช้ค่าเริ่มต้น หอพักส่ง implementation จาก dorm-cost-client */
export type ModuleCostPanelOps = {
  createCategory: (name: string) => Promise<MassageCostCategory>;
  updateCategory: (id: number, name: string) => Promise<MassageCostCategory>;
  deleteCategory: (id: number) => Promise<void>;
  createEntry: (input: MassageCostEntryInput) => Promise<MassageCostEntry>;
  updateEntry: (id: number, patch: MassageCostEntryPatch) => Promise<MassageCostEntry>;
  deleteEntry: (id: number) => Promise<void>;
  uploadSlip: (file: File) => Promise<string>;
};
