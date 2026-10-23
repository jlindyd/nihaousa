import type { ChannelEntry, RawPlaylist, RawVideo } from "./types.ts";

const BASE = "https://www.googleapis.com/youtube/v3";

/** Each API call costs quota units. Default daily quota is 10,000. */
const COST = { list: 1 } as const;

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export class QuotaError extends Error {}

export class YouTube {
  key: string;
  /** Units spent in this run. */
  units = 0;

  constructor(key: string) {
    this.key = key;
  }

  private async get(path: string, params: Record<string, string | number | undefined>): Promise<Json> {
    const url = new URL(`${BASE}/${path}`);
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
    url.searchParams.set("key", this.key);
    const res = await fetch(url);
    this.units += COST.list;
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Json;
      const reason = body.error?.errors?.[0]?.reason ?? res.status;
      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") throw new QuotaError("YouTube API daily quota used up. Try again tomorrow.");
      throw new Error(`YouTube API ${path} failed: ${reason} ${body.error?.message ?? ""}`.trim());
    }
    return (await res.json()) as Json;
  }

  /** Turn a registry entry (id, handle or URL) into a channel id. Returns null if not found. */
  async resolveChannel(entry: ChannelEntry): Promise<{ id: string; title: string } | null> {
    if (entry.id) return { id: entry.id, title: entry.name };
    const ref = parseChannelRef(entry.handle ?? entry.url ?? "");
    if (!ref) return null;
    const params =
      ref.kind === "id" ? { id: ref.value } : ref.kind === "handle" ? { forHandle: ref.value } : { forUsername: ref.value };
    const data = await this.get("channels", { part: "snippet", ...params });
    const item = data.items?.[0];
    return item ? { id: item.id as string, title: item.snippet?.title as string } : null;
  }

  /**
   * Ids of videos in a playlist, in playlist order. With `since` (epoch ms) reading stops at the first
   * video published before it, which is right for an uploads playlist because it is newest first.
   */
  async playlistVideoIds(playlistId: string, limit = 5000, since?: number): Promise<string[]> {
    const ids: string[] = [];
    let pageToken: string | undefined;
    let reachedCutoff = false;
    do {
      let data: Json;
      try {
        data = await this.get("playlistItems", { part: "contentDetails", playlistId, maxResults: 50, pageToken });
      } catch (e) {
        if (e instanceof QuotaError) throw e;
        break; // private or deleted playlist
      }
      for (const it of data.items ?? []) {
        const published = Date.parse((it.contentDetails?.videoPublishedAt as string) ?? "");
        if (since != null && published < since) {
          reachedCutoff = true;
          break;
        }
        if (it.contentDetails?.videoId) ids.push(it.contentDetails.videoId as string);
      }
      pageToken = data.nextPageToken as string | undefined;
    } while (pageToken && ids.length < limit && !reachedCutoff);
    return ids;
  }

  /** Playlists a channel made, with their video ids. Small playlists are skipped. */
  async channelPlaylists(channelId: string, max: number): Promise<RawPlaylist[]> {
    const lists: RawPlaylist[] = [];
    let pageToken: string | undefined;
    do {
      const data = await this.get("playlists", { part: "snippet,contentDetails", channelId, maxResults: 50, pageToken });
      for (const it of data.items ?? []) {
        lists.push({
          id: it.id as string,
          title: (it.snippet?.title as string) ?? "",
          description: (it.snippet?.description as string) ?? "",
          itemCount: (it.contentDetails?.itemCount as number) ?? 0,
          videoIds: [],
        });
      }
      pageToken = data.nextPageToken as string | undefined;
    } while (pageToken);
    const chosen = lists.filter((p) => p.itemCount >= 3).sort((a, b) => b.itemCount - a.itemCount).slice(0, max);
    // A few hundred per playlist is enough to place recent videos in their series, and keeps quota use low.
    for (const p of chosen) p.videoIds = await this.playlistVideoIds(p.id, 300);
    return chosen;
  }

  /** Uploads of a channel, newest first, back to `since` (epoch ms). The uploads playlist id is the channel id with UC -> UU. */
  uploadIds(channelId: string, limit: number, since?: number): Promise<string[]> {
    return this.playlistVideoIds("UU" + channelId.slice(2), limit, since);
  }

  /** Details for videos, 50 per call. Videos YouTube does not return are omitted. */
  async videos(ids: string[]): Promise<Omit<RawVideo, "playlistIds">[]> {
    const out: Omit<RawVideo, "playlistIds">[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const data = await this.get("videos", { part: "snippet,contentDetails,status", id: ids.slice(i, i + 50).join(","), maxResults: 50 });
      for (const v of data.items ?? []) {
        const rr = v.contentDetails?.regionRestriction as { blocked?: string[]; allowed?: string[] } | undefined;
        out.push({
          id: v.id as string,
          title: (v.snippet?.title as string) ?? "",
          description: (v.snippet?.description as string) ?? "",
          publishedAt: (v.snippet?.publishedAt as string) ?? "",
          durationSec: parseDuration(v.contentDetails?.duration as string | undefined),
          tags: (v.snippet?.tags as string[]) ?? [],
          definition: v.contentDetails?.definition === "hd" ? "hd" : "sd",
          privacy: (v.status?.privacyStatus as string) ?? "",
          embeddable: v.status?.embeddable === true,
          blockedIn: rr?.blocked,
          allowedIn: rr?.allowed,
          madeForKids: v.status?.madeForKids === true,
          live: (v.snippet?.liveBroadcastContent as string) ?? "none",
        });
      }
    }
    return out;
  }
}

export function parseChannelRef(input: string): { kind: "id" | "handle" | "user"; value: string } | null {
  const s = input.trim();
  if (!s) return null;
  if (/^UC[\w-]{22}$/.test(s)) return { kind: "id", value: s };
  if (s.startsWith("@")) return { kind: "handle", value: s };
  try {
    const u = new URL(s);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0]?.startsWith("@")) return { kind: "handle", value: decodeURIComponent(parts[0]) };
    if (parts[0] === "channel" && parts[1]) return { kind: "id", value: parts[1] };
    if (parts[0] === "user" && parts[1]) return { kind: "user", value: parts[1] };
  } catch {
    /* not a URL */
  }
  return null;
}

/** ISO 8601 duration (PT1H2M3S) to seconds. */
export function parseDuration(iso: string | undefined): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!m) return 0;
  const [, d, h, mi, s] = m;
  return (Number(d ?? 0) * 24 + Number(h ?? 0)) * 3600 + Number(mi ?? 0) * 60 + Number(s ?? 0);
}
