import imageCompression from "browser-image-compression";

/**
 * Crops an image source URL using a pixel area and returns a 600x600 JPEG Blob
 * compressed to roughly 500KB-900KB (good for ID-card use).
 */
export async function getCroppedJpeg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const OUT = 600;
  canvas.width = OUT;
  canvas.height = OUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, OUT, OUT);
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUT,
    OUT,
  );

  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.92),
  );
  // Compress to ≤ 0.85MB (~870KB) for ID-card-quality output.
  const file = new File([blob], "crop.jpg", { type: "image/jpeg" });
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.85,
    maxWidthOrHeight: 600,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.88,
  });
  return compressed;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png"];
export const MAX_PHOTO_INPUT_BYTES = 5 * 1024 * 1024;

// Per-photo storage limits
export const MIN_PHOTO_KB = 100;
export const MAX_PHOTO_KB = 950;
