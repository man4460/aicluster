export function mqttTopicMatchesFilter(filter: string, topic: string): boolean {
  const fp = filter.split("/");
  const tp = topic.split("/");
  let i = 0;
  for (; i < fp.length; i += 1) {
    const f = fp[i];
    const t = tp[i];
    if (f === "#") return i === fp.length - 1;
    if (f === "+") {
      if (t == null) return false;
      continue;
    }
    if (t == null || f !== t) return false;
  }
  return i === tp.length;
}
