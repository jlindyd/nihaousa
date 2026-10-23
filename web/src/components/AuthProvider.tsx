"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { KEYS, write } from "@/lib/store";
import { getBrowserClient } from "@/lib/supabase/client";
import { authConfigured } from "@/lib/supabase/env";
import { startSync } from "@/lib/sync";

export interface AccountUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthState {
  /** false until Supabase is connected */
  configured: boolean;
  /** true until the first check of who is signed in finishes */
  loading: boolean;
  user: AccountUser | null;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>({ configured: false, loading: false, user: null, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(authConfigured);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const toUser = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null | undefined): AccountUser | null =>
      u
        ? {
            id: u.id,
            email: u.email ?? "",
            name: (u.user_metadata?.full_name ?? u.user_metadata?.name) as string | undefined,
            avatar: (u.user_metadata?.avatar_url ?? u.user_metadata?.picture) as string | undefined,
          }
        : null;
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session?.user));
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(toUser(session?.user)));
    return () => data.subscription.unsubscribe();
  }, []);

  // Keep this browser and the account in step while someone is signed in.
  const userId = user?.id;
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase || !userId) return;
    return startSync(supabase, userId);
  }, [userId]);

  const signOut = useCallback(async () => {
    await getBrowserClient()?.auth.signOut();
    // The lists live in the account. Clear this browser so the next person on a shared computer starts empty.
    for (const key of [KEYS.later, KEYS.favs, KEYS.follow]) write(key, [], true);
    for (const key of [KEYS.progress, KEYS.watched]) write(key, {}, true);
    try {
      localStorage.removeItem("nh-synced");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ configured: authConfigured, loading, user, signOut }), [loading, user, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
