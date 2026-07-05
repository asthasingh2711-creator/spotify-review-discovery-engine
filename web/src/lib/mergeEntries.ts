export type AnyEntry = Record<string, any>;

export function entryKeyOf(e: AnyEntry) {
  return String(e.id ?? `${e.source ?? ""}|${e.url ?? ""}|${e.date ?? ""}|${e.title ?? ""}`);
}

export function mergeEntries(base: AnyEntry[], incoming: AnyEntry[]) {
  const seen = new Set<string>();
  const out: AnyEntry[] = [];

  for (const e of base) {
    const k = entryKeyOf(e);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(e);
    }
  }
  for (const e of incoming) {
    const k = entryKeyOf(e);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(e);
    }
  }
  return out;
}

