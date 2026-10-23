import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, MAX_AGE_DAYS } from "./build.ts";
import type { ChannelEntry, Generated, Overrides, RawChannel, RawVideo } from "./types.ts";
import { QuotaError, YouTube } from "./youtube.ts";

/** How far back a fetch reads when neither --days nor the channel's sinceDays says otherwise. */
const DEFAULT_DAYS = 30;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");
const RAW = join(DATA, "raw");
const files = {
  registry: join(DATA, "channels.json"),
  overrides: join(DATA, "overrides.json"),
  catalog: join(DATA, "catalog.generated.json"),
  review: join(DATA, "review.json"),
};

const HELP = `NiHaoUSA YouTube ingest

  npm run ingest -- resolve        find the channel id for every channel in data/channels.json
  npm run ingest -- fetch [name]   download recent uploads (last ${DEFAULT_DAYS} days) and video details (uses API quota)
                                   add --days 30 to reach further back; earlier videos are kept and refreshed
  npm run ingest -- build          filter, group into shows and episodes, write the catalog
  npm run ingest -- run            resolve + fetch + build
  npm run ingest -- health         re-check every known video (public, embeddable, allowed in the US)
  npm run ingest -- status         what is in the registry, how old the data is
  npm run ingest -- purge          delete raw data older than ${MAX_AGE_DAYS} days

Needs YOUTUBE_API_KEY in web/.env.local for resolve, fetch, health and run.
`;

const readJson = <T>(path: string, fallback: T): T => (existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback);
const writeJson = (path: string, data: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
};
const rawPath = (id: string) => join(RAW, `${id}.json`);
const loadRaw = (): Record<string, RawChannel> => {
  const out: Record<string, RawChannel> = {};
  if (existsSync(RAW)) for (const f of readdirSync(RAW)) if (f.endsWith(".json")) out[f.slice(0, -5)] = JSON.parse(readFileSync(join(RAW, f), "utf8"));
  return out;
};

function client(): YouTube {
  try {
    process.loadEnvFile(join(ROOT, ".env.local"));
  } catch {
    /* no .env.local */
  }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.error("Missing YOUTUBE_API_KEY. Create a key in Google Cloud Console (YouTube Data API v3) and put it in web/.env.local:\n  YOUTUBE_API_KEY=...");
    process.exit(1);
  }
  return new YouTube(key);
}

async function resolveChannels(yt: YouTube, registry: ChannelEntry[]) {
  for (const entry of registry) {
    if (entry.id) continue;
    const found = await yt.resolveChannel(entry);
    if (!found) {
      console.warn(`  ? ${entry.name}: could not find a channel for "${entry.handle ?? entry.url}"`);
      continue;
    }
    entry.id = found.id;
    console.log(`  ✓ ${entry.name} -> ${found.id} (${found.title})`);
  }
  writeJson(files.registry, registry);
}

async function fetchChannel(yt: YouTube, entry: ChannelEntry, days?: number) {
  if (!entry.id) throw new Error(`${entry.name} has no channel id. Run resolve first.`);
  const window = days ?? entry.sinceDays ?? DEFAULT_DAYS;
  console.log(`  ${entry.name} (last ${window} days)`);
  const uploads = await yt.uploadIds(entry.id, entry.maxUploads ?? 3000, Date.now() - window * 86_400_000);
  // A whole-channel show ignores playlists, so skip reading them. That is most of the quota for a short window.
  const playlists = entry.singleShow ? [] : await yt.channelPlaylists(entry.id, entry.maxPlaylists ?? 25);
  // Videos fetched on earlier runs are refreshed too, so the catalog grows run by run
  // and nothing stored is ever older than the 30-day limit.
  const earlier = existsSync(rawPath(entry.id)) ? (JSON.parse(readFileSync(rawPath(entry.id), "utf8")) as RawChannel).videos.filter((v) => !v.unavailable).map((v) => v.id) : [];
  // Playlists are only read to place these videos in series. Their older videos are not downloaded.
  const ids = [...new Set([...uploads, ...earlier])];
  const details = await yt.videos(ids);
  const inPlaylists = new Map<string, string[]>();
  for (const p of playlists) for (const v of p.videoIds) inPlaylists.set(v, [...(inPlaylists.get(v) ?? []), p.id]);
  const videos: RawVideo[] = details.map((v) => ({ ...v, playlistIds: inPlaylists.get(v.id) ?? [] }));
  const data: RawChannel = { fetchedAt: new Date().toISOString(), channelId: entry.id, title: entry.name, playlists, videos };
  writeJson(rawPath(entry.id), data);
  console.log(`    ${uploads.length} uploads, ${playlists.length} playlists, ${videos.length} videos`);
}

