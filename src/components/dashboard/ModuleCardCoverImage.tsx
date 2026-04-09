import { isSafeModuleCardImageUrl } from "@/lib/module-card-image";
import { cn } from "@/lib/cn";

export function ModuleCardCoverImage({
  url,
  className,
}: {
  url: string | null | undefined;
  className?: string;
}) {
  const safe = url && isSafeModuleCardImageUrl(url) ? url : null;
  if (!safe) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- path จาก DB ภายใน public เท่านั้น
    <img
      src={safe}
      alt=""
      className={cn("overflow-hidden rounded-2xl object-cover", className)}
      loading="lazy"
    />
  );
}
