type Listener = () => void;

/**
 * Pub/sub ในโปรเซสเดียวกันสำหรับแดชบอร์ดซักผ้า (SSE)
 * single Node / next start — หลาย instance ต้องใช้ Redis ภายหลัง
 */
const listenersByOwner = new Map<string, Set<Listener>>();

export function subscribeLaundryDashboard(ownerUserId: string, listener: Listener): () => void {
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

export function publishLaundryDashboard(ownerUserId: string): void {
  const set = listenersByOwner.get(ownerUserId);
  if (!set || set.size === 0) return;
  for (const listener of [...set]) {
    try {
      listener();
    } catch {
      /* ignore broken listener */
    }
  }
}
