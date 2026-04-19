import { create } from "zustand";
import type { TeamInfo, Member, Mentor, Payment, Problem, Payer } from "./schemas";

export type PhotoEntry = {
  storagePath: string | null; // server-side path (member-photos/<uid>/<file>.jpg)
  previewUrl: string | null;  // local object URL for instant preview
  sizeKb: number | null;
};

type State = {
  step: number;
  team: Partial<TeamInfo>;
  problem: Partial<Problem>;
  members: Partial<Member>[];
  mentor: Partial<Mentor>;
  payment: Partial<Payment>;
  payer: Partial<Payer>;
  photos: PhotoEntry[];
  paymentScreenshot: { storagePath: string | null; previewUrl: string | null; name: string | null; type: string | null };
  honeypot: string;
  hydrated: boolean;

  setHydrated: (b: boolean) => void;
  setStep: (s: number) => void;
  setTeam: (t: Partial<TeamInfo>) => void;
  setProblem: (p: Partial<Problem>) => void;
  setMembers: (m: Partial<Member>[]) => void;
  setMember: (i: number, m: Partial<Member>) => void;
  setMentor: (m: Partial<Mentor>) => void;
  setPayment: (p: Partial<Payment>) => void;
  setPayer: (p: Partial<Payer>) => void;
  setPhoto: (i: number, entry: PhotoEntry) => void;
  setPaymentScreenshot: (entry: { storagePath: string | null; previewUrl: string | null; name: string | null; type: string | null }) => void;
  setHoneypot: (v: string) => void;
  hydrateFromDraft: (draft: DraftSnapshot) => void;
  reset: () => void;
};

export type DraftSnapshot = {
  step?: number;
  team?: Partial<TeamInfo>;
  problem?: Partial<Problem>;
  members?: Partial<Member>[];
  mentor?: Partial<Mentor>;
  payment?: Partial<Payment>;
  payer?: Partial<Payer>;
  photo_paths?: (string | null)[];
  payment_screenshot_path?: string | null;
};

const TOTAL = 6;

const initial = {
  step: 1,
  team: {},
  problem: {},
  members: [] as Partial<Member>[],
  mentor: {},
  payment: {},
  payer: {},
  photos: [] as PhotoEntry[],
  paymentScreenshot: { storagePath: null, previewUrl: null, name: null, type: null },
  honeypot: "",
  hydrated: false,
};

export const useFormStore = create<State>((set) => ({
  ...initial,
  setHydrated: (b) => set({ hydrated: b }),
  setStep: (s) => set({ step: Math.min(TOTAL, Math.max(1, s)) }),
  setTeam: (t) =>
    set((st) => {
      const merged = { ...st.team, ...t };
      const size = (merged.team_size as number) ?? st.members.length ?? 0;
      const members = st.members.slice(0, size);
      while (members.length < size) members.push({});
      const photos = st.photos.slice(0, size);
      while (photos.length < size) photos.push({ storagePath: null, previewUrl: null, sizeKb: null });
      return { team: merged, members, photos };
    }),
  setProblem: (p) => set((st) => ({ problem: { ...st.problem, ...p } })),
  setMembers: (m) => set({ members: m }),
  setMember: (i, m) =>
    set((st) => {
      const next = st.members.slice();
      next[i] = { ...next[i], ...m };
      return { members: next };
    }),
  setMentor: (m) => set((st) => ({ mentor: { ...st.mentor, ...m } })),
  setPayment: (p) => set((st) => ({ payment: { ...st.payment, ...p } })),
  setPayer: (p) => set((st) => ({ payer: { ...st.payer, ...p } })),
  setPhoto: (i, entry) =>
    set((st) => {
      const next = st.photos.slice();
      next[i] = entry;
      return { photos: next };
    }),
  setPaymentScreenshot: (entry) => set({ paymentScreenshot: entry }),
  setHoneypot: (v) => set({ honeypot: v }),
  hydrateFromDraft: (d) =>
    set((st) => {
      const team = d.team ?? {};
      const size = (team.team_size as number) ?? d.members?.length ?? 0;
      const members = (d.members ?? []).slice(0, size);
      while (members.length < size) members.push({});
      const photos: PhotoEntry[] = [];
      for (let i = 0; i < size; i++) {
        const sp = d.photo_paths?.[i] ?? null;
        photos.push({ storagePath: sp, previewUrl: null, sizeKb: null });
      }
      return {
        ...st,
        step: d.step ?? 1,
        team,
        problem: d.problem ?? {},
        members,
        mentor: d.mentor ?? {},
        payment: d.payment ?? {},
        payer: d.payer ?? {},
        photos,
        paymentScreenshot: {
          storagePath: d.payment_screenshot_path ?? null,
          previewUrl: null,
          name: d.payment_screenshot_path ? d.payment_screenshot_path.split("/").pop() ?? null : null,
          type: null,
        },
        hydrated: true,
      };
    }),
  reset: () => set({ ...initial, hydrated: true }),
}));

export const TOTAL_STEPS = TOTAL;
export const STEP_LABELS = [
  "Team Info",
  "Member Details",
  "Mentor Details",
  "Photo Upload",
  "Payment",
  "Review & Submit",
];
