import assert from "node:assert/strict";
import { test } from "node:test";
import { build, stableId } from "./build.ts";
import { nameKey } from "./chinese.ts";
import { filterVideo } from "./filters.ts";
import { cleanPlaylistTitle, groupChannel, parseTitle, safeSlice, wellFormed } from "./group.ts";
import type { ChannelEntry, RawChannel, RawPlaylist, RawVideo } from "./types.ts";
import { parseChannelRef, parseDuration } from "./youtube.ts";

const NOW = Date.parse("2026-10-23T12:00:00Z");

function video(id: string, title: string, over: Partial<RawVideo> = {}): RawVideo {
  return {
    id, title, description: "", publishedAt: "2026-10-01T00:00:00Z", durationSec: 40 * 60, tags: [], definition: "hd",
    privacy: "public", embeddable: true, live: "none", playlistIds: [], ...over,
  };
}
const channel: ChannelEntry = { name: "测试频道", id: "UCtest", region: "cn" };

test("parseDuration reads ISO 8601", () => {
  assert.equal(parseDuration("PT42M10S"), 2530);
  assert.equal(parseDuration("PT1H2M3S"), 3723);
  assert.equal(parseDuration("PT45S"), 45);
  assert.equal(parseDuration(undefined), 0);
});

test("parseChannelRef accepts id, handle and URLs", () => {
  assert.deepEqual(parseChannelRef("@mangotv"), { kind: "handle", value: "@mangotv" });
  assert.deepEqual(parseChannelRef("https://www.youtube.com/@mangotv/videos"), { kind: "handle", value: "@mangotv" });
  assert.deepEqual(parseChannelRef("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv"), { kind: "id", value: "UCabcdefghijklmnopqrstuv" });
  assert.equal(parseChannelRef("not a channel"), null);
});

test("filters drop what should not become an episode", () => {
  const ok = video("a", "《古城往事》第3集");
  assert.equal(filterVideo(ok, channel).keep, true);
  assert.equal(filterVideo({ ...ok, embeddable: false }, channel).reason, "embedding disabled");
  assert.equal(filterVideo({ ...ok, privacy: "unlisted" }, channel).reason, "not public");
  assert.equal(filterVideo({ ...ok, blockedIn: ["US", "CA"] }, channel).reason, "blocked in the US");
  assert.equal(filterVideo({ ...ok, allowedIn: ["JP"] }, channel).reason, "not available in the US");
  assert.equal(filterVideo({ ...ok, durationSec: 90 }, channel).reason, "too short");
  assert.equal(filterVideo({ ...ok, durationSec: 5 * 3600 }, channel).reason, "too long");
  assert.equal(filterVideo({ ...ok, live: "live" }, channel).reason, "live or upcoming stream");
  assert.equal(filterVideo(video("b", "《古城往事》第3集 预告"), channel).reason, "trailer, clip or highlight");
  assert.equal(filterVideo(video("c", "Official Trailer"), channel).keep, false);
  assert.equal(filterVideo({ ...ok, durationSec: 5 * 60 }, { ...channel, minMinutes: 3 }).keep, true);
  assert.equal(filterVideo(video("d", "Sponsor 特辑"), { ...channel, excludeTitle: ["特辑"] }).reason, "channel exclude rule");
});

test("parseTitle finds show, episode and date", () => {
  assert.deepEqual(parseTitle("《古城往事》第12集"), { episode: 12, showName: "古城往事" });
  assert.equal(parseTitle("老友记事 第7期 | 2026-10-20").episode, 7);
  assert.equal(parseTitle("老友记事 第7期 | 2026-10-20").date, "2026-10-20");
  assert.equal(parseTitle("老友记事 第7期 | 2026-10-20").showName, "老友记事");
  assert.equal(parseTitle("Tea Restaurant Stories EP05 Full").episode, 5);
  assert.equal(parseTitle("夜话台北 #34").episode, 34);
  assert.equal(parseTitle("每日新闻 20261020").date, "2026-10-20");
  assert.equal(parseTitle("每日新闻 20261020").episode, undefined);
});

test("cleanPlaylistTitle and nameKey treat 简体 and 繁體 alike", () => {
  assert.equal(cleanPlaylistTitle("古城往事 全集"), "古城往事");
  assert.equal(cleanPlaylistTitle("Old Friends Full Episodes"), "Old Friends");
  assert.equal(nameKey("古城往事"), nameKey("古城往事"));
  assert.equal(nameKey("週末大廚房"), nameKey("周末大厨房"));
});

