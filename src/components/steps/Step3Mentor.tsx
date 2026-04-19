import { useState } from "react";
import { Field, Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import { mentorSchema } from "@/lib/schemas";
import { clean, cleanLetters, cleanDigits } from "@/lib/sanitize";
import { saveDraft } from "@/lib/draft";
import { ArrowRight, ArrowLeft, BadgeCheck, Loader2 } from "lucide-react";

export function Step3Mentor({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const team = useFormStore((s) => s.team);
  const mentor = useFormStore((s) => s.mentor);
  const setMentor = useFormStore((s) => s.setMentor);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    const r = mentorSchema.safeParse({
      mentor_name: mentor.mentor_name ?? "",
      mentor_designation: mentor.mentor_designation ?? "",
      mentor_department: mentor.mentor_department ?? "",
      mentor_phone: mentor.mentor_phone ?? "",
      mentor_email: mentor.mentor_email ?? "",
    });
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
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
          index="STEP 03 / 06"
          title="Mentor Details"
          subtitle="Faculty mentor responsible for the team"
        />

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className={`tag ${team.is_svce ? "tag-spider" : "tag-cyan"}`}>
              <BadgeCheck size={12} />
              {team.is_svce ? "SVCE Team" : "Non-SVCE Team"}
            </span>
            <span className="tag tag-amber">Category: {team.category}</span>
            <span className="tag">Size: {team.team_size}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mentor Name" error={errors.mentor_name}>
              <input
                value={mentor.mentor_name ?? ""}
                onChange={(e) => setMentor({ mentor_name: cleanLetters(e.target.value) })}
                placeholder="Dr. May Parker"
              />
            </Field>
            <Field label="Designation" error={errors.mentor_designation}>
              <input
                value={mentor.mentor_designation ?? ""}
                onChange={(e) => setMentor({ mentor_designation: clean(e.target.value) })}
                placeholder="Associate Professor"
              />
            </Field>
            <Field label="Mentor Department" error={errors.mentor_department}>
              <input
                value={mentor.mentor_department ?? ""}
                onChange={(e) => setMentor({ mentor_department: clean(e.target.value) })}
                placeholder="ECE"
              />
            </Field>
            <Field label="Mentor Phone" error={errors.mentor_phone} hint="10-digit Indian mobile">
              <input
                inputMode="numeric"
                value={mentor.mentor_phone ?? ""}
                onChange={(e) => setMentor({ mentor_phone: cleanDigits(e.target.value, 10) })}
                placeholder="9876543210"
              />
            </Field>
            <Field label="Mentor Email" error={errors.mentor_email}>
              <input
                type="email"
                value={mentor.mentor_email ?? ""}
                onChange={(e) =>
                  setMentor({ mentor_email: clean(e.target.value).toLowerCase() })
                }
                placeholder="mentor@svce.ac.in"
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-between mt-8 gap-3">
          <button className="btn-ghost" onClick={onBack}>
            <ArrowLeft size={16} className="inline mr-1" /> Back
          </button>
          <button className="btn-primary" onClick={handleNext} disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <>Next <ArrowRight size={16} /></>}
          </button>
        </div>
      </Panel>
    </div>
  );
}
