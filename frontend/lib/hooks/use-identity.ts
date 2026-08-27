"use client";

import * as React from "react";

export type Identity = {
  /** Role name as stored on the session, or null when none is assigned. */
  roleName: string | null;
  /** Assigned office name, or null for users not scoped to an office. */
  officeName: string | null;
};

const EMPTY: Identity = { roleName: null, officeName: null };

function parseStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function readIdentity(): Identity {
  if (typeof window === "undefined") return EMPTY;
  const role = parseStored<{ name?: string }>("role");
  const office = parseStored<{ name?: string }>("office");
  return {
    roleName: role?.name?.trim() || null,
    officeName: office?.name?.trim() || null,
  };
}

/**
 * The signed-in user's role and assigned office, read from the session copy in
 * localStorage (written by auth-client on login). Refreshes on the same events
 * the avatar menu listens to, so a profile save or another tab keeps it current.
 */
export function useIdentity(): Identity {
  const [identity, setIdentity] = React.useState<Identity>(EMPTY);

  React.useEffect(() => {
    const load = () => setIdentity(readIdentity());
    load();
    window.addEventListener("profile-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("profile-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return identity;
}
