"use client";

import { useEffect, useState } from "react";
import { axiosInstance, ApiError } from "@/lib/axios";
import { getToken, type AuthSession } from "@/lib/auth-client";

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!getToken()) {
        setSession(null);
        setIsPending(false);
        return;
      }

      try {
        const response = await axiosInstance.get("/auth/me");
        if (response?.data) {
          setSession(response.data);
        }
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error("Failed to fetch session:", error);
        }
        setSession(null);
      } finally {
        setIsPending(false);
      }
    };

    void fetchSession();
  }, []);

  return {
    data: session ? { session } : null,
    isPending,
  };
}
