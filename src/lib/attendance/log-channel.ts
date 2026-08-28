/** เก็บใน attendance_logs.note — แยก in/out ด้วย | */
export const ATTENDANCE_LOG_CHANNEL = {
  IN_PUBLIC_CLASSIC: "in:public_classic",
  IN_PUBLIC_FACE: "in:public_face",
  IN_APP: "in:app",
  OUT_PUBLIC_CLASSIC: "out:public_classic",
  OUT_PUBLIC_FACE: "out:public_face",
  OUT_APP: "out:app",
} as const;

export type AttendanceLogChannelRow = {
  note?: string | null;
  actorUsername?: string | null;
  publicVisitorKind?: string | null;
  guestPhone?: string | null;
  checkInFacePhotoUrl?: string | null;
};

export function mergeAttendanceLogChannelNote(
  existing: string | null | undefined,
  segment: string,
): string {
  const parts = (existing ?? "")
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !p.startsWith(`${segment.split(":")[0]}:`));
  parts.push(segment);
  return parts.join("|").slice(0, 500);
}

export function attendanceCheckInMethodLabel(row: AttendanceLogChannelRow): string {
  const note = row.note ?? "";
  if (note.includes(ATTENDANCE_LOG_CHANNEL.IN_PUBLIC_FACE)) return "สแกนใบหน้า";
  if (note.includes(ATTENDANCE_LOG_CHANNEL.IN_PUBLIC_CLASSIC)) {
    return row.publicVisitorKind === "EXTERNAL_GUEST" ? "เช็คแบบเดิม · ภายนอก" : "เช็คแบบเดิม";
  }
  if (note.includes(ATTENDANCE_LOG_CHANNEL.IN_APP) || row.actorUsername) return "แอปเช็คอิน";
  if (note.includes("device:")) return "อุปกรณ์เช็คอิน";
  if (row.publicVisitorKind === "EXTERNAL_GUEST") return "เช็คแบบเดิม · ภายนอก";
  if (row.publicVisitorKind === "ROSTER_STAFF") return "เช็คแบบเดิม";
  if (row.guestPhone) return "เช็คแบบเดิม";
  return "เช็คเข้า";
}

export function attendanceCheckOutMethodLabel(row: AttendanceLogChannelRow): string {
  const note = row.note ?? "";
  if (note.includes(ATTENDANCE_LOG_CHANNEL.OUT_PUBLIC_FACE)) return "สแกนใบหน้า";
  if (note.includes(ATTENDANCE_LOG_CHANNEL.OUT_PUBLIC_CLASSIC)) {
    return row.publicVisitorKind === "EXTERNAL_GUEST" ? "เช็คแบบเดิม · ภายนอก" : "เช็คแบบเดิม";
  }
  if (note.includes(ATTENDANCE_LOG_CHANNEL.OUT_APP) || row.actorUsername) return "แอปเช็คเอาต";
  if (note.includes("device:")) return "อุปกรณ์เช็คเอาต";
  if (row.publicVisitorKind === "EXTERNAL_GUEST") return "เช็คแบบเดิม · ภายนอก";
  if (row.publicVisitorKind === "ROSTER_STAFF") return "เช็คแบบเดิม";
  if (row.guestPhone) return "เช็คแบบเดิม";
  return "เช็คออก";
}

export function attendanceMethodChipClass(method: string): string {
  if (method.includes("สแกนใบหน้า")) {
    return "bg-emerald-100 text-emerald-900 ring-emerald-200/70";
  }
  if (method.includes("แอป")) {
    return "bg-violet-100 text-violet-900 ring-violet-200/70";
  }
  if (method.includes("อุปกรณ์")) {
    return "bg-sky-100 text-sky-900 ring-sky-200/70";
  }
  return "bg-[#f4f2ff] text-[#4d47b6] ring-[#e8e6fc]";
}
