export type MailProvider = "gmail" | "mock";

/**
 * Unknown or unset provider returns null (callers treat it as service_unavailable).
 * "mock" is refused unless `allowMock` (MAIL_ALLOW_MOCK=true) is also set, so a stray
 * MAIL_PROVIDER=mock in production can never log codes instead of sending them.
 */
export function resolveProvider(
  value: string | undefined,
  allowMock: string | undefined = undefined,
): MailProvider | null {
  const v = value?.trim().toLowerCase();
  if (v === "gmail") return "gmail";
  if (v === "mock") return allowMock?.trim().toLowerCase() === "true" ? "mock" : null;
  return null;
}
