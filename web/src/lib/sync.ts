import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeProgress, mergeWatched, unionIds as union } from "./merge";
import { KEYS, readValue, setSyncHandler, write, type StoreKey } from "./store";
import type { Progress } from "./types";

/** Which database column holds each local key. */
const COLUMN: Record<StoreKey, string> = {
  [KEYS.later]: "later",
  [KEYS.favs]: "favs",
  [KEYS.follow]: "follow",
  [KEYS.progress]: "progress",
  [KEYS.watched]: "watched",
};
const LAST_SEEN = "nh-synced";

interface Row {
  later: number[];
  favs: number[];
  follow: number[];
  progress: Record<number, Progress>;
  watched: Record<number, number>;
  updated_at: string;
}

const lastSeen = () => {
  try {
    return localStorage.getItem(LAST_SEEN);
  } catch {
    return null;
  }
};
const setLastSeen = (v: string) => {
  try {
    localStorage.setItem(LAST_SEEN, v);
  } catch {
    /* ignore */
  }
};

function applyRemote(row: Row) {
  write(KEYS.later, row.later, true);
  write(KEYS.favs, row.favs, true);
  write(KEYS.follow, row.follow, true);
  write(KEYS.progress, row.progress, true);
  write(KEYS.watched, row.watched, true);
  setLastSeen(row.updated_at);
}

/**
 * Starts keeping this browser and the signed-in account in step. Returns a function that stops it.
 *
 * On sign-in, what this device already holds (a guest list) is merged with the account's data and saved to both.
 * After that, each change is saved to the account, and coming back to the tab pulls changes made on another device.
 */
export function startSync(supabase: SupabaseClient, userId: string): () => void {
  let stopped = false;
  const pending = new Map<StoreKey, unknown>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    if (!pending.size || stopped) return;
    const payload: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
    for (const [key, value] of pending) payload[COLUMN[key]] = value;
    pending.clear();
    const { error } = await supabase.from("user_data").upsert(payload, { onConflict: "user_id" });
    if (!error) setLastSeen(payload.updated_at as string);
  };

  const pull = async (initial: boolean) => {
    const { data, error } = await supabase.from("user_data").select("*").eq("user_id", userId).maybeSingle();
    if (stopped || error) return;
    const remote = data as Row | null;
    if (initial) {
      const merged = {
        later: union(remote?.later ?? [], readValue<number[]>(KEYS.later, [])),
        favs: union(remote?.favs ?? [], readValue<number[]>(KEYS.favs, [])),
        follow: union(remote?.follow ?? [], readValue<number[]>(KEYS.follow, [])),
        progress: mergeProgress(remote?.progress ?? {}, readValue<Record<number, Progress>>(KEYS.progress, {})),
        watched: mergeWatched(remote?.watched ?? {}, readValue<Record<number, number>>(KEYS.watched, {})),
      };
      const updated_at = new Date().toISOString();
      applyRemote({ ...merged, updated_at });
      await supabase.from("user_data").upsert({ user_id: userId, ...merged, updated_at }, { onConflict: "user_id" });
    } else if (remote && remote.updated_at !== lastSeen() && !pending.size) {
      applyRemote(remote);
    }
  };

  setSyncHandler((key, value) => {
    pending.set(key, value);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 800);
  });
  void pull(true);

  const onVisible = () => {
    if (document.visibilityState === "visible") void pull(false);
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
    setSyncHandler(null);
  };
}
