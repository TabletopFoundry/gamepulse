/** Extract a single value from a search-param entry that may be string, string[], or undefined. */
export function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse a JSON string with a fallback value if parsing fails — prevents malformed DB rows from crashing pages. */
export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Safely serialize data for JSON-LD <script> tags, escaping sequences that could break out of the script context. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Escape SQL LIKE special characters (% and _) so they are matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[%_]/g, (char) => `\\${char}`);
}
