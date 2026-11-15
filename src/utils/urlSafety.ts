// src/utils/urlSafety.ts

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Validates an external link URL before rendering it as an anchor element.
 * Returns the normalized safe href for http/https/mailto URLs, or null for
 * javascript:, data:, vbscript:, relative/ambiguous, or malformed URLs.
 */
export function sanitizeExternalUrl(rawUrl: string | undefined | null): string | null {
  if (typeof rawUrl !== "string") return null;

  // Strip ASCII control chars / whitespace that browsers might normalize away
  const cleaned = rawUrl.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  if (!cleaned) return null;

  // Reject protocol-relative URLs (//evil.com) or explicit non-HTTP schemes
  if (cleaned.startsWith("//")) return null;

  try {
    const parsed = new URL(cleaned);
    const protocol = parsed.protocol.toLowerCase();
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
