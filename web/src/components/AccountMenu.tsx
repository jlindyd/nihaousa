"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useLang } from "./LangProvider";
import { UserIcon } from "./icons";

/** Top-right account control: "Sign in" when signed out, an avatar with a small menu when signed in. */
export function AccountMenu() {
  const { t } = useLang();
  const { configured, loading, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!configured) {
    return <Link className="icon-btn hide-m" href="/my" aria-label={t("mylist")}><UserIcon /></Link>;
  }
  if (loading) return <span className="icon-btn hide-m" aria-hidden="true" />;
  if (!user) {
    return <Link className="signin-link hide-m" href={`/signin?next=${encodeURIComponent(path)}`}>{t("signIn")}</Link>;
  }
  const initial = (user.name ?? user.email).trim().charAt(0).toUpperCase();
  return (
    <div className="acct hide-m" ref={ref}>
      <button className="acct-btn" aria-haspopup="menu" aria-expanded={open} aria-label={user.email} onClick={() => setOpen((o) => !o)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Google-hosted profile photo */}
        {user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : initial}
      </button>
      {open && (
        <div className="pop" role="menu">
          <p>{user.email}</p>
          <Link href="/my" role="menuitem" onClick={() => setOpen(false)}>{t("mylist")}</Link>
          <button role="menuitem" onClick={async () => { setOpen(false); await signOut(); }}>{t("signOut")}</button>
        </div>
      )}
    </div>
  );
}
