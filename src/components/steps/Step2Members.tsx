import { useState } from "react";
import { Field, Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import { memberSchema } from "@/lib/schemas";
import {
  clean,
  cleanLetters,
  cleanDigits,
  cleanUpperAlnum,
} from "@/lib/sanitize";
import { ArrowRight, ArrowLeft, Crown, User } from "lucide-react";

const DEPTS = ["ECE", "CSE", "IT", "MECH", "CIVIL", "EEE", "AIDS", "AIML", "Other"] as const;
const YEARS = ["1st", "2nd", "3rd", "4th"] as const;

export function Step2Members({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const team = useFormStore((s) => s.team);
  const members = useFormStore((s) => s.members);
  const setMember = useFormStore((s) => s.setMember);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  const isSvce = team.is_svce === true;
  const collegeFromTeam = team.college_name ?? "";
  const schema = memberSchema(isSvce);

  const handleNext = () => {
    const newErr: Record<number, Record<string, string>> = {};
    let ok = true;
    members.forEach((m, i) => {
      const candidate = {
        full_name: m.full_name ?? "",
        department: m.department,
        year_of_study: m.year_of_study,
        registration_number: m.registration_number ?? "",
        college_name: isSvce ? collegeFromTeam : m.college_name ?? "",
        phone_number: m.phone_number ?? "",
        college_email: m.college_email ?? "",
        personal_email: m.personal_email ?? "",
      };
      const r = schema.safeParse(candidate);
      if (!r.success) {
        ok = false;
        const e: Record<string, string> = {};
        r.error.issues.forEach((iss) => (e[iss.path[0] as string] = iss.message));
        newErr[i] = e;
      } else {
        setMember(i, { ...candidate });
      }
    });
    setErrors(newErr);
    if (ok) onNext();
  };

  return (
    <div className="fade-up">
      <Panel>
        <SectionTitle
          index="STEP 02 / 06"
          title="Member Details"
          subtitle={`${members.length} members · Member 1 is Team Leader`}
        />

        <div className="space-y-8">
          {members.map((m, i) => {
            const isLeader = i === 0;
            const e = errors[i] ?? {};
            const update = (patch: Partial<typeof m>) => setMember(i, patch);
            return (
              <div key={i} className="relative rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`h-9 w-9 rounded-md flex items-center justify-center border ${
                      isLeader ? "border-amber-edge text-amber-edge" : "border-border text-muted-foreground"
                    }`}
                  >
                    {isLeader ? <Crown size={16} /> : <User size={16} />}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Member {i + 1}
                    </p>
                    <p className="font-semibold">
                      {isLeader ? "Team Leader" : "Member"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" error={e.full_name}>
                    <input
                      value={m.full_name ?? ""}
                      onChange={(ev) => update({ full_name: cleanLetters(ev.target.value) })}
                      placeholder="Peter Parker"
                    />
                  </Field>
                  <Field label="Registration Number" error={e.registration_number}>
                    <input
                      value={m.registration_number ?? ""}
                      onChange={(ev) =>
                        update({ registration_number: cleanUpperAlnum(ev.target.value) })
                      }
                      placeholder="22EC0001"
                    />
                  </Field>
                  <Field label="Department" error={e.department}>
                    <select
                      value={m.department ?? ""}
                      onChange={(ev) => update({ department: ev.target.value as typeof DEPTS[number] })}
                    >
                      <option value="">Select…</option>
                      {DEPTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Year of Study" error={e.year_of_study}>
                    <select
                      value={m.year_of_study ?? ""}
                      onChange={(ev) => update({ year_of_study: ev.target.value as typeof YEARS[number] })}
                    >
                      <option value="">Select…</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="College Name" error={e.college_name}>
                    <input
                      value={isSvce ? collegeFromTeam : m.college_name ?? ""}
                      readOnly={isSvce}
                      onChange={(ev) => update({ college_name: clean(ev.target.value) })}
                      className={isSvce ? "opacity-70" : ""}
                    />
                  </Field>
                  <Field label="Phone Number" error={e.phone_number} hint="10-digit Indian mobile">
                    <input
                      inputMode="numeric"
                      value={m.phone_number ?? ""}
                      onChange={(ev) => update({ phone_number: cleanDigits(ev.target.value, 10) })}
                      placeholder="9876543210"
                    />
                  </Field>
                  <Field
                    label="College Email"
                    error={e.college_email}
                    hint={isSvce ? "must end with @svce.ac.in" : "official college email"}
                  >
                    <input
                      type="email"
                      value={m.college_email ?? ""}
                      onChange={(ev) =>
                        update({ college_email: clean(ev.target.value).toLowerCase() })
                      }
                      placeholder={isSvce ? "name@svce.ac.in" : "name@college.edu"}
                    />
                  </Field>
                  <Field label="Personal Email" error={e.personal_email}>
                    <input
                      type="email"
                      value={m.personal_email ?? ""}
                      onChange={(ev) =>
                        update({ personal_email: clean(ev.target.value).toLowerCase() })
                      }
                      placeholder="name@gmail.com"
                    />
                  </Field>
                </div>
              </div>
            );
          })}
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