test("a series playlist groups numbered episodes into one show", () => {
  const vids = [1, 2, 3, 4].map((n) => video(`v${n}`, `古城往事 第${n}集`, { publishedAt: `2026-09-0${n}T00:00:00Z` }));
  const pl: RawPlaylist = { id: "PL1", title: "古城往事 全集", description: "", itemCount: 4, videoIds: vids.map((v) => v.id) };
  const r = groupChannel(channel, vids, [pl]);
  assert.equal(r.review.length, 0);
  assert.equal(r.shows.length, 1);
  assert.equal(r.shows[0].name, "古城往事");
  assert.equal(r.shows[0].confidence, "high");
  assert.deepEqual(r.shows[0].episodes.map((e) => e.number), [1, 2, 3, 4]);
});

test("without a playlist, titles carry the show name", () => {
  const vids = [1, 2, 3].map((n) => video(`w${n}`, `《老友记事》第${n}期`));
  const r = groupChannel(channel, vids, []);
  assert.equal(r.shows.length, 1);
  assert.equal(r.shows[0].episodes.length, 3);
});

test("unnumbered videos in a playlist are numbered by date, with medium confidence", () => {
  const vids = ["2026-09-03", "2026-09-01", "2026-09-02"].map((d, i) => video(`x${i}`, `幸福小院 今日一集`, { publishedAt: `${d}T00:00:00Z` }));
  const pl: RawPlaylist = { id: "PL2", title: "幸福小院", description: "", itemCount: 3, videoIds: vids.map((v) => v.id) };
  const r = groupChannel(channel, vids, [pl]);
  assert.equal(r.shows[0].confidence, "medium");
  assert.deepEqual(r.shows[0].episodes.map((e) => [e.number, e.video.id]), [[1, "x1"], [2, "x2"], [3, "x0"]]);
});

test("the same episode twice keeps the HD copy and remembers the other", () => {
  const a = video("hd", "《古城往事》第1集", { definition: "hd" });
  const b = video("sd", "《古城往事》第1集", { definition: "sd" });
  const c = video("e2", "《古城往事》第2集");
  const r = groupChannel(channel, [b, a, c], []);
  const ep1 = r.shows[0].episodes.find((e) => e.number === 1)!;
  assert.equal(ep1.video.id, "hd");
  assert.deepEqual(ep1.alt.map((v) => v.id), ["sd"]);
});

test("videos that cannot be placed go to review, not the catalog", () => {
  const lone = video("l1", "《孤单的节目》第1集");
  const unknown = video("u1", "!!");
  const r = groupChannel(channel, [lone, unknown], []);
  assert.equal(r.shows.length, 0);
  assert.equal(r.review.length, 2);
  assert.match(r.review.map((x) => x.reason).join("|"), /only 1 video|could not tell/);
});

test("a single-show channel becomes one show named after the channel", () => {
  const news: ChannelEntry = { name: "每日新闻", id: "UCnews", region: "tw", singleShow: true };
  const vids = ["2026-10-01", "2026-10-02", "2026-10-03"].map((d, i) => video(`n${i}`, `今日新闻 ${d}`, { publishedAt: `${d}T10:00:00Z`, durationSec: 20 * 60 }));
  const r = groupChannel(news, vids, []);
  assert.equal(r.shows.length, 1);
  assert.equal(r.shows[0].name, "每日新闻");
  assert.deepEqual(r.shows[0].episodes.map((e) => e.number), [1, 2, 3]);
});

test("one episode is enough for a channel marked as a single show, but not for a lone video elsewhere", () => {
  const program: ChannelEntry = { name: "木曜4超玩", id: "UCprog", region: "tw", singleShow: true };
  const one = [video("p1", "特別企劃 上集")];
  assert.equal(groupChannel(program, one, []).shows.length, 1);
  assert.equal(groupChannel({ ...program, singleShow: false }, [video("p2", "《孤單的節目》第1集")], []).shows.length, 0);
});

test("emoji decoration is stripped from show and playlist names", () => {
  assert.equal(cleanPlaylistTitle("🏄‍♀古城往事 全集🏄"), "古城往事");
  assert.equal(parseTitle("🔥《老友记事》🔥 第3集").showName, "老友记事");
});

