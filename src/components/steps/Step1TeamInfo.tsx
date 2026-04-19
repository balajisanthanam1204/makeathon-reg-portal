import { useState } from "react";
import { Field, Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import { teamInfoSchema, problemSchema } from "@/lib/schemas";
import { cleanAlnumSpaces, clean, cleanCode } from "@/lib/sanitize";
import { saveDraft } from "@/lib/draft";
import { ArrowRight, Cpu, Code2, Factory, Loader2 } from "lucide-react";

export function Step1TeamInfo({ onNext }: { onNext: () => void }) {
  const team = useFormStore((s) => s.team);
  const setTeam = useFormStore((s) => s.setTeam);
  const problem = useFormStore((s) => s.problem);
  const setProblem = useFormStore((s) => s.setProblem);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    const teamRes = teamInfoSchema.safeParse({
      team_name: team.team_name ?? "",
      team_size: team.team_size,
      is_svce: team.is_svce ?? false,
      college_name: team.is_svce
        ? "Sri Venkateswara College of Engineering"
        : team.college_name ?? "",
      category: team.category,
    });
    const probRes = problemSchema.safeParse({
      problem_statement_id: problem.problem_statement_id ?? "",
      problem_statement_name: problem.problem_statement_name ?? "",
      company_name: problem.company_name ?? "",
      category: team.category as never,
    });

    const e: Record<string, string> = {};
    if (!teamRes.success) teamRes.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
    if (!probRes.success) probRes.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
    if (Object.keys(e).length > 0 || !teamRes.success || !probRes.success) {
      setErrors(e);
      return;
    }

    setTeam(teamRes.data);
    setProblem({ ...probRes.data });
    setErrors({});
    setSaving(true);
    await saveDraft();
    setSaving(false);
    onNext();
  };

  const categories = [
    { v: "Hardware", icon: Cpu, hint: "Build with circuits" },
    { v: "Software", icon: Code2, hint: "Build with code" },
    { v: "Industry Problem Statement", icon: Factory, hint: "Solve real problems" },
  ] as const;

  const isIndustry = team.category === "Industry Problem Statement";

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

          {team.category && (
            <div className="rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-4 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-edge">
                Problem Statement
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Problem Statement ID" error={errors.problem_statement_id}>
                  <input
                    value={problem.problem_statement_id ?? ""}
                    onChange={(e) =>
                      setProblem({ problem_statement_id: cleanCode(e.target.value).toUpperCase() })
                    }
                    placeholder="e.g. PS-HW-12"
                  />
                </Field>
                <Field label="Problem Statement Name" error={errors.problem_statement_name}>
                  <input
                    value={problem.problem_statement_name ?? ""}
                    maxLength={160}
                    onChange={(e) =>
                      setProblem({ problem_statement_name: clean(e.target.value) })
                    }
                    placeholder="Short descriptive title"
                  />
                </Field>
                {isIndustry && (
                  <Field label="Company Name" error={errors.company_name}>
                    <input
                      value={problem.company_name ?? ""}
                      maxLength={120}
                      onChange={(e) => setProblem({ company_name: clean(e.target.value) })}
                      placeholder="Sponsoring company"
                    />
                  </Field>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-8">
          <button className="btn-primary" onClick={handleNext} disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <>Next <ArrowRight size={16} /></>}
          </button>
        </div>
      </Panel>
    </div>
  );
}
