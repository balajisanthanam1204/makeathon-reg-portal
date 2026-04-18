import { useState } from "react";
import { Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_INPUT_BYTES, readFileAsDataURL } from "@/lib/imageUtil";
import { CropperModal } from "@/components/CropperModal";
import { ArrowRight, ArrowLeft, Camera, Crown, RefreshCw } from "lucide-react";

export function Step4Photos({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const members = useFormStore((s) => s.members);
  const photos = useFormStore((s) => s.photos);
  const setPhoto = useFormStore((s) => s.setPhoto);

  const [cropFor, setCropFor] = useState<{ index: number; src: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (i: number, file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError("Only JPG or PNG files are allowed.");
      return;
    }
    if (file.size > MAX_PHOTO_INPUT_BYTES) {
      setError("File too large. Max 5MB.");
      return;
    }
    const src = await readFileAsDataURL(file);
    setCropFor({ index: i, src });
  };

  const allFilled = photos.length === members.length && photos.every((p) => !!p.blob);

  return (
    <div className="fade-up">
      <Panel>
        <SectionTitle
          index="STEP 04 / 06"
          title="Photo Upload"
          subtitle="Passport-style 400×400 JPEG · cropped & compressed"
        />

        {error && (
          <div className="mb-4 p-3 rounded-md border border-destructive/50 bg-destructive/10 font-mono text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {members.map((m, i) => {
            const ph = photos[i];
            const name = m.full_name || `Member ${i + 1}`;
            const isLeader = i === 0;
            return (
              <div key={i} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden relative">
                  {ph?.previewUrl ? (
                    <>
                      <img src={ph.previewUrl} alt={name} className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-white flex items-center gap-1">
                          <RefreshCw size={12} /> Re-upload
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => onPick(i, e.target.files?.[0])}
                        />
                      </label>
                    </>
                  ) : (
                    <label className="photo-slot-empty rounded-lg w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <span className="relative z-10 flex flex-col items-center gap-1.5 text-muted-foreground">
                        <Camera size={22} />
                        <span className="font-mono text-[10px] uppercase tracking-wider">Upload</span>
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => onPick(i, e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {isLeader && <Crown size={11} className="text-amber-edge flex-shrink-0" />}
                  <p className="font-mono text-[10px] uppercase tracking-wider truncate">
                    {name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-8 gap-3">
          <button className="btn-ghost" onClick={onBack}>
            <ArrowLeft size={16} className="inline mr-1" /> Back
          </button>
          <button className="btn-primary" onClick={onNext} disabled={!allFilled}>
            Next <ArrowRight size={16} />
          </button>
        </div>
      </Panel>

      {cropFor && (
        <CropperModal
          imageSrc={cropFor.src}
          memberName={members[cropFor.index].full_name || `Member ${cropFor.index + 1}`}
          onCancel={() => setCropFor(null)}
          onDone={(blob) => {
            const url = URL.createObjectURL(blob);
            setPhoto(cropFor.index, { blob, previewUrl: url });
            setCropFor(null);
          }}
        />
      )}
    </div>
  );
}
