import { supabase } from "./supabase";
import { randomFileName } from "./randomName";
import type { TeamInfo, Member, Mentor, Payment } from "./schemas";
import type { PhotoEntry } from "./store";

export type SubmitInput = {
  team: TeamInfo;
  mentor: Mentor;
  payment: Payment;
  members: Member[];
  photos: PhotoEntry[];
  paymentScreenshot: File;
};

export type SubmitResult = {
  success: boolean;
  reference_id?: string;
  team_id?: string;
  members?: { full_name: string; unique_member_id: string; member_order: number }[];
  error?: string;
};

export async function submitRegistration(input: SubmitInput): Promise<SubmitResult> {
  // Allocate a temp UUID for storage paths so we can keep all files of one
  // submission together. The actual team_id is created server-side by the RPC.
  const tempId = crypto.randomUUID();

  // 1. Upload member photos
  const photoUrls: string[] = [];
  for (let i = 0; i < input.photos.length; i++) {
    const ph = input.photos[i];
    if (!ph?.blob) return { success: false, error: `Missing photo for member ${i + 1}` };
    const path = `${tempId}/${randomFileName("jpg")}`;
    const { error } = await supabase.storage
      .from("member-photos")
      .upload(path, ph.blob, { contentType: "image/jpeg", upsert: false });
    if (error) return { success: false, error: `Photo upload failed: ${error.message}` };
    photoUrls.push(path);
  }

  // 2. Upload payment screenshot
  const ext =
    input.paymentScreenshot.type === "application/pdf"
      ? "pdf"
      : input.paymentScreenshot.type === "image/png"
        ? "png"
        : "jpg";
  const screenshotPath = `${tempId}/${randomFileName(ext)}`;
  const { error: ssErr } = await supabase.storage
    .from("payment-screenshots")
    .upload(screenshotPath, input.paymentScreenshot, {
      contentType: input.paymentScreenshot.type,
      upsert: false,
    });
  if (ssErr) return { success: false, error: `Screenshot upload failed: ${ssErr.message}` };

  // 3. Build payload
  const teamPayload = {
    team_name: input.team.team_name,
    team_size: input.team.team_size,
    is_svce: input.team.is_svce,
    college_name: input.team.is_svce
      ? "Sri Venkateswara College of Engineering"
      : input.team.college_name,
    category: input.team.category,
    mentor_name: input.mentor.mentor_name,
    mentor_department: input.mentor.mentor_department ?? "",
    mentor_phone: input.mentor.mentor_phone,
    mentor_email: input.mentor.mentor_email,
    payment_transaction_id: input.payment.payment_transaction_id,
    payment_bank_name: input.payment.payment_bank_name,
    payment_ifsc_code: input.payment.payment_ifsc_code,
    payment_branch_name: input.payment.payment_branch_name,
    payment_branch_code: input.payment.payment_branch_code,
    payment_screenshot_url: screenshotPath,
  };

  const memberPayloads = input.members.map((m, i) => ({
    member_order: i + 1,
    is_leader: i === 0,
    full_name: m.full_name,
    department: m.department,
    year_of_study: m.year_of_study,
    registration_number: m.registration_number,
    college_name: m.college_name,
    phone_number: m.phone_number,
    college_email: m.college_email,
    personal_email: m.personal_email,
    photo_url: photoUrls[i],
  }));

  // 4. Call atomic RPC
  const { data, error } = await supabase.rpc("submit_registration", {
    p_team: teamPayload,
    p_members: memberPayloads,
    p_ip: "",
    p_user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
  });

  if (error) return { success: false, error: error.message };
  const res = data as { success: boolean; reference_id?: string; team_id?: string; error?: string };
  if (!res.success) return { success: false, error: res.error ?? "Submission failed" };

  // Compute unique_member_ids client-side for display only (server is source of truth).
  // We can't read team_number back due to RLS, so we just show the name list with
  // the same formula format: it's already stored server-side. For the success
  // screen we re-fetch is blocked by RLS, so we approximate using ref id only.
  return {
    success: true,
    reference_id: res.reference_id,
    team_id: res.team_id,
    members: input.members.map((m, i) => ({
      full_name: m.full_name,
      member_order: i + 1,
      unique_member_id: "—", // server-generated, not readable from anon
    })),
  };
}
