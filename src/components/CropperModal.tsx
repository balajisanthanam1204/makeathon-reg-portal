import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedJpeg } from "@/lib/imageUtil";
import { X, Check } from "lucide-react";

type Area = { x: number; y: number; width: number; height: number };

export function CropperModal({
  imageSrc,
  memberName,
  onCancel,
  onDone,
}: {
  imageSrc: string;
  memberName: string;
  onCancel: () => void;
  onDone: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_c: Area, pix: Area) => setArea(pix), []);

  const handleSave = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await getCroppedJpeg(imageSrc, area);
      onDone(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="panel w-full max-w-md p-4">
        <span className="panel-corner-tl" />
        <span className="panel-corner-tr" />
        <span className="panel-corner-bl" />
        <span className="panel-corner-br" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-spider">
                Crop · 400×400
              </p>
              <p className="font-semibold text-sm truncate max-w-[14rem]">{memberName}</p>
            </div>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="relative w-full aspect-square bg-black rounded-md overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
              cropShape="rect"
              showGrid
            />
          </div>

          <div className="mt-4 space-y-1.5">
            <label>Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>

          <div className="flex gap-3 mt-5">
            <button className="btn-ghost flex-1" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={busy}>
              {busy ? "Processing…" : (
                <>
                  <Check size={16} /> Save Crop
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
