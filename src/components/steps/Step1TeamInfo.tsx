import { useState } from "react";
import { Field, Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import { teamInfoSchema } from "@/lib/schemas";
import { cleanAlnumSpaces, clean } from "@/lib/sanitize";
import { ArrowRight, Cpu, Code2, Factory } from "lucide-react";

export function Step1TeamInfo({ onNext }: { onNext: () => void }) {
  const team = useFormStore((s) => s.team);
  const setTeam = useFormStore((s) => s.setTeam);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const parsed = teamInfoSchema.safeParse({
      team_name: team.team_name ?? "",
      team_size: team.team_size,
      is_svce: team.is_svce ?? false,
      college_name: team.is_svce ? "Sri Venkateswara College of Engineering" : team.college_name ?? "",
      category: team.category,
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setTeam(parsed.data);
    setErrors({});
    onNext();
  };

  const categories = [
    { v: "Hardware", icon: Cpu, hint: "Build with circuits" },
    { v: "Software", icon: Code2, hint: "Build with code" },
    { v: "Industry Problem Statement", icon: Factory, hint: "Solve real problems" },
  ] as const;

  return (
    <div className="fade-up">
      <Panel>
        <SectionTitle index="STEP 01 / 06" title="Team Information" subtitle="Identify your squad" />

        <div className="space-y-5">
          <Field label="Team Name" error={errors.team_name} hint="Letters, numbers, spaces · max 50">
            <input
              value={team.team_name ?? ""}
              maxLength={50}
              onChange={(e) => setTeam({ team_name: cleanAlnumSpaces(e.target.value) })}
              placeholder="e.g. Web Slingers"
            />
          </Field>

          <Field label="Team Size" error={errors.team_size}>
            <div className="grid grid-cols-3 gap-2">
              {[4, 5, 6].map((n) => {
                const sel = team.team_size === n;
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setTeam({ team_size: n as 4 | 5 | 6 })}
                    className={`min-h-[52px] rounded-md border font-mono text-sm transition-all ${
                      sel
                        ? "border-spider text-spider bg-[oklch(0.58_0.22_25_/_0.1)] shadow-[0_0_18px_oklch(0.58_0.22_25_/_0.4)]"
                        : "border-border text-muted-foreground hover:border-cyan-edge"
                    }`}
                  >
                    {n} Members
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="College">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setTeam({
                    is_svce: true,
                    college_name: "Sri Venkateswara College of Engineering",
                  })
                }
                className={`min-h-[52px] rounded-md border font-mono text-sm transition-all ${
                  team.is_svce === true
                    ? "border-spider text-spider bg-[oklch(0.58_0.22_25_/_0.1)]"
                    : "border-border text-muted-foreground hover:border-cyan-edge"
                }`}
              >
                SVCE
              </button>
              <button
                type="button"
                onClick={() => setTeam({ is_svce: false, college_name: "" })}
                className={`min-h-[52px] rounded-md border font-mono text-sm transition-all ${
                  team.is_svce === false
                    ? "border-spider text-spider bg-[oklch(0.58_0.22_25_/_0.1)]"
                    : "border-border text-muted-foreground hover:border-cyan-edge"
                }`}
              >
                Other College
              </button>
            </div>
          </Field>

          {team.is_svce === false && (
            <Field label="College Name" error={errors.college_name}>
              <input
                value={team.college_name ?? ""}
                maxLength={120}
                onChange={(e) => setTeam({ college_name: clean(e.target.value) })}
                placeholder="Your college full name"
              />
            </Field>
          )}

          <Field label="Category" error={errors.category}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {categories.map(({ v, icon: Icon, hint }) => {
                const sel = team.category === v;
                return (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setTeam({ category: v })}
                    className={`p-3 rounded-md border text-left transition-all ${
                      sel
                        ? "border-spider bg-[oklch(0.58_0.22_25_/_0.1)] shadow-[0_0_18px_oklch(0.58_0.22_25_/_0.3)]"
                        : "border-border hover:border-cyan-edge"
                    }`}
                  >
                    <Icon size={18} className={sel ? "text-spider" : "text-muted-foreground"} />
                    <p className="font-mono text-xs mt-1.5 text-foreground">{v}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{hint}</p>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="flex justify-end mt-8">
          <button className="btn-primary" onClick={handleNext}>
            Next <ArrowRight size={16} />
          </button>
        </div>
      </Panel>
    </div>
  );
}
