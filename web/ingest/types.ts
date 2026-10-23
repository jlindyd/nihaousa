import type { Episode, GenreId, RegionId, Show } from "../src/lib/types.ts";

/** One row of data/channels.json. The registry is the only thing that decides what gets imported. */
export interface ChannelEntry {
  name: string;
  /** UC... id. Filled in by `resolve` when only a handle or URL is given. */
  id?: string;
  handle?: string;
  url?: string;
  region: RegionId;
  /** Force a genre. Otherwise it is guessed from titles. */
  genre?: GenreId;
  /** Script the channel writes titles in. Default: simplified for cn, traditional for tw and hk. */
  script?: "s" | "t";
  /** Drop videos shorter than this. Default 8. Use a lower value for news or kids. */
  minMinutes?: number;
  /** The whole channel is one show (a daily news program, for example). */
  singleShow?: boolean;
  /** Regular expressions. Videos whose title matches are dropped. */
  excludeTitle?: string[];
  /** Max playlists to read per channel. Default 25. */
  maxPlaylists?: number;
  /** Only read uploads from the last N days. Default 30. Later runs with a larger number catch up on older videos. */
  sinceDays?: number;
  /** Safety cap on uploads read in one run. Default 3000. */
  maxUploads?: number;
}

export interface RawVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSec: number;
  tags: string[];
  definition: "hd" | "sd";
  privacy: string;
  embeddable: boolean;
  blockedIn?: string[];
  allowedIn?: string[];
  madeForKids?: boolean;
  live: string;
  /** Playlists (of this channel) the video appears in. */
  playlistIds: string[];
  /** Set by the health check when YouTube no longer returns the video. */
  unavailable?: boolean;
}

export interface RawPlaylist {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  /** Video ids in playlist order. */
  videoIds: string[];
}

/** Everything fetched for one channel. Stored in data/raw and discarded after 30 days. */
export interface RawChannel {
  fetchedAt: string;
  channelId: string;
  title: string;
  playlists: RawPlaylist[];
  videos: RawVideo[];
}

export interface ReviewItem {
  videoId: string;
  title: string;
  channel: string;
  reason: string;
  /** Best guess, so a person can accept it quickly. */
  suggestion?: string;
}

export interface Generated {
  generatedAt: string | null;
  /** Oldest source data the catalog was built from, plus 30 days. */
  expiresAt?: string | null;
  shows: Show[];
  episodes: Record<string, Episode[]>;
}

/** Hand-made fixes. They survive every rebuild. */
export interface Overrides {
  /** Show keys (see data/review.json and the catalog) to hide. */
  hideShows?: string[];
  /** Video ids to hide. */
  hideVideos?: string[];
  /** Per show key: change fields. */
  shows?: Record<string, { name?: string; region?: RegionId; genre?: GenreId }>;
}
