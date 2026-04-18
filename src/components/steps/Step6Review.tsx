import { useState } from "react";
import { Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import { submitRegistration, type SubmitResult } from "@/lib/submit";
import { ArrowLeft, Crown, Send, ShieldCheck, X, Loader2 } from "lucide-react";

export function Step6Review({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (r: SubmitResult) => void;
}) {
  const team = useFormStore((s) => s.team);
  const members = useFormStore((s) => s.members);
  const mentor = useFormStore((s) => s.mentor);
  const payment = useFormStore((s) => s.payment);
  const photos = useFormStore((s) => s.photos);
  const screenshot = useFormStore((s) => s.paymentScreenshot);
  const honeypot = useFormStore((s) => s.honeypot);

  const [confirm, setConfirm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (honeypot) {
      // Silent honeypot rejection
      onSuccess({ success: true, reference_id: "MAT7-PENDING", members: [] });
      return;
    }
    if (!screenshot.file) {
      setError("Payment screenshot missing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await submitRegistration({
      team: team as never,
      mentor: mentor as never,
      payment: payment as never,
      members: members as never,
      photos,
      paymentScreenshot: screenshot.file,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Submission failed. Please try again.");
      setShowModal(false);
      return;
    }
    sessionStorage.setItem("mat7_submitted", "1");
    onSuccess(result);
  };

  return (
    <div className="fade-up">
      <Panel>
        <SectionTitle index="STEP 06 / 06" title="Review & Submit" subtitle="Verify everything before final submission" />

        <div className="space-y-5">
          <ReviewCard title="Team Information">
            <Row k="Team Name" v={team.team_name} />
            <Row k="Team Size" v={String(team.team_size)} />
            <Row k="College" v={team.is_svce ? "SVCE" : team.college_name} />
            <Row k="Category" v={team.category} />
          </ReviewCard>

          <ReviewCard title="Mentor">
            <Row k="Name" v={mentor.mentor_name} />
            <Row k="Department" v={mentor.mentor_department} />
            <Row k="Phone" v={mentor.mentor_phone} />
            <Row k="Email" v={mentor.mentor_email} />
          </ReviewCard>

          <ReviewCard title="Members">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((m, i) => (
                <div key={i} className="rounded-md border border-border p-3 bg-[oklch(0.18_0.03_270)]">
                  <div className="flex items-center gap-2 mb-2">
                    {photos[i]?.previewUrl ? (
                      <img
                        src={photos[i]!.previewUrl!}
                        alt={m.full_name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        {i === 0 && <Crown size={11} className="text-amber-edge" />}
                        <p className="font-mono text-[11px] truncate">{m.full_name}</p>
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {m.department} · {m.year_of_study} Year
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">
                    {m.registration_number} · {m.phone_number}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">
                    {m.college_email}
                  </p>
                </div>
              ))}
            </div>
          </ReviewCard>

          <ReviewCard title="Payment">
            <Row k="Transaction ID" v={payment.payment_transaction_id} />
            <Row k="Bank" v={`${payment.payment_bank_name} (${payment.payment_branch_name})`} />
            <Row k="IFSC" v={payment.payment_ifsc_code} />
            <Row k="Branch Code" v={payment.payment_branch_code} />
            {screenshot.previewUrl && (
              <img
                src={screenshot.previewUrl}
                alt="Payment screenshot"
                className="mt-2 max-h-40 rounded-md border border-border"
              />
            )}
            {screenshot.file?.type === "application/pdf" && (
              <p className="font-mono text-[11px] text-cyan-edge mt-2">PDF: {screenshot.file.name}</p>
            )}
          </ReviewCard>

          {/* Honeypot — visually hidden */}
          <div className="honeypot" aria-hidden="true">
            <label>Website</label>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => useFormStore.getState().setHoneypot(e.target.value)}
            />
          </div>

          <label className="flex items-start gap-3 p-4 rounded-md border border-border bg-[oklch(0.18_0.03_270)] cursor-pointer">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-1 w-5 h-5 accent-spider"
              style={{ minHeight: "auto" }}
            />
            <span className="font-mono text-xs text-foreground leading-relaxed">
              I confirm that all the above information is accurate and complete.
            </span>
          </label>

          {error && (
            <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10 font-mono text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8 gap-3">
          <button className="btn-ghost" onClick={onBack} disabled={submitting}>
            <ArrowLeft size={16} className="inline mr-1" /> Back
          </button>
          <button
            className="btn-primary"
            disabled={!confirm || submitting}
            onClick={() => setShowModal(true)}
          >
            <ShieldCheck size={16} /> Submit Registration
          </button>
        </div>
      </Panel>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="panel max-w-sm w-full p-6 text-center">
            <span className="panel-corner-tl" />
            <span className="panel-corner-tr" />
            <span className="panel-corner-bl" />
            <span className="panel-corner-br" />
            <div className="relative">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-spider mb-2">
                Confirm Submission
              </p>
              <h3 className="text-xl font-bold mb-2">Submit final registration?</h3>
              <p className="font-mono text-xs text-muted-foreground mb-5">
                You will not be able to edit after this. Make sure all data is correct.
              </p>
              <div className="flex gap-3">
                <button className="btn-ghost flex-1" onClick={() => setShowModal(false)} disabled={submitting}>
                  <X size={14} className="inline mr-1" /> Cancel
                </button>
                <button className="btn-primary flex-1" onClick={submit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-edge mb-3">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 items-baseline">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="font-mono text-xs text-foreground break-words">{v || "—"}</span>
    </div>
  );
}
