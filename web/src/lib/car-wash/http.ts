import type { ComplaintStatus } from "@/systems/car-wash/car-wash-service";

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export function mapComplaintStatus(raw: string): ComplaintStatus {
  if (raw === "In Progress") return "In Progress";
  if (raw === "Resolved") return "Resolved";
  return "Pending";
}
