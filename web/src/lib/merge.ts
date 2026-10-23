import type { Progress } from "./types.ts";

/** Lists: keep everything either side has. */
export const unionIds = (a: number[], b: number[]) => [...new Set([...a, ...b])];

/** Watch position: per show, the newer save wins. Saves without a time count as oldest. */
export function mergeProgress(a: Record<number, Progress>, b: Record<number, Progress>) {
  const out: Record<number, Progress> = { ...a };
  for (const [id, p] of Object.entries(b)) {
    const cur = out[Number(id)];
    if (!cur || (p.t ?? 0) > (cur.t ?? 0)) out[Number(id)] = p;
  }
  return out;
}

/** Last episode watched: per show, the higher number wins. */
export function mergeWatched(a: Record<number, number>, b: Record<number, number>) {
  const out: Record<number, number> = { ...a };
  for (const [id, n] of Object.entries(b)) out[Number(id)] = Math.max(out[Number(id)] ?? 0, n);
  return out;
}
