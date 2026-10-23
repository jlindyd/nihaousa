"use client";

import { useEffect, useRef } from "react";
import { markWatched, saveProgress } from "@/lib/store";
import { PlayIcon } from "./icons";
import { useLang } from "./LangProvider";

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: { onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT as YTNamespace);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

interface Props {
  showId: number;
  ep: number;
  title: string;
  youtubeId?: string;
}

/**
 * YouTube's official embedded player, unmodified (nothing is drawn over it).
 * Saves the viewer's position so "Continue watching" works.
 * Sample episodes have no video yet and show a placeholder instead.
 */
export function Player({ showId, ep, title, youtubeId }: Props) {
  const { t } = useLang();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!youtubeId || !host.current) return;
    let player: YTPlayer | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const mount = document.createElement("div");
    host.current.appendChild(mount);

    const save = () => {
      if (!player) return;
      const dur = player.getDuration();
      if (dur > 0) saveProgress(showId, ep, Math.min(99, Math.round((player.getCurrentTime() / dur) * 100)));
    };

    loadApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(mount, {
        videoId: youtubeId,
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === 1 && !timer) timer = setInterval(save, 5000);
            if (e.data === 2) save();
            if (e.data === 0) markWatched(showId, ep);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      save();
      player?.destroy();
    };
  }, [youtubeId, showId, ep]);

  if (!youtubeId) {
    return (
      <div className="player">
        <div>
          <div className="play"><PlayIcon /></div>
          <b style={{ fontSize: 20 }}>{title}</b>
          <small>{t("playerNote")}</small>
        </div>
      </div>
    );
  }
  return <div className="player" ref={host} />;
}
