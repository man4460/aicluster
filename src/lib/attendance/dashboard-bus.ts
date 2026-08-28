import type { AttendanceDashboardSsePatch } from "@/lib/attendance/dashboard-types";

type Listener = (payload: AttendanceDashboardSsePatch) => void;

/** Pub/sub ในโปรเซสเดียวกัน — แดชบอร์ดเช็คอิน (single Node) */
const listenersByOwner = new Map<string, Set<Listener>>();

export function subscribeAttendanceDashboard(ownerUserId: string, listener: Listener): () => void {
  let set = listenersByOwner.get(ownerUserId);
  if (!set) {
    set = new Set();
    listenersByOwner.set(ownerUserId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listenersByOwner.delete(ownerUserId);
  };
}

export function publishAttendanceDashboard(ownerUserId: string, payload: AttendanceDashboardSsePatch): void {
  const set = listenersByOwner.get(ownerUserId);
  if (!set || set.size === 0) return;
  for (const listener of [...set]) {
    try {
      listener(payload);
    } catch {
      /* ignore broken listener */
    }
  }
}
