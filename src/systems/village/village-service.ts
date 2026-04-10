export type VillageHouseFeeCycle = "MONTHLY" | "SEMI_ANNUAL" | "ANNUAL";

export type VillageProfile = {
  id: number;
  display_name: string | null;
  address: string | null;
  contact_phone: string | null;
  prompt_pay_phone: string | null;
  payment_channels_note: string | null;
  default_monthly_fee: number;
  due_day_of_month: number;
};

export type VillageHouse = {
  id: number;
  house_no: string;
  plot_label: string | null;
  owner_name: string | null;
  phone: string | null;
  monthly_fee_override: number | null;
  fee_cycle: VillageHouseFeeCycle;
  is_active: boolean;
  sort_order: number;
  residents: VillageResident[];
};

export type VillageResident = {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  is_primary: boolean;
  is_active: boolean;
};

export type VillageFeeRow = {
  id: number;
  house_id: number;
  house_no: string;
  owner_name: string | null;
  fee_cycle: VillageHouseFeeCycle;
  year_month: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  note: string | null;
  paid_at: string | null;
};

export type VillageSlip = {
  id: number;
  house_id: number;
  house_no: string;
  owner_name: string | null;
  year_month: string;
  amount: number;
  slip_image_url: string;
  status: string;
  reviewer_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  fee_row_id: number | null;
};

export type VillageOverview = {
  village_name: string | null;
  default_monthly_fee: number;
  due_day_of_month: number;
  bangkok_year: number;
  current_year_month: string;
  active_houses: number;
  resident_count: number;
  pending_slips: number;
  month_fee_rows: number;
  month_total_due: number;
  month_total_paid: number;
  month_paid_houses: number;
  month_pending_or_partial_rows: number;
  month_collection_percent: number;
  ytd_total_due: number;
  ytd_total_paid: number;
  ytd_collection_percent: number;
  /** ม.ค.–ธ.ค. ของปี bangkok_year (เดือนที่ไม่มีบิลเป็น 0) */
  twelve_month_sparkline: { year_month: string; total_due: number; total_paid: number }[];
};

export type VillageExportKind = "fees" | "slips" | "residents" | "annual_summary";

export function villageFeeCycleLabelTh(cycle: VillageHouseFeeCycle): string {
  switch (cycle) {
    case "MONTHLY":
      return "รายเดือน";
    case "SEMI_ANNUAL":
      return "รายหกเดือน (ม.ค./ก.ค.)";
    case "ANNUAL":
      return "รายปี (ม.ค.)";
    default:
      return cycle;
  }
}

export function createVillageSessionApiRepository() {
  async function parse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("bad_json");
    }
    if (!res.ok) {
      const msg = typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : res.statusText;
      throw new Error(msg || "request_failed");
    }
    return data as T;
  }

  return {
    async getProfile(): Promise<{ profile: VillageProfile }> {
      const res = await fetch("/api/village/session/profile", { credentials: "include" });
      return parse(res);
    },
    async putProfile(body: Record<string, unknown>): Promise<{ profile: VillageProfile }> {
      const res = await fetch("/api/village/session/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parse(res);
    },
    async getHouses(): Promise<{ houses: VillageHouse[] }> {
      const res = await fetch("/api/village/session/houses", { credentials: "include" });
      return parse(res);
    },
    async postHouse(body: Record<string, unknown>): Promise<{ house: VillageHouse }> {
      const res = await fetch("/api/village/session/houses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parse(res);
    },
    async patchHouse(id: number, body: Record<string, unknown>): Promise<{ house: VillageHouse }> {
      const res = await fetch(`/api/village/session/houses/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parse(res);
    },
    async deleteHouse(id: number): Promise<void> {
      const res = await fetch(`/api/village/session/houses/${id}`, { method: "DELETE", credentials: "include" });
      await parse(res);
    },
    async postResident(houseId: number, body: Record<string, unknown>): Promise<{ resident: VillageResident }> {
      const res = await fetch(`/api/village/session/houses/${houseId}/residents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parse(res);
    },
    async patchResident(id: number, body: Record<string, unknown>): Promise<{ resident: VillageResident }> {
      const res = await fetch(`/api/village/session/residents/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parse(res);
    },
    async deleteResident(id: number): Promise<void> {
      const res = await fetch(`/api/village/session/residents/${id}`, { method: "DELETE", credentials: "include" });
      await parse(res);
    },
    async getFeeRows(
      yearMonth: string,
      status?: string,
    ): Promise<{ default_monthly_fee: number; due_day_of_month: number; fee_rows: VillageFeeRow[] }> {
      const q = new URLSearchParams({ year_month: yearMonth });
      if (status) q.set("status", status);
      const res = await fetch(`/api/village/session/fee-rows?${q}`, { credentials: "include" });
      return parse(res);
    },
    async generateFeeRows(yearMonth: string): Promise<{ fee_rows: VillageFeeRow[] }> {
      const res = await fetch("/api/village/session/fee-rows", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year_month: yearMonth }),
      });
      return parse(res);
    },
    async patchFeeRow(id: number, body: Record<string, unknown>): Promise<{ fee_row: VillageFeeRow }> {
      const res = await fetch(`/api/village/session/fee-rows/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parse(res);
    },
    async getSlips(q: { status?: string; year_month?: string }): Promise<{ slips: VillageSlip[] }> {
      const sp = new URLSearchParams();
      if (q.status) sp.set("status", q.status);
      if (q.year_month) sp.set("year_month", q.year_month);
      const res = await fetch(`/api/village/session/slips?${sp}`, { credentials: "include" });
      return parse(res);
    },
    async postSlip(form: FormData): Promise<{ slip: { id: number } }> {
      const res = await fetch("/api/village/session/slips", { method: "POST", credentials: "include", body: form });
      return parse(res);
    },
    async patchSlip(id: number, body: { status: "APPROVED" | "REJECTED"; reviewer_note?: string | null }) {
      const res = await fetch(`/api/village/session/slips/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parse(res);
    },
    async getOverview(): Promise<VillageOverview> {
      const res = await fetch("/api/village/session/overview", { credentials: "include" });
      return parse(res);
    },
    async getSummary(year: number) {
      const res = await fetch(`/api/village/session/summary?year=${year}`, { credentials: "include" });
      return parse(res);
    },
    exportUrl(kind: VillageExportKind, year?: number): string {
      const sp = new URLSearchParams({ kind });
      if (kind !== "residents") {
        if (year == null || !Number.isFinite(year)) {
          throw new Error("ต้องระบุปีสำหรับ export นี้");
        }
        sp.set("year", String(year));
      }
      return `/api/village/session/export?${sp}`;
    },
  };
}
