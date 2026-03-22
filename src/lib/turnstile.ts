export async function verifyTurnstileToken(token: string | undefined, remoteIp: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  if (!token) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
