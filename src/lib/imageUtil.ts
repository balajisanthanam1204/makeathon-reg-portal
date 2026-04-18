import imageCompression from "browser-image-compression";

/**
 * Crops an image source URL using a pixel area and returns a 400x400 JPEG Blob
 * compressed to under ~200KB.
 */
export async function getCroppedJpeg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, 400, 400);
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    400,
    400,
  );

  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.9),
  );
  // Compress to ≤200KB
  const file = new File([blob], "crop.jpg", { type: "image/jpeg" });
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.85,
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
