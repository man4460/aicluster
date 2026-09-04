type Listener = () => void;

/** Pub/sub ในโปรเซสเดียวกัน — แจ้ง desk เมื่อมีเช็กอิน/จ่ายของ/เซ็น (รวมจาก QR สาธารณะ) */
const listenersByEvent = new Map<string, Set<Listener>>();

export function subscribeClubEventDesk(eventId: string, listener: Listener): () => void {
  let set = listenersByEvent.get(eventId);
  if (!set) {
    set = new Set();
    listenersByEvent.set(eventId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listenersByEvent.delete(eventId);
  };
}

export function publishClubEventDesk(eventId: string): void {
  const set = listenersByEvent.get(eventId);
  if (!set || set.size === 0) return;
  for (const listener of [...set]) {
    try {
      listener();
    } catch {
      /* ignore */
    }
  }
}