function runBuild(allowStale: boolean) {
  const registry = readJson<ChannelEntry[]>(files.registry, []);
  const result = build({ registry, raw: loadRaw(), overrides: readJson<Overrides>(files.overrides, {}), allowStale });
  writeJson(files.catalog, result.generated);
  writeJson(files.review, result.review);
  console.log("\nBuild finished");
  for (const s of result.summary) {
    const why = Object.entries(s.dropped).map(([k, n]) => `${n} ${k}`).join(", ");
    console.log(`  ${s.channel}: ${s.videos} videos, ${s.kept} kept${why ? ` (dropped: ${why})` : ""} -> ${s.shows} shows, ${s.episodes} episodes`);
  }
  console.log(`  Catalog: ${result.generated.shows.length} shows. Needs review: ${result.review.length} videos (data/review.json)`);
  if (result.stale.length) console.warn(`  Skipped, source data older than ${MAX_AGE_DAYS} days: ${result.stale.join(", ")}. Run fetch again.`);
}

async function health(yt: YouTube) {
  for (const [id, data] of Object.entries(loadRaw())) {
    const fresh = await yt.videos(data.videos.map((v) => v.id));
    const byId = new Map(fresh.map((v) => [v.id, v]));
    let gone = 0;
    data.videos = data.videos.map((v) => {
      const f = byId.get(v.id);
      if (!f) {
        gone++;
        return { ...v, unavailable: true };
      }
      return { ...v, ...f, playlistIds: v.playlistIds, unavailable: undefined };
    });
    data.fetchedAt = new Date().toISOString();
    writeJson(rawPath(id), data);
    console.log(`  ${data.title}: ${data.videos.length} checked, ${gone} gone`);
  }
}

function status() {
  const registry = readJson<ChannelEntry[]>(files.registry, []);
  const raw = loadRaw();
  console.log(`Channels in registry: ${registry.length}`);
  for (const e of registry) {
    const r = e.id ? raw[e.id] : undefined;
    const age = r ? Math.floor((Date.now() - Date.parse(r.fetchedAt)) / 86_400_000) : null;
    console.log(`  ${e.name} [${e.region}] ${e.id ?? "NOT RESOLVED"} ${r ? `${r.videos.length} videos, fetched ${age} days ago${age! > MAX_AGE_DAYS ? " (TOO OLD)" : ""}` : "not fetched"}`);
  }
  const catalog = readJson<Generated>(files.catalog, { generatedAt: null, shows: [], episodes: {} });
  console.log(`Catalog: ${catalog.shows.length} shows, built ${catalog.generatedAt ?? "never"}, expires ${catalog.expiresAt ?? "-"}`);
  console.log(`Review queue: ${readJson<unknown[]>(files.review, []).length} videos`);
}

function purge() {
  if (!existsSync(RAW)) return;
  for (const f of readdirSync(RAW)) {
    const p = join(RAW, f);
    if (Date.now() - statSync(p).mtimeMs > MAX_AGE_DAYS * 86_400_000) {
      rmSync(p);
      console.log(`  deleted ${f}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const dayFlag = args.indexOf("--days");
  const days = dayFlag >= 0 ? Number(args[dayFlag + 1]) : undefined;
  const arg = args.slice(1).find((a, i, all) => !a.startsWith("--") && all[i - 1] !== "--days");
  const registry = readJson<ChannelEntry[]>(files.registry, []);
  try {
    switch (cmd) {
      case "resolve": await resolveChannels(client(), registry); break;
      case "fetch": {
        const yt = client();
        await resolveChannels(yt, registry);
        const targets = registry.filter((e) => !arg || e.name.toLowerCase().includes(arg.toLowerCase()));
        console.log("Fetching");
        for (const e of targets) await fetchChannel(yt, e, days);
        console.log(`API units used: ${yt.units}`);
        break;
      }
      case "build": runBuild(process.argv.includes("--allow-stale")); break;
      case "run": {
        const yt = client();
        await resolveChannels(yt, registry);
        console.log("Fetching");
        for (const e of registry) await fetchChannel(yt, e, days);
        console.log(`API units used: ${yt.units}`);
        runBuild(false);
        break;
      }
      case "health": {
        const yt = client();
        await health(yt);
        console.log(`API units used: ${yt.units}. Run build to apply.`);
        break;
      }
      case "status": status(); break;
      case "purge": purge(); break;
      default: console.log(HELP);
    }
  } catch (e) {
    if (e instanceof QuotaError) console.error(e.message);
    else console.error(e);
    process.exit(1);
  }
}

main();
