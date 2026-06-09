import { create } from "zustand";
import { persist } from "zustand/middleware";

type MyOfficeStore = {
  mainOfficeId: string | null;
  setMainOfficeId: (officeId: string | null) => void;
  clearMainOffice: () => void;
};

export const useMyOfficeStore = create<MyOfficeStore>()(
  persist(
    (set) => ({
      mainOfficeId: null,
      setMainOfficeId: (officeId) => set({ mainOfficeId: officeId }),
      clearMainOffice: () => set({ mainOfficeId: null }),
    }),
    { name: "my-office-storage" },
  ),
);

export function resolveMainOfficeId(
  sessionOfficeId?: string | null,
  storedOfficeId?: string | null,
): string | null {
  return sessionOfficeId?.trim() || storedOfficeId?.trim() || null;
}
