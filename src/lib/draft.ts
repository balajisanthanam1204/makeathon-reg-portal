import { supabase } from "./supabase";
import { useFormStore, type DraftSnapshot } from "./store";

/**
 * Persist current store state to registration_drafts (upsert).
 * Photos & payment screenshot store paths only; binary data lives in storage.
 */
export async function saveDraft() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const s = useFormStore.getState();
  const photo_paths = s.photos.map((p) => p.storagePath ?? null);

  const payload = {
    user_id: user.id,
    step: s.step,
    team: s.team,
    problem: s.problem,
    members: s.members,
    mentor: s.mentor,
    payment: s.payment,
    payer: s.payer,
    photo_paths,
    payment_screenshot_path: s.paymentScreenshot.storagePath,
  };

  const { error } = await supabase
    .from("registration_drafts")
    .upsert(payload, { onConflict: "user_id" });
  return { error: error?.message };
}

export async function loadDraft(): Promise<DraftSnapshot | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("registration_drafts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    step: data.step ?? 1,
    team: data.team ?? {},
    problem: data.problem ?? {},
    members: data.members ?? [],
    mentor: data.mentor ?? {},
    payment: data.payment ?? {},
    payer: data.payer ?? {},
    photo_paths: data.photo_paths ?? [],
    payment_screenshot_path: data.payment_screenshot_path ?? null,
  };
}

/** Refresh signed preview URLs for the photo storage paths after rehydration. */
export async function refreshPhotoPreviews() {
  const s = useFormStore.getState();
  for (let i = 0; i < s.photos.length; i++) {
    const p = s.photos[i];
    if (p.storagePath && !p.previewUrl) {
      const { data } = await supabase.storage
        .from("member-photos")
        .createSignedUrl(p.storagePath, 60 * 60);
      if (data?.signedUrl) {
        useFormStore.getState().setPhoto(i, { ...p, previewUrl: data.signedUrl });
      }
    }
  }
  if (s.paymentScreenshot.storagePath && !s.paymentScreenshot.previewUrl) {
    const path = s.paymentScreenshot.storagePath;
    const isPdf = path.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      const { data } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(path, 60 * 60);
      if (data?.signedUrl) {
        useFormStore.getState().setPaymentScreenshot({
          ...s.paymentScreenshot,
          previewUrl: data.signedUrl,
        });
      }
    }
  }
}
