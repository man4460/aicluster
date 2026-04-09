/**
 * OAuth 2.0 กับ Google (Authorization Code) — ไม่ใช้ SDK เพื่อลด dependency
 */

/** Client ID — รองรับ GOOGLE_CLIENT_ID หรือ NEXT_PUBLIC_GOOGLE_CLIENT_ID (ค่าเดียวกับหน้า Google Cloud) */
export function getGoogleOAuthClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ""
  );
}

function getGoogleOAuthClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getGoogleOAuthClientId() && getGoogleOAuthClientSecret());
}

export function getGoogleRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function buildGoogleAuthorizationUrl(params: { state: string; redirectUri: string }): string {
  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", params.state);
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleOAuthClientId(),
      client_secret: getGoogleOAuthClientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { access_token?: string };
  if (typeof j.access_token !== "string") return null;
  return { access_token: j.access_token };
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as Record<string, unknown>;
  const sub = typeof j.sub === "string" ? j.sub : null;
  const email = typeof j.email === "string" ? j.email : null;
  const email_verified = j.email_verified === true;
  if (!sub || !email) return null;
  return {
    sub,
    email,
    email_verified,
    name: typeof j.name === "string" ? j.name : undefined,
    picture: typeof j.picture === "string" ? j.picture : undefined,
  };
}
