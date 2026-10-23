"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Progress } from "./types";

/*
 * Guest storage: lists, follows and watch history live in this browser.
 * When accounts arrive this is the one file to point at the database instead.
 */
export const KEYS = {
  progress: "nh-progress",
  watched: "nh-watched",
  later: "nh-later",
  favs: "nh-favs",
  follow: "nh-follow",
} as const;
export type StoreKey = (typeof KEYS)[keyof typeof KEYS];

const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

type SyncHandler = (key: StoreKey, value: unknown) => void;
let syncHandler: SyncHandler | null = null;

/** Set by the sign-in sync while someone is signed in, so every local change is also saved to their account. */
export function setSyncHandler(fn: SyncHandler | null) {
  syncHandler = fn;
}

/** `silent` is for changes that came from the account itself, so they are not sent back. */
export function write(key: StoreKey, value: unknown, silent = false) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the app still works for this visit */
  }
  listeners.forEach((l) => l());
  if (!silent) syncHandler?.(key, value);
}

export function readValue<T>(key: StoreKey, fallback: T): T {
  try {
    const raw = read(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useStored<T>(key: StoreKey, fallback: T): T {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  // Callers pass module-level constants as `fallback`, so it is stable between renders.
  return useMemo(() => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);
}

const NO_IDS: number[] = [];
const NO_MAP: Record<number, never> = {};

export function useIdList(key: StoreKey) {
  const ids = useStored<number[]>(key, NO_IDS);
  const toggle = useCallback(
    (id: number) => {
      const cur: number[] = (() => {
        try {
          return JSON.parse(read(key) ?? "[]");
        } catch {
          return [];
        }
      })();
      write(key, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
    },
    [key],
  );
  return { ids, has: (id: number) => ids.includes(id), toggle };
}

export function useProgress() {
  return useStored<Record<number, Progress>>(KEYS.progress, NO_MAP);
}
export function useWatched() {
  return useStored<Record<number, number>>(KEYS.watched, NO_MAP);
}

export function saveProgress(showId: number, ep: number, pct: number) {
  const cur = JSON.parse(read(KEYS.progress) ?? "{}") as Record<number, Progress>;
  write(KEYS.progress, { ...cur, [showId]: { ep, pct, t: Date.now() } });
}
export function markWatched(showId: number, ep: number) {
  const cur = JSON.parse(read(KEYS.watched) ?? "{}") as Record<number, number>;
  write(KEYS.watched, { ...cur, [showId]: Math.max(cur[showId] ?? 0, ep) });
  const prog = JSON.parse(read(KEYS.progress) ?? "{}") as Record<number, Progress>;
  if (prog[showId]?.ep === ep) {
    const { [showId]: _drop, ...rest } = prog;
    void _drop;
    write(KEYS.progress, rest);
  }
}
