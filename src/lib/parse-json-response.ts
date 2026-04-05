/**
 * Read Response body as JSON. Empty or non-JSON bodies become {} so callers avoid SyntaxError.
 */
export async function parseJsonResponse<T extends Record<string, unknown> = Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return {} as T;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return {} as T;
  }
}
