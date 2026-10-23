export type Lang = "s" | "t" | "e";
export type RegionId = "cn" | "tw" | "hk";
export type GenreId = "drama" | "variety" | "news" | "life" | "doc" | "kids";

/** [title, description, space-separated tags] */
export type Triple = [string, string, string];

export interface Show {
  id: number;
  r: RegionId;
  g: GenreId;
  hue: number;
  eps: number;
  isNew: boolean;
  year: number;
  /** 简体 */
  s: Triple;
  /** 繁體 */
  t: Triple;
  /** English */
  e: Triple;
  /** pinyin, used by search */
  pin: string;
  /** Set for shows produced by the YouTube ingest. Missing for sample data. */
  channel?: string;
  channelId?: string;
  /** YouTube video id whose thumbnail represents the show. */
  thumb?: string;
}

export interface Episode {
  number: number;
  minutes: number;
  /** ISO date */
  publishedAt: string;
  /** YouTube video id. Missing for sample data. */
  youtubeId?: string;
  /** Title as uploaded */
  title?: string;
}

export interface Progress {
  ep: number;
  pct: number;
  /** When it was saved (epoch ms). Lets the newer of two devices win. */
  t?: number;
}
