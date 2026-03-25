import { AsyncLocalStorage } from "node:async_hooks";

type AuditContext = {
  actorUserId?: string;
};

const storage = new AsyncLocalStorage<AuditContext>();

export function setAuditActor(userId: string) {
  const current = storage.getStore() ?? {};
  storage.enterWith({ ...current, actorUserId: userId });
}

export function getAuditActor(): string | undefined {
  return storage.getStore()?.actorUserId;
}
