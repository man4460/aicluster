type TrialState = Map<string, Set<string>>;

const KEY = "__MAWELL_MODULE_TRIAL_STATE_V1__";

function getState(): TrialState {
  const g = globalThis as typeof globalThis & { [KEY]?: TrialState };
  g[KEY] ??= new Map<string, Set<string>>();
  return g[KEY]!;
}

export function listTrialModuleIds(userId: string): string[] {
  return [...(getState().get(userId) ?? new Set<string>())];
}

export function startTrial(userId: string, moduleId: string) {
  const s = getState();
  const set = s.get(userId) ?? new Set<string>();
  set.add(moduleId);
  s.set(userId, set);
}

export function stopTrial(userId: string, moduleId: string) {
  const s = getState();
  const set = s.get(userId);
  if (!set) return;
  set.delete(moduleId);
  if (set.size === 0) s.delete(userId);
}

