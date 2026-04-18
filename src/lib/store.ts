import { create } from "zustand";
import type { TeamInfo, Member, Mentor, Payment } from "./schemas";

export type PhotoEntry = {
  blob: Blob | null;
  previewUrl: string | null;
};

type State = {
  step: number;
  team: Partial<TeamInfo>;
  members: Partial<Member>[];
  mentor: Partial<Mentor>;
  payment: Partial<Payment>;
  photos: PhotoEntry[]; // index 0..N-1
  paymentScreenshot: { file: File | null; previewUrl: string | null };
  honeypot: string;

  setStep: (s: number) => void;
  setTeam: (t: Partial<TeamInfo>) => void;
  setMembers: (m: Partial<Member>[]) => void;
  setMember: (i: number, m: Partial<Member>) => void;
  setMentor: (m: Partial<Mentor>) => void;
  setPayment: (p: Partial<Payment>) => void;
  setPhoto: (i: number, entry: PhotoEntry) => void;
  setPaymentScreenshot: (file: File | null, url: string | null) => void;
  setHoneypot: (v: string) => void;
  reset: () => void;
};

const TOTAL = 6;

const initial = {
  step: 1,
  team: {},
  members: [],
  mentor: {},
  payment: {},
  photos: [] as PhotoEntry[],
  paymentScreenshot: { file: null, previewUrl: null },
  honeypot: "",
};

export const useFormStore = create<State>((set) => ({
  ...initial,
  setStep: (s) => set({ step: Math.min(TOTAL, Math.max(1, s)) }),
  setTeam: (t) =>
    set((st) => {
      const merged = { ...st.team, ...t };
      const size = (merged.team_size as number) ?? st.members.length ?? 0;
      let members = st.members.slice(0, size);
      while (members.length < size) members.push({});
      let photos = st.photos.slice(0, size);
      while (photos.length < size) photos.push({ blob: null, previewUrl: null });
      return { team: merged, members, photos };
    }),
  setMembers: (m) => set({ members: m }),
  setMember: (i, m) =>
    set((st) => {
      const next = st.members.slice();
      next[i] = { ...next[i], ...m };
      return { members: next };
    }),
  setMentor: (m) => set((st) => ({ mentor: { ...st.mentor, ...m } })),
  setPayment: (p) => set((st) => ({ payment: { ...st.payment, ...p } })),
  setPhoto: (i, entry) =>
    set((st) => {
      const next = st.photos.slice();
      next[i] = entry;
      return { photos: next };
    }),
  setPaymentScreenshot: (file, previewUrl) =>
    set({ paymentScreenshot: { file, previewUrl } }),
  setHoneypot: (v) => set({ honeypot: v }),
  reset: () => set({ ...initial }),
}));

export const TOTAL_STEPS = TOTAL;
export const STEP_LABELS = [
  "Team Info",
  "Member Details",
  "Mentor & Category",
  "Photo Upload",
  "Payment",
  "Review & Submit",
];
