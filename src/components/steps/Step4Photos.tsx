import { useState } from "react";
import { Panel, SectionTitle } from "@/components/ui-bits";
import { useFormStore } from "@/lib/store";
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_INPUT_BYTES,
  MAX_PHOTO_KB,
  MIN_PHOTO_KB,
  readFileAsDataURL,
} from "@/lib/imageUtil";
import { CropperModal } from "@/components/CropperModal";
import { supabase } from "@/lib/supabase";
import { saveDraft } from "@/lib/draft";
import { randomFileName } from "@/lib/randomName";
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  Crown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";

export function Step4Photos({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const members = useFormStore((s) => s.members);
  const photos = useFormStore((s) => s.photos);
  const setPhoto = useFormStore((s) => s.setPhoto);

  // Sequential index — points to current member being uploaded.
  // When >= members.length, show the final review grid.
  const firstEmpty = photos.findIndex((p) => !p.previewUrl && !p.storagePath);
  const [activeIdx, setActiveIdx] = useState<number>(
    firstEmpty === -1 ? members.length : firstEmpty,
  );

  const [cropFor, setCropFor] = useState<{ index: number; src: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const totalKb = photos.reduce((s, p) => s + (p.sizeKb ?? 0), 0);

  const onPick = async (i: number, file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError("Only JPG or PNG files are allowed.");
      return;
    }
    if (file.size > MAX_PHOTO_INPUT_BYTES) {
      setError("Source file too large. Max 5MB before crop.");
      return;
    }
    const src = await readFileAsDataURL(file);
    setCropFor({ index: i, src });
  };

  const onCropDone = async (i: number, blob: Blob) => {
    const sizeKb = Math.round(blob.size / 1024);
    if (sizeKb > MAX_PHOTO_KB) {
      setError(
        `Photo is ${sizeKb} KB which exceeds the ${MAX_PHOTO_KB} KB limit. Please reduce the source picture quality and try again.`,
      );
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // delete old photo if any
      const old = photos[i].storagePath;
      if (old) await supabase.storage.from("member-photos").remove([old]);

      const path = `${user.id}/${randomFileName("jpg")}`;
      const { error: upErr } = await supabase.storage
        .from("member-photos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw upErr;

      const previewUrl = URL.createObjectURL(blob);
      setPhoto(i, { storagePath: path, previewUrl, sizeKb });
      await saveDraft();
      setCropFor(null);

      // Auto-advance to next empty slot
      const nextEmpty = photos.findIndex((p, idx) => idx !== i && !p.storagePath && !p.previewUrl);
      // we need to compute against the freshly-updated photos — simpler:
      const updated = useFormStore.getState().photos;
      const next = updated.findIndex((p) => !p.storagePath);
      setActiveIdx(next === -1 ? members.length : next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const allFilled = photos.length === members.length && photos.every((p) => !!p.storagePath);

  const goNext = async () => {
    await saveDraft();
    onNext();
  };

  // If activeIdx is within members → wizard mode, else review mode
  const inWizard = activeIdx < members.length;
  const member = inWizard ? members[activeIdx] : null;
  const memberName = member?.full_name || `Member ${activeIdx + 1}`;
  const isLeader = activeIdx === 0;

  return (
    <div className="fade-up">
      <Panel>
        <SectionTitle
          index="STEP 04 / 06"
          title="Photo Upload"
          subtitle="Formal passport-style photos · used on ID cards throughout the hackathon"
        />

        {/* Storage budget */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-md border border-border bg-[oklch(0.16_0.03_270)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Per photo
            </p>
            <p className="font-mono text-sm text-cyan-edge">≤ {MAX_PHOTO_KB} KB</p>
          </div>
          <div className="rounded-md border border-border bg-[oklch(0.16_0.03_270)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Uploaded
            </p>
            <p className="font-mono text-sm text-foreground">
              {photos.filter((p) => p.storagePath).length} / {members.length} ·{" "}
              <span className="text-amber-edge">{totalKb} KB</span>
            </p>
          </div>
          <div className="rounded-md border border-border bg-[oklch(0.16_0.03_270)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Recommended
            </p>
            <p className="font-mono text-sm text-foreground">{MIN_PHOTO_KB}-{MAX_PHOTO_KB} KB each</p>
          </div>
        </div>

        <div className="mb-5 flex items-start gap-2 p-3 rounded-md border border-cyan-edge/30 bg-[oklch(0.85_0.16_200_/_0.05)]">
          <Info size={14} className="text-cyan-edge flex-shrink-0 mt-0.5" />
          <p className="font-mono text-[11px] text-foreground/80 leading-relaxed">
            Use a <span className="text-cyan-edge">formal, well-lit head-and-shoulders</span> photo with a plain background.
            This image will be printed on your hackathon ID card. Avoid sunglasses, group photos, or low-light shots.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/10 font-mono text-xs text-destructive">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {inWizard ? (
          // ---- Sequential wizard for one member at a time ----
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLeader && <Crown size={16} className="text-amber-edge" />}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Member {activeIdx + 1} of {members.length}
                  </p>
                  <p className="font-semibold">{memberName}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {members.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full ${
                      photos[i]?.storagePath
                        ? "bg-cyan-edge"
                        : i === activeIdx
                          ? "bg-spider"
                          : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="aspect-square max-w-sm mx-auto rounded-lg overflow-hidden relative">
              {photos[activeIdx]?.previewUrl ? (
                <>
                  <img
                    src={photos[activeIdx]!.previewUrl!}
                    alt={memberName}
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/0 hover:bg-black/60 transition-colors cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-white flex items-center gap-1.5">
                      <RefreshCw size={14} /> Re-upload
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => onPick(activeIdx, e.target.files?.[0])}
                    />
                  </label>
                </>
              ) : (
                <label className="photo-slot-empty rounded-lg w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <span className="relative z-10 flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera size={32} />
                    <span className="font-mono text-xs uppercase tracking-wider">
                      Upload Photo
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      JPG or PNG · max 5MB source
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => onPick(activeIdx, e.target.files?.[0])}
                  />
                </label>
              )}
            </div>

            {photos[activeIdx]?.sizeKb && (
              <p className="text-center font-mono text-[11px] text-cyan-edge">
                <CheckCircle2 size={12} className="inline mr-1" />
                Saved · {photos[activeIdx].sizeKb} KB
              </p>
            )}

            <div className="flex justify-between gap-3 pt-2">
              <button
                className="btn-ghost"
                onClick={() => {
                  if (activeIdx === 0) onBack();
                  else setActiveIdx(activeIdx - 1);
                }}
                disabled={uploading}
              >
                <ArrowLeft size={16} className="inline mr-1" />
                {activeIdx === 0 ? "Back" : "Previous"}
              </button>
              <button
                className="btn-primary"
                onClick={() => setActiveIdx(activeIdx + 1)}
                disabled={!photos[activeIdx]?.storagePath || uploading}
              >
                {activeIdx === members.length - 1 ? "Review All" : "Next Member"}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          // ---- Final review grid ----
          <div className="space-y-4">
            <p className="font-mono text-[11px] text-muted-foreground">
              Verify each photo matches the correct member. Click any tile to re-upload.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {members.map((m, i) => {
                const ph = photos[i];
                const name = m.full_name || `Member ${i + 1}`;
                return (
                  <div key={i} className="space-y-2">
                    <div className="aspect-square rounded-lg overflow-hidden relative border border-border">
                      {ph?.previewUrl ? (
                        <>
                          <img src={ph.previewUrl} alt={name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setActiveIdx(i)}
                            className="absolute inset-0 bg-black/0 hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
                          >
                            <span className="font-mono text-[10px] uppercase tracking-wider text-white">
                              Edit
                            </span>
                          </button>
                        </>
                      ) : (
                        <div className="bg-muted w-full h-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {i === 0 && <Crown size={11} className="text-amber-edge flex-shrink-0" />}
                      <p className="font-mono text-[10px] uppercase tracking-wider truncate">
                        {name}
                      </p>
                    </div>
                    {ph?.sizeKb && (
                      <p className="font-mono text-[9px] text-muted-foreground">{ph.sizeKb} KB</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <button className="btn-ghost" onClick={() => setActiveIdx(0)}>
                <ArrowLeft size={16} className="inline mr-1" /> Edit Photos
              </button>
              <button className="btn-primary" onClick={goNext} disabled={!allFilled}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Panel>

      {cropFor && (
        <CropperModal
          imageSrc={cropFor.src}
          memberName={members[cropFor.index].full_name || `Member ${cropFor.index + 1}`}
          onCancel={() => setCropFor(null)}
          onDone={(blob) => onCropDone(cropFor.index, blob)}
        />
      )}
    </div>
  );
}
