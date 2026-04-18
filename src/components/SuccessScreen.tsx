import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { SubmitResult } from "@/lib/submit";
import { useFormStore } from "@/lib/store";
import { CheckCircle2, Crown } from "lucide-react";

export function SuccessScreen({ result }: { result: SubmitResult }) {
  const leaderEmail = useFormStore.getState().members[0]?.personal_email ?? "your team leader";

  useEffect(() => {
    const fire = (ratio: number, opts: confetti.Options) =>
      confetti({
        ...opts,
        particleCount: Math.floor(200 * ratio),
        origin: { y: 0.4 },
      });

    fire(0.25, { spread: 26, startVelocity: 55, colors: ["#E63946", "#00F5FF", "#FFB800"] });
    fire(0.2, { spread: 60, colors: ["#E63946", "#00F5FF"] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#FFB800", "#E63946"] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ["#00F5FF"] });
  }, []);

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-10">
      <div className="panel max-w-2xl w-full p-6 sm:p-10 text-center">
        <span className="panel-corner-tl" />
        <span className="panel-corner-tr" />
        <span className="panel-corner-bl" />
        <span className="panel-corner-br" />
        <div className="relative">
          <div className="mx-auto w-16 h-16 rounded-full bg-[oklch(0.85_0.16_200_/_0.15)] border border-cyan-edge flex items-center justify-center mb-5">
            <CheckCircle2 size={32} className="text-cyan-edge" />
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-spider mb-2">
            Registration Confirmed
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            You're In.
          </h1>
          <p className="font-mono text-xs text-muted-foreground mb-6 max-w-md mx-auto">
            Your registration has been received. The organizing team will contact you via email at{" "}
            <span className="text-foreground">{leaderEmail}</span>.
          </p>

          <div className="rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-4 mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
              Reference ID
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-foreground tracking-wider">
              {result.reference_id}
            </p>
          </div>

          {result.members && result.members.length > 0 && (
            <div className="rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-4 text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-edge mb-3">
                Member IDs
              </p>
              <div className="space-y-2">
                {result.members.map((m) => (
                  <div
                    key={m.member_order}
                    className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {m.member_order === 1 && (
                        <Crown size={12} className="text-amber-edge flex-shrink-0" />
                      )}
                      <span className="font-mono text-xs truncate">{m.full_name}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-spider tracking-wider">
                      {m.unique_member_id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-8">
            Save your reference ID for future communication
          </p>
        </div>
      </div>
    </div>
  );
}
