import { supabase } from "./supabase";
import { saveDraft } from "./draft";

export type SubmitResult = {
  success: boolean;
  reference_id?: string;
  team_id?: string;
  amount_paid?: number;
  members?: { full_name: string; unique_member_id: string; member_order: number }[];
  error?: string;
};

export async function submitRegistration(): Promise<SubmitResult> {
  // Make sure latest state is saved to draft before the RPC reads it.
  const saveErr = await saveDraft();
  if (saveErr.error) return { success: false, error: saveErr.error };

  const ua = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "";
  const { data, error } = await supabase.rpc("submit_registration", {
    p_ip: "",
    p_user_agent: ua,
  });

  if (error) return { success: false, error: error.message };
  const res = data as SubmitResult;
  if (!res.success) return { success: false, error: res.error ?? "Submission failed" };

  return {
    success: true,
    reference_id: res.reference_id,
    team_id: res.team_id,
    amount_paid: res.amount_paid,
    members: (res.members ?? []).sort((a, b) => a.member_order - b.member_order),
  };
}
