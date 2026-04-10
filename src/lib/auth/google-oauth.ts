/**
 * OAuth 2.0 กับ Google (Authorization Code) — ไม่ใช้ SDK เพื่อลด dependency
 */

import { createHash, randomBytes } from "crypto";

/** PKCE — Google แนะนำ / บังคับในบางกรณี เพื่อลด invalid_request ด้านนโยบาย */
export function createGooglePkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

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

/**
 * Origin สำหรับ Google redirect_uri — ห้ามส่ง 0.0.0.0 / [::] (Google ไม่รับ)
 * ใช้ Host / X-Forwarded-* ก่อน req.url (เพราะ next dev -H 0.0.0.0 มักได้ URL เป็น http://0.0.0.0:3000)
 */
export function resolveGoogleOAuthOrigin(req: Request): string {
  const url = new URL(req.url);
  const xfHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const xfProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const hostHdr = req.headers.get("host")?.split(",")[0]?.trim();

  let hostPort = xfHost || hostHdr || url.host;
  if (!hostPort) {
    hostPort = url.port ? `${url.hostname}:${url.port}` : url.hostname;
  }

  hostPort = hostPort.replace(/\b0\.0\.0\.0\b/g, "localhost");
  if (hostPort === "[::]" || hostPort.startsWith("[::]:")) {
    const rest = hostPort.startsWith("[::]:") ? hostPort.slice("[::]:".length) : "";
    hostPort = rest ? `localhost:${rest}` : url.port ? `localhost:${url.port}` : "localhost";
  }

  let hostnameForCheck = "";
  if (hostPort.startsWith("[")) {
    const end = hostPort.indexOf("]");
    hostnameForCheck = end !== -1 ? hostPort.slice(1, end).toLowerCase() : "";
  } else {
    hostnameForCheck = (hostPort.split(":")[0] ?? "").toLowerCase();
  }

  let protocol: "http" | "https" =
    xfProto === "https" || xfProto === "http" ?
      xfProto
    : url.protocol === "https:" ? "https"
    : "http";

  const isLocalDevHost =
    hostnameForCheck === "localhost" ||
    hostnameForCheck === "127.0.0.1" ||
    hostnameForCheck === "::1";
  if (process.env.NODE_ENV !== "production" && isLocalDevHost) {
    protocol = "http";
  }

  return `${protocol}://${hostPort}`;
}

export function buildGoogleAuthorizationUrl(params: {
  state: string;
  redirectUri: string;
  codeChallenge: string;
}): string {
  const clientId = getGoogleOAuthClientId();
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", params.state);
  u.searchParams.set("prompt", "select_account");
  u.searchParams.set("code_challenge", params.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  return u.toString();
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
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
      code_verifier: codeVerifier,
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
