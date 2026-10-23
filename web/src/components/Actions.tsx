"use client";

import { useState } from "react";
import { KEYS, markWatched, useIdList } from "@/lib/store";
import { BellIcon, CheckIcon, FlagIcon, PlusIcon, ShareIcon } from "./icons";
import { useLang } from "./LangProvider";

/** Buttons on a show page banner: add to list, follow. */
export function ShowActions({ showId }: { showId: number }) {
  const { t } = useLang();
  const later = useIdList(KEYS.later);
  const favs = useIdList(KEYS.favs);
  const follow = useIdList(KEYS.follow);
  const saved = later.has(showId) || favs.has(showId);
  const following = follow.has(showId);
  return (
    <>
      <button className={`btn info ${saved ? "on" : ""}`} onClick={() => later.toggle(showId)}>
        {saved ? <CheckIcon /> : <PlusIcon />}{saved ? t("inList") : t("addList")}
      </button>
      <button className={`btn info ${following ? "on" : ""}`} onClick={() => follow.toggle(showId)}>
        <BellIcon />{following ? t("following") : t("follow")}
      </button>
    </>
  );
}

/** Buttons under the player: lists, mark watched, share, report. */
export function WatchActions({ showId, ep }: { showId: number; ep: number }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<"" | "marked" | "copied" | "reported">("");
  const later = useIdList(KEYS.later);
  const favs = useIdList(KEYS.favs);
  const follow = useIdList(KEYS.follow);
  const inList = later.has(showId) || favs.has(showId);
  const following = follow.has(showId);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNote("copied");
    } catch {
      setNote("copied");
    }
  };

  return (
    <>
      <div className="actions">
        <button className={`btn ${following ? "ghost" : ""}`} onClick={() => follow.toggle(showId)}>
          <BellIcon />{following ? t("following") : t("follow")}
        </button>
        <button className={`btn ghost ${inList ? "on" : ""}`} onClick={() => setOpen((o) => !o)}>
          {inList ? <CheckIcon /> : <PlusIcon />}{t("addList")}
        </button>
        <button className="btn ghost" onClick={() => { markWatched(showId, ep); setNote("marked"); }}>
          <CheckIcon />{note === "marked" ? t("markedW") : t("markW")}
        </button>
        <button className="btn ghost" onClick={share}><ShareIcon />{note === "copied" ? t("copied") : t("share")}</button>
        <button className="btn ghost" onClick={() => setNote("reported")}><FlagIcon />{note === "reported" ? t("reported") : t("report")}</button>
      </div>
      {open && (
        <div className="menu">
          <button aria-pressed={later.has(showId)} onClick={() => later.toggle(showId)}>{later.has(showId) ? "✓ " : ""}{t("later")}</button>
          <button aria-pressed={favs.has(showId)} onClick={() => favs.toggle(showId)}>{favs.has(showId) ? "✓ " : ""}{t("favs")}</button>
        </div>
      )}
    </>
  );
}
