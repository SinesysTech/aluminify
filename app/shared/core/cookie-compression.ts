import { deflate, inflate } from "pako";

function base64Encode(input: string): string {
  try {
    return btoa(input);
  } catch {
    // Fallback (ex.: em ambientes que não expõem btoa)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).Buffer.from(input, "utf-8").toString("base64");
  }
}

function base64Decode(input: string): string {
  try {
    return atob(input);
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).Buffer.from(input, "base64").toString("utf-8");
  }
}

export function compressCookieValue(value: string): string {
  const compressed = deflate(value);
  const bytes = new Uint8Array(compressed);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `pako:${base64Encode(binary)}`;
}

export function decompressCookieValue(value: string): string {
  if (!value.startsWith("pako:")) return value;
  const payload = value.slice("pako:".length);
  const binary = base64Decode(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return inflate(bytes, { to: "string" });
}

export function shouldCompressCookie(name: string, value: string): boolean {
  if (!name.startsWith("sb-") || !name.includes("-auth-token")) return false;
  return value.length >= 1024;
}

export function isCompressedCookie(value: string): boolean {
  return typeof value === "string" && value.startsWith("pako:");
}

export function buildCookieHeader(
  cookies: Array<{ name: string; value: string }>,
): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}
