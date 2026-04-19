import DOMPurify from "dompurify";

export const clean = (v: string): string =>
  DOMPurify.sanitize(v ?? "", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();

export const cleanLetters = (v: string): string =>
  clean(v).replace(/[^a-zA-Z\s.'-]/g, "");

export const cleanAlnumSpaces = (v: string): string =>
  clean(v).replace(/[^a-zA-Z0-9\s]/g, "");

export const cleanAlnum = (v: string): string =>
  clean(v).replace(/[^a-zA-Z0-9]/g, "");

export const cleanDigits = (v: string, max = 10): string =>
  clean(v).replace(/\D/g, "").slice(0, max);

export const cleanUpperAlnum = (v: string): string =>
  clean(v).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

// Allows letters, digits, spaces, hyphens, slashes — for problem statement IDs
export const cleanCode = (v: string): string =>
  clean(v).replace(/[^a-zA-Z0-9\s\-/_.]/g, "").slice(0, 60);
