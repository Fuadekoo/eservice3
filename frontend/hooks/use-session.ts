"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import type { AuthSession } from "@/lib/auth-client";

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axiosInstance.get("/auth/me");
        // Axios interceptor already unwraps response.data, so we access it directly
        if (response?.data) {
          setSession(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setSession(null);
      } finally {
        setIsPending(false);
      }
    };

    fetchSession();
  }, []);

  return {
    data: session ? { session } : null,
    isPending,
  };
}

