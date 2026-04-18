import { STEP_LABELS, useFormStore } from "@/lib/store";
import { Check } from "lucide-react";

export function Stepper() {
  const step = useFormStore((s) => s.step);
  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="scan-line" />
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {STEP_LABELS.map((label, i) => {
            const idx = i + 1;
            const done = idx < step;
            const active = idx === step;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`step-dot ${active ? "active" : ""} ${done ? "done" : ""}`}>
                    {done ? <Check size={14} strokeWidth={3} /> : idx}
                  </div>
                  <span
                    className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wider whitespace-nowrap ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length && (
                  <div className={`step-line ${done ? "done" : ""} w-8 sm:w-16 mt-[-18px]`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
