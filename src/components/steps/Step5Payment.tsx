import { useEffect, useState } from "react";
import { Field, Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import { paymentSchema } from "@/lib/schemas";
import { clean, cleanAlnum } from "@/lib/sanitize";
import { supabase } from "@/lib/supabase";
import { ArrowRight, ArrowLeft, Upload, AlertTriangle, FileText } from "lucide-react";

const ALLOWED_SCREENSHOT = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;

export function Step5Payment({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const payment = useFormStore((s) => s.payment);
  const setPayment = useFormStore((s) => s.setPayment);
  const screenshot = useFormStore((s) => s.paymentScreenshot);
  const setScreenshot = useFormStore((s) => s.setPaymentScreenshot);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.storage.from("payment-qr").getPublicUrl("qr.png");
    setQrUrl(data.publicUrl);
  }, []);

  const onPick = (file?: File) => {
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
    const url = file.type === "application/pdf" ? null : URL.createObjectURL(file);
    setScreenshot(file, url);
  };

  const handleNext = () => {
    if (!screenshot.file) {
      setFileError("Please upload a payment screenshot.");
      return;
    }
    const r = paymentSchema.safeParse({
      payment_transaction_id: payment.payment_transaction_id ?? "",
      payment_bank_name: payment.payment_bank_name ?? "",
      payment_ifsc_code: payment.payment_ifsc_code ?? "",
      payment_branch_name: payment.payment_branch_name ?? "",
      payment_branch_code: payment.payment_branch_code ?? "",
    });
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
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
              Scan this QR code to pay the registration fee. After payment, take a clear screenshot
              showing the transaction ID.
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
              <div className="rounded-md border border-dashed border-border hover:border-spider transition-colors p-5 text-center cursor-pointer">
                <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
                <p className="font-mono text-xs text-foreground">
                  {screenshot.file ? screenshot.file.name : "Choose JPG, PNG or PDF"}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">Max 10MB</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
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
            {screenshot.file?.type === "application/pdf" && (
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
          <Field label="IFSC Code" error={errors.payment_ifsc_code} hint="Format: ABCD0123456">
            <input
              value={payment.payment_ifsc_code ?? ""}
              onChange={(e) =>
                setPayment({
                  payment_ifsc_code: clean(e.target.value).toUpperCase().replace(/[^A-Z0-9]/g, ""),
                })
              }
              maxLength={11}
              placeholder="SBIN0001234"
            />
          </Field>
          <Field label="Branch Name" error={errors.payment_branch_name}>
            <input
              value={payment.payment_branch_name ?? ""}
              onChange={(e) => setPayment({ payment_branch_name: clean(e.target.value) })}
              placeholder="Pennalur Branch"
            />
          </Field>
          <Field label="Branch Code" error={errors.payment_branch_code}>
            <input
              value={payment.payment_branch_code ?? ""}
              onChange={(e) => setPayment({ payment_branch_code: clean(e.target.value) })}
              placeholder="01234"
            />
          </Field>
        </div>

        <div className="flex justify-between mt-8 gap-3">
          <button className="btn-ghost" onClick={onBack}>
            <ArrowLeft size={16} className="inline mr-1" /> Back
          </button>
          <button className="btn-primary" onClick={handleNext}>
            Next <ArrowRight size={16} />
          </button>
        </div>
      </Panel>
    </div>
  );
}
