import type { FootballTurfLiveEvent } from "@/systems/football-turf/lib/live-board-events";

type Listener = (event: FootballTurfLiveEvent) => void;

const GLOBAL_KEY = "__mawellFootballTurfLiveBoardListeners";

type GlobalLiveBoard = typeof globalThis & {
  [GLOBAL_KEY]?: Map<string, Set<Listener>>;
};

/**
 * Pub/sub ในโปรเซสเดียวกัน — เก็บบน globalThis
 * กัน Next.js โหลดโมดูลซ้ำ (stream vs action คนละ chunk) แล้ว Map ไม่เชื่อมกัน
 */
function listenersByOwner(): Map<string, Set<Listener>> {
  const g = globalThis as GlobalLiveBoard;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map();
  return g[GLOBAL_KEY]!;
}

export function subscribeFootballTurfLiveBoard(ownerUserId: string, listener: Listener): () => void {
  const map = listenersByOwner();
  let set = map.get(ownerUserId);
  if (!set) {
    set = new Set();
    map.set(ownerUserId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) map.delete(ownerUserId);
  };
}

export function publishFootballTurfLiveBoard(ownerUserId: string, event: FootballTurfLiveEvent): void {
  const set = listenersByOwner().get(ownerUserId);
  if (!set || set.size === 0) return;
  for (const listener of [...set]) {
    try {
      listener(event);
    } catch {
      /* ignore broken listener */
    }
  }
}

/** จำนวน listener ตอนนี้ (ดีบัก) */
export function footballTurfLiveBoardListenerCount(ownerUserId: string): number {
  return listenersByOwner().get(ownerUserId)?.size ?? 0;
}
