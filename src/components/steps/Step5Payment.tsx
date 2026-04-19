import { useEffect, useState } from "react";
import { Field, Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import { paymentSchema, payerSchema } from "@/lib/schemas";
import { clean, cleanAlnum, cleanDigits, cleanLetters } from "@/lib/sanitize";
import { supabase } from "@/lib/supabase";
import { saveDraft } from "@/lib/draft";
import { randomFileName } from "@/lib/randomName";
import { PER_MEMBER_FEE, TREASURERS } from "@/lib/constants";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertTriangle,
  FileText,
  Loader2,
  Phone,
  IndianRupee,
} from "lucide-react";

const ALLOWED_SCREENSHOT = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;

export function Step5Payment({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const team = useFormStore((s) => s.team);
  const payment = useFormStore((s) => s.payment);
  const setPayment = useFormStore((s) => s.setPayment);
  const payer = useFormStore((s) => s.payer);
  const setPayer = useFormStore((s) => s.setPayer);
  const screenshot = useFormStore((s) => s.paymentScreenshot);
  const setScreenshot = useFormStore((s) => s.setPaymentScreenshot);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const teamSize = (team.team_size as number) ?? 0;
  const total = teamSize * PER_MEMBER_FEE;

  useEffect(() => {
    const { data } = supabase.storage.from("payment-qr").getPublicUrl("qr.png");
    setQrUrl(data.publicUrl);
  }, []);

  const onPick = async (file?: File) => {
    setFileError(null);
    if (!file) return;
    if (!ALLOWED_SCREENSHOT.includes(file.type)) {
      setFileError("Only JPG, PNG, or PDF allowed.");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setFileError("Max 10MB.");
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      // remove old
      if (screenshot.storagePath) {
        await supabase.storage.from("payment-screenshots").remove([screenshot.storagePath]);
      }
      const ext =
        file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${randomFileName(ext)}`;
      const { error } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const previewUrl = file.type === "application/pdf" ? null : URL.createObjectURL(file);
      setScreenshot({ storagePath: path, previewUrl, name: file.name, type: file.type });
      await saveDraft();
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    if (!screenshot.storagePath) {
      setFileError("Please upload a payment screenshot.");
      return;
    }
    if (!confirmed) {
      setFileError("Please confirm the payment details.");
      return;
    }
    const r = paymentSchema.safeParse({
      payment_transaction_id: payment.payment_transaction_id ?? "",
      payment_bank_name: payment.payment_bank_name ?? "",
    });
    const r2 = payerSchema.safeParse({
      payer_name: payer.payer_name ?? "",
      payer_mobile: payer.payer_mobile ?? "",
    });
    const e: Record<string, string> = {};
    if (!r.success) r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
    if (!r2.success) r2.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setSaving(true);
    await saveDraft();
    setSaving(false);
    onNext();
  };

  return (
    <div className="fade-up">
      <Panel>
        <SectionTitle
          index="STEP 05 / 06"
          title="Payment"
          subtitle="Pay the registration fee, then upload proof"
        />

        {/* Fee split-up */}
        <div className="mb-6 rounded-lg border border-spider/40 bg-[oklch(0.58_0.22_25_/_0.08)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-spider mb-2">
            Registration Fee
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono text-sm text-foreground">{teamSize}</span>
            <span className="font-mono text-xs text-muted-foreground">members ×</span>
            <span className="font-mono text-sm text-foreground">₹{PER_MEMBER_FEE}</span>
            <span className="font-mono text-xs text-muted-foreground">=</span>
            <span className="text-2xl font-bold text-spider flex items-center">
              <IndianRupee size={20} />
              {total.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mt-2">
            Pay exactly ₹{total.toLocaleString("en-IN")} to the QR code below. Underpayment or
            wrong details will delay or cause rejection of your team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-4 flex flex-col items-center text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-edge mb-3">
              Scan to Pay
            </p>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Payment QR"
                className="w-44 h-44 sm:w-52 sm:h-52 rounded-md bg-white p-2 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-44 h-44 rounded-md border border-dashed border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                QR not configured
              </div>
            )}
            <p className="font-mono text-[11px] text-muted-foreground mt-3 leading-relaxed">
              After payment, take a clear screenshot showing the transaction ID.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-spider mb-2">
              Upload Payment Screenshot
            </p>
            <p className="font-mono text-[11px] text-muted-foreground mb-3">
              Must clearly show the Transaction ID.
            </p>

            <label className="block w-full">
              <div className={`rounded-md border border-dashed transition-colors p-5 text-center cursor-pointer ${uploading ? "border-cyan-edge" : "border-border hover:border-spider"}`}>
                {uploading ? (
                  <Loader2 size={20} className="mx-auto mb-2 animate-spin text-cyan-edge" />
                ) : (
                  <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
                )}
                <p className="font-mono text-xs text-foreground">
                  {uploading ? "Uploading…" : screenshot.name ? screenshot.name : "Choose JPG, PNG or PDF"}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">Max 10MB</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onPick(e.target.files?.[0])}
              />
            </label>

            {screenshot.previewUrl && (
              <img
                src={screenshot.previewUrl}
                alt="Payment screenshot"
                className="mt-3 w-full max-h-48 object-contain rounded-md border border-border"
              />
            )}
            {screenshot.type === "application/pdf" && (
              <div className="mt-3 flex items-center gap-2 text-muted-foreground font-mono text-xs">
                <FileText size={14} /> PDF attached
              </div>
            )}

            {fileError && (
              <p className="mt-2 font-mono text-[11px] text-destructive">{fileError}</p>
            )}
            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-md border border-amber-edge/40 bg-[oklch(0.82_0.16_80_/_0.05)]">
              <AlertTriangle size={14} className="text-amber-edge flex-shrink-0 mt-0.5" />
              <p className="font-mono text-[11px] text-amber-edge">
                Blurred or cropped screenshots will be rejected.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Transaction ID" error={errors.payment_transaction_id} hint="Min 8 alphanumeric chars">
            <input
              value={payment.payment_transaction_id ?? ""}
              onChange={(e) =>
                setPayment({ payment_transaction_id: cleanAlnum(e.target.value) })
              }
              placeholder="TXN12345678"
            />
          </Field>
          <Field label="Bank Name" error={errors.payment_bank_name}>
            <input
              value={payment.payment_bank_name ?? ""}
              onChange={(e) => setPayment({ payment_bank_name: clean(e.target.value) })}
              placeholder="State Bank of India"
            />
          </Field>
          <Field label="Payer Name" error={errors.payer_name} hint="Name of the person who paid">
            <input
              value={payer.payer_name ?? ""}
              onChange={(e) => setPayer({ payer_name: cleanLetters(e.target.value) })}
              placeholder="Peter Parker"
            />
          </Field>
          <Field label="Payer Mobile Number" error={errors.payer_mobile} hint="UPI / bank registered number">
            <input
              inputMode="numeric"
              value={payer.payer_mobile ?? ""}
              onChange={(e) => setPayer({ payer_mobile: cleanDigits(e.target.value, 10) })}
              placeholder="9876543210"
            />
          </Field>
        </div>

        {/* Confirmation checkbox */}
        <label className="mt-5 flex items-start gap-3 p-4 rounded-md border border-border bg-[oklch(0.18_0.03_270)] cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-5 h-5 accent-spider"
            style={{ minHeight: "auto" }}
          />
          <span className="font-mono text-xs text-foreground leading-relaxed">
            I confirm that I have paid <span className="text-spider">₹{total.toLocaleString("en-IN")}</span>{" "}
            to the QR code shown above and that all payment details entered are correct.
            I understand that incorrect details will delay or cause rejection of my team.
          </span>
        </label>

        {/* Treasurer POC */}
        <div className="mt-5 rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-edge mb-3">
            Payment Queries · Contact Treasurers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TREASURERS.map((t) => (
              <a
                key={t.phone}
                href={`tel:${t.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 p-2 rounded border border-border hover:border-spider transition-colors"
              >
                <Phone size={14} className="text-spider" />
                <div className="min-w-0">
                  <p className="font-mono text-xs text-foreground truncate">{t.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{t.phone}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-8 gap-3">
          <button className="btn-ghost" onClick={onBack} disabled={saving}>
            <ArrowLeft size={16} className="inline mr-1" /> Back
          </button>
          <button className="btn-primary" onClick={handleNext} disabled={saving || uploading}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <>Next <ArrowRight size={16} /></>}
          </button>
        </div>
      </Panel>
    </div>
  );
}
