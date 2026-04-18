import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Stepper } from "@/components/Stepper";
import { Step1TeamInfo } from "@/components/steps/Step1TeamInfo";
import { Step2Members } from "@/components/steps/Step2Members";
import { Step3Mentor } from "@/components/steps/Step3Mentor";
import { Step4Photos } from "@/components/steps/Step4Photos";
import { Step5Payment } from "@/components/steps/Step5Payment";
import { Step6Review } from "@/components/steps/Step6Review";
import { SuccessScreen } from "@/components/SuccessScreen";
import { useFormStore } from "@/lib/store";
import type { SubmitResult } from "@/lib/submit";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const step = useFormStore((s) => s.step);
  const setStep = useFormStore((s) => s.setStep);
  const reset = useFormStore((s) => s.reset);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("mat7_submitted") === "1") {
      setAlreadySubmitted(true);
    }
  }, []);

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
            <h2 className="text-xl font-bold mb-2">One submission per session</h2>
            <p className="font-mono text-xs text-muted-foreground">
              You have already submitted. Contact the organizers if you need help.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const goNext = () => setStep(step + 1);
  const goBack = () => setStep(step - 1);

  return (
    <main className="min-h-screen pb-20">
      <Header />
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
    </main>
  );
}
