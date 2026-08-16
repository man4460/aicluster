import { barberPortalSlipOwnerTag } from "@/lib/barber/portal-slip-filename";

export function barberPortalSignaturePathPrefix(): string {
  return "/uploads/barber-portal-signatures/";
}

export function isValidBarberPortalSignatureUrl(
  ownerId: string,
  url: string | null | undefined,
): boolean {
  if (url == null || url.trim() === "") return true;
  const u = url.trim();
  const prefix = barberPortalSignaturePathPrefix();
  if (!u.startsWith(prefix)) return false;
  const base = u.slice(prefix.length);
  const tag = barberPortalSlipOwnerTag(ownerId);
  return base.startsWith(`s-${tag}-`) && !base.includes("..") && base.length < 200;
}
