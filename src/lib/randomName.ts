export function randomFileName(ext: string): string {
  const ts = Date.now();
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(rand)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${ts}-${hex}.${ext.replace(/^\./, "")}`;
}
