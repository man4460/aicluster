import { massagePortalSlipOwnerTag } from "@/lib/massage/portal-slip-filename";

export function massagePortalSignaturePathPrefix(): string {
  return "/uploads/massage-portal-signatures/";
}

export function isValidMassagePortalSignatureUrl(
  ownerId: string,
  url: string | null | undefined,
): boolean {
  if (url == null || url.trim() === "") return true;
  const u = url.trim();
  const prefix = massagePortalSignaturePathPrefix();
  if (!u.startsWith(prefix)) return false;
  const base = u.slice(prefix.length);
  const tag = massagePortalSlipOwnerTag(ownerId);
  return base.startsWith(`s-${tag}-`) && !base.includes("..") && base.length < 200;
}
