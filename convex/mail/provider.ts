export type MailProvider = "gmail" | "mock";

/** The production Convex deployment. Mock mail must never run here. */
export const PRODUCTION_CLOUD_URL = "https://incredible-crane-757.convex.cloud";

function isProductionDeployment(cloudUrl: string | undefined): boolean {
  return cloudUrl?.trim().toLowerCase().replace(/\/+$/, "") === PRODUCTION_CLOUD_URL;
}

/**
 * Unknown or unset provider returns null (callers treat it as service_unavailable).
 * "mock" is refused unless `allowMock` (MAIL_ALLOW_MOCK=true) is also set, so a stray
 * MAIL_PROVIDER=mock in production can never log codes instead of sending them. A third guard
 * refuses "mock" outright on the production deployment (`cloudUrl` = CONVEX_CLOUD_URL),
 * even if both variables are set.
 */
export function resolveProvider(
  value: string | undefined,
  allowMock: string | undefined = undefined,
  cloudUrl: string | undefined = undefined,
): MailProvider | null {
  const v = value?.trim().toLowerCase();
  if (v === "gmail") return "gmail";
  if (v === "mock") {
    if (isProductionDeployment(cloudUrl)) return null;
    return allowMock?.trim().toLowerCase() === "true" ? "mock" : null;
  }
  return null;
}
