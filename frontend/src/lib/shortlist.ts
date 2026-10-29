// Client-side shortlists (favorites + up-to-3 comparison). These are navigation
// conveniences only — the source of truth for business data stays in MongoDB.

import { useCallback, useEffect, useState } from "react";

const FAV_KEY = "ac_favorites";
const CMP_KEY = "ac_compare";
export const MAX_COMPARE = 3;
const SHORTLIST_EVENT = "ac-shortlist";

function storageKey(list: "favorites" | "compare"): string {
  return list === "favorites" ? FAV_KEY : CMP_KEY;
}

function read(list: "favorites" | "compare"): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(list)) || "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(list: "favorites" | "compare", ids: string[]): void {
  localStorage.setItem(storageKey(list), JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(SHORTLIST_EVENT, { detail: list }));
}

export function useShortlist(list: "favorites" | "compare") {
  const [ids, setIds] = useState<string[]>(() => read(list));

  useEffect(() => {
    const sync = () => setIds(read(list));
    window.addEventListener(SHORTLIST_EVENT, sync);
    return () => window.removeEventListener(SHORTLIST_EVENT, sync);
  }, [list]);

  const toggle = useCallback(
    (id: string, max = 999) => {
      const current = read(list);
      if (current.includes(id)) {
        write(list, current.filter((x) => x !== id));
      } else if (current.length < max) {
        write(list, [...current, id]);
      }
    },
    [list],
  );

  const clear = useCallback(() => write(list, []), [list]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has, clear };
}