test("cutting text never leaves half an emoji behind", () => {
  const text = "ab🏄‍♀cd";
  for (let n = 0; n <= 8; n++) assert.equal(safeSlice(text, n), wellFormed(safeSlice(text, n)));
  assert.equal(wellFormed("ok\ud83c"), "ok");
  assert.equal(JSON.stringify({ x: safeSlice("🏄🏄🏄", 2) }).includes("\\ud"), false);
});

test("a single-show channel ignores numbers in titles and follows the date", () => {
  const news: ChannelEntry = { name: "食尚玩家", id: "UCshow", region: "tw", singleShow: true };
  const vids = [
    video("s1", "台東美食 20261020(1/3)", { publishedAt: "2026-10-20T10:00:00Z" }),
    video("s2", "宜蘭美食 #納豆 20261021", { publishedAt: "2026-10-21T10:00:00Z" }),
    video("s3", "高雄美食 EP99 20261022", { publishedAt: "2026-10-22T10:00:00Z" }),
  ];
  const r = groupChannel(news, vids, []);
  assert.equal(r.review.length, 0);
  assert.deepEqual(r.shows[0].episodes.map((e) => [e.number, e.video.id]), [[1, "s1"], [2, "s2"], [3, "s3"]]);
});

function raw(videos: RawVideo[], playlists: RawPlaylist[] = [], fetchedAt = "2026-10-20T00:00:00Z"): RawChannel {
  return { fetchedAt, channelId: "UCtest", title: "测试频道", playlists, videos };
}

test("build produces shows with 简体, 繁體 and pinyin, and stable ids", () => {
  const tw: ChannelEntry = { name: "台灣測試", id: "UCtest", region: "tw" };
  const vids = [1, 2, 3].map((n) => video(`t${n}`, `《週末大廚房》第${n}集`, { description: "每集一道家常菜，步驟清楚。", publishedAt: `2026-10-0${n}T00:00:00Z` }));
  const a = build({ registry: [tw], raw: { UCtest: raw(vids) }, now: NOW });
  const b = build({ registry: [tw], raw: { UCtest: raw(vids) }, now: NOW });
  assert.equal(a.generated.shows.length, 1);
  const show = a.generated.shows[0];
  assert.equal(show.id, b.generated.shows[0].id);
  assert.equal(show.id, stableId(`UCtest:show:${nameKey("週末大廚房")}`));
  assert.equal(show.r, "tw");
  assert.equal(show.t[0], "週末大廚房");
  assert.equal(show.s[0], "周末大厨房");
  assert.equal(show.s[1], "每集一道家常菜，步骤清楚。");
  assert.match(show.pin, /zhoumodachufang/);
  assert.match(show.pin, /zhou mo da chu fang/);
  assert.match(show.pin, /zmdcf/);
  assert.equal(show.eps, 3);
  assert.equal(show.thumb, "t3");
  assert.deepEqual(a.generated.episodes[String(show.id)].map((e) => e.number), [3, 2, 1]);
  assert.equal(a.generated.episodes[String(show.id)][0].youtubeId, "t3");
});

test("build skips channels whose data is older than 30 days", () => {
  const vids = [1, 2].map((n) => video(`o${n}`, `《古城往事》第${n}集`));
  const r = build({ registry: [channel], raw: { UCtest: raw(vids, [], "2026-08-01T00:00:00Z") }, now: NOW });
  assert.equal(r.generated.shows.length, 0);
  assert.deepEqual(r.stale, ["测试频道"]);
  assert.equal(build({ registry: [channel], raw: { UCtest: raw(vids, [], "2026-08-01T00:00:00Z") }, now: NOW, allowStale: true }).generated.shows.length, 1);
});

test("overrides hide shows and videos, and move shows between regions", () => {
  const vids = [1, 2, 3].map((n) => video(`h${n}`, `《古城往事》第${n}集`));
  const key = `show:${nameKey("古城往事")}`;
  const hidden = build({ registry: [channel], raw: { UCtest: raw(vids) }, now: NOW, overrides: { hideShows: [key] } });
  assert.equal(hidden.generated.shows.length, 0);
  const fewer = build({ registry: [channel], raw: { UCtest: raw(vids) }, now: NOW, overrides: { hideVideos: ["h1"] } });
  assert.equal(fewer.generated.shows[0].eps, 2);
  const moved = build({ registry: [channel], raw: { UCtest: raw(vids) }, now: NOW, overrides: { shows: { [key]: { region: "hk", genre: "drama" } } } });
  assert.equal(moved.generated.shows[0].r, "hk");
  assert.equal(moved.generated.shows[0].g, "drama");
});
