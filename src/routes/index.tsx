import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stepper } from "@/components/Stepper";
import { Step1TeamInfo } from "@/components/steps/Step1TeamInfo";
import { Step2Members } from "@/components/steps/Step2Members";
import { Step3Mentor } from "@/components/steps/Step3Mentor";
import { Step4Photos } from "@/components/steps/Step4Photos";
import { Step5Payment } from "@/components/steps/Step5Payment";
import { Step6Review } from "@/components/steps/Step6Review";
import { SuccessScreen } from "@/components/SuccessScreen";
import { useFormStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { loadDraft, refreshPhotoPreviews, saveDraft } from "@/lib/draft";
import type { SubmitResult } from "@/lib/submit";
import { Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const step = useFormStore((s) => s.step);
  const setStep = useFormStore((s) => s.setStep);
  const reset = useFormStore((s) => s.reset);
  const hydrateFromDraft = useFormStore((s) => s.hydrateFromDraft);
  const hydrated = useFormStore((s) => s.hydrated);

  const [result, setResult] = useState<SubmitResult | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState<{ ref: string } | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  // Redirect to /login when not signed in
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  // On login: check for already-submitted team OR hydrate draft
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setBootLoading(true);
      // Check if user already has a submitted team
      const { data: existing } = await supabase
        .from("teams")
        .select("reference_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (existing) {
        setAlreadySubmitted({ ref: existing.reference_id });
        setBootLoading(false);
        return;
      }

      const draft = await loadDraft();
      if (cancelled) return;
      if (draft) {
        hydrateFromDraft(draft);
        await refreshPhotoPreviews();
      } else {
        reset();
      }
      setBootLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, hydrateFromDraft, reset]);

  if (loading || (user && bootLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-spider" />
      </div>
    );
  }

  if (!user) return null; // redirecting

  if (result?.success) {
    return <SuccessScreen result={result} />;
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="panel max-w-md w-full p-8 text-center">
          <span className="panel-corner-tl" />
          <span className="panel-corner-tr" />
          <span className="panel-corner-bl" />
          <span className="panel-corner-br" />
          <div className="relative">
            <Lock size={28} className="mx-auto text-spider mb-3" />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-spider mb-2">
              Already Submitted
            </p>
            <h2 className="text-xl font-bold mb-2">One submission per account</h2>
            <p className="font-mono text-xs text-muted-foreground mb-4">
              Your team is registered. Reference ID:
            </p>
            <p className="font-mono text-xl font-bold text-foreground tracking-wider">
              {alreadySubmitted.ref}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground mt-4">
              Contact the organizers if you need help.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const goNext = async () => {
    await saveDraft();
    setStep(step + 1);
  };
  const goBack = async () => {
    await saveDraft();
    setStep(step - 1);
  };

  // Persist the step number whenever it changes
  useEffectStepSave(step);

  return (
    <main className="min-h-screen pb-20">
      <Header />
      {hydrated && (
        <>
          <Stepper />
          <div className="max-w-3xl mx-auto px-4 mt-6 sm:mt-8">
            {step === 1 && <Step1TeamInfo onNext={goNext} />}
            {step === 2 && <Step2Members onNext={goNext} onBack={goBack} />}
            {step === 3 && <Step3Mentor onNext={goNext} onBack={goBack} />}
            {step === 4 && <Step4Photos onNext={goNext} onBack={goBack} />}
            {step === 5 && <Step5Payment onNext={goNext} onBack={goBack} />}
            {step === 6 && (
              <Step6Review
                onBack={goBack}
                onSuccess={(r) => {
                  setResult(r);
                  reset();
                }}
              />
            )}
          </div>
        </>
      )}
      <Footer />
    </main>
  );
}

// Tiny helper to persist step number on change (debounced lightly)
function useEffectStepSave(step: number) {
  useEffect(() => {
    const t = setTimeout(() => {
      void saveDraft();
    }, 300);
    return () => clearTimeout(t);
  }, [step]);
}
