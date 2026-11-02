/**
 * Parses multiline text where lines starting with `-`, `*`, or `•` are bullet list items.
 * Cleaned and returned as string array to render as <li> elements.
 */
export function parseBulletList(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length > 0);
}
