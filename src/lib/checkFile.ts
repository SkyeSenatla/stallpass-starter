export const MAX_BYTES= 2* 1024*1024; // 2MB
const OK = ["application/pdf", "image/jpeg", "image/png"];
export function checkFile(file: File): string | null {
  if (!OK.includes(file.type)) return `File type must be one of: ${OK.join(", ")}`;
  if (file.size > MAX_BYTES) return `File size must be less than ${MAX_BYTES} bytes`;
  return null;
}