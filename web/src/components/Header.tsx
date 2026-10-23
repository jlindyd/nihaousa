"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { REGIONS } from "@/lib/i18n";
import { toggleTheme } from "@/lib/ui";
import { AccountMenu } from "./AccountMenu";
import { BookmarkIcon, HomeIcon, MoonIcon, SearchIcon, TvIcon } from "./icons";
import { LangSwitch } from "./LangSwitch";
import { useLang } from "./LangProvider";

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
}

export function Header() {
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const active = useActive();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // The search box mirrors the address bar when the page changes. Read after load (not with useSearchParams),
  // so the header does not need a Suspense boundary and hydrates in the same pass as the rest of the page.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the browser's address bar
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [pathname]);

  const go = (q: string) => {
    const current = new URLSearchParams(window.location.search);
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q);
    const mode = current.get("mode");
    const region = current.get("region");
    if (mode) next.set("mode", mode);
    if (region) next.set("region", region);
    router.replace(`/search?${next.toString()}`);
  };

  const links = [
    { href: "/", label: t("home") },
    ...REGIONS.map((r) => ({ href: `/region/${r}`, label: t(r) })),
    { href: "/my", label: t("mylist") },
  ];

  return (
    <>
      <div className="top">
        <div className="wrap">
          <Link className="brand" href="/" aria-label="NiHaoUSA">
            <span className="logo-chip"><Image src="/logo.png" alt="" width={34} height={34} priority /></span>
            <span className="word">NiHaoUSA<small>你好 USA</small></span>
          </Link>
          <nav className="nav" aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}>{l.label}</Link>
            ))}
          </nav>
          <form
            className="searchbox"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (timer.current) clearTimeout(timer.current);
              go(String(new FormData(e.currentTarget).get("q") ?? ""));
            }}
          >
            <SearchIcon />
            <input
              name="q"
              type="search"
              autoComplete="off"
              aria-label={t("search")}
              placeholder={t("ph")}
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (timer.current) clearTimeout(timer.current);
                timer.current = setTimeout(() => go(v), 250);
              }}
            />
          </form>
          <LangSwitch />
          <button className="icon-btn hide-m" onClick={toggleTheme} aria-label={t("theme")}><MoonIcon /></button>
          <AccountMenu />
        </div>
      </div>

      <nav className="tabbar" aria-label="Main">
        <Link href="/" aria-current={active("/") ? "page" : undefined}><HomeIcon /><span>{t("home")}</span></Link>
        {REGIONS.map((r) => (
          <Link key={r} href={`/region/${r}`} aria-current={active(`/region/${r}`) ? "page" : undefined}><TvIcon /><span>{t(r)}</span></Link>
        ))}
        <Link href="/my" aria-current={active("/my") ? "page" : undefined}><BookmarkIcon /><span>{t("me")}</span></Link>
      </nav>
    </>
  );
}
