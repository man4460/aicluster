import { MawellLogo } from "@/components/layout/MawellLogo";

type Props = {
  /** ชื่อองค์กร / ร้าน */
  orgLine?: string | null;
  logoUrl?: string | null;
  className?: string;
};

export function MawellThBrandHeader({ orgLine, logoUrl, className }: Props) {
  return (
    <header className={className}>
      <div className="flex flex-col items-center gap-3 text-center">
        {logoUrl ? (
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain p-1" />
          </div>
        ) : null}
        <MawellLogo size="lg" />
        <p className="text-sm font-semibold tracking-wide text-slate-700">หจก. มาเวล</p>
        {orgLine ? <p className="text-xs font-medium text-[#0000BF]">{orgLine}</p> : null}
      </div>
    </header>
  );
}
