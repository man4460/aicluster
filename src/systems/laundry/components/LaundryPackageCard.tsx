"use client";

import { cn } from "@/lib/cn";
import { formatLaundryDurationHoursTh } from "@/systems/laundry/laundry-duration-hours";
import type { LaundryPackage } from "@/systems/laundry/laundry-service";
import {
  LaundryIconEye,
  LaundryIconPencil,
  LaundryIconTrash,
  LaundryToolbarIconButton,
} from "@/systems/laundry/components/LaundryToolbarIconButton";

function laundryPricingModelLabelTh(m: LaundryPackage["pricing_model"]): string {
  switch (m) {
    case "PER_KG":
      return "ต่อกก.";
    case "PER_ITEM":
      return "ต่อชิ้น";
    case "FLAT":
      return "เหมาจ่าย";
    default: {
      const _x: never = m;
      return _x;
    }
  }
}

function packageDescriptionMeaningful(raw: string | null | undefined): boolean {
  const t = raw?.trim() ?? "";
  return t !== "" && t !== "-" && t !== "–" && t !== "—";
}

/** ป้ายหัวข้อย่อย — ไม่มีกล่อง/pill */
const labelKicker =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]";

/** เวลาประมาณ + แถวตะกร้า — ตัวอักษรเล็กเท่ากัน · มือถือระยะชิดกว่า (`gap-y-1`) · `sm+` ห่างขึ้น (`gap-y-2`) */
const detailStackClass = "flex min-w-0 flex-col gap-y-1 sm:gap-y-2";
const detailRowClass =
  "flex min-w-0 items-baseline justify-between gap-3 text-[9px] leading-[1.45] sm:text-[10px]";
const detailTextLeft = "font-semibold text-slate-600";
const detailTextRight = "font-semibold tabular-nums text-slate-700";

/** การ์ดแพ็กเกจแท็บ «แพ็กเกจ» — เน้นข้อความล้วน ไม่ใช้กล่องภายใน */
export function LaundryPackageCard({
  pkg: p,
  onView,
  onEdit,
  onDelete,
  packagesTabRowLayout = false,
}: {
  pkg: LaundryPackage;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  packagesTabRowLayout?: boolean;
}) {
  const showDesc = packageDescriptionMeaningful(p.description);
  const tiers = p.basket_tiers?.filter((t) => t.label?.trim()) ?? [];

  return (
    <article
      className={cn(
        "group/item relative flex w-full flex-col overflow-hidden rounded-xl border border-indigo-200/70 bg-white/90 p-2.5 text-left sm:rounded-2xl sm:p-4",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-gradient-to-b opacity-80 transition-all duration-300 group-hover/item:w-1 sm:bottom-3 sm:top-3",
          "from-indigo-400 via-violet-500 to-purple-600",
        )}
      />

      <div className={cn("relative flex gap-2 sm:gap-5", packagesTabRowLayout && "sm:items-center")}>
        <div
          className={cn(
            "flex min-w-0 flex-1 gap-2 sm:gap-4 sm:pl-1",
            packagesTabRowLayout && "sm:min-h-[4rem] sm:items-center",
          )}
        >
          <div
            className={cn(
              "relative h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-[5rem] sm:w-[5rem] sm:rounded-xl",
              packagesTabRowLayout && "sm:h-[4rem] sm:w-[4rem]",
            )}
          >
            {p.image_url ?
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
            : <div className="flex h-full items-center justify-center px-1 text-center text-[9px] font-medium text-slate-400 sm:text-[10px]">
                ไม่มีรูป
              </div>
            }
          </div>

          <div className={cn("min-w-0 flex-1 space-y-1.5 sm:space-y-2", packagesTabRowLayout && "sm:space-y-1.5")}>
            <div
              className={cn(
                packagesTabRowLayout &&
                  "sm:flex sm:min-w-0 sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2",
              )}
            >
              <div className={cn("min-w-0", packagesTabRowLayout && "sm:max-w-[14rem] sm:flex-shrink-0 lg:max-w-[min(36vw,17rem)]")}>
                <p className={labelKicker}>แพ็กเกจ</p>
                <p className="mt-px line-clamp-2 min-w-0 break-words bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-[0.9375rem] font-bold leading-snug tracking-tight text-transparent sm:mt-0.5 sm:text-lg">
                  {p.name.trim() || "—"}
                </p>
              </div>

              {showDesc ?
                <p
                  className={cn(
                    "line-clamp-2 text-[11px] leading-relaxed text-slate-600 sm:text-xs",
                    packagesTabRowLayout && "sm:order-last sm:basis-full sm:line-clamp-1",
                  )}
                >
                  {p.description.trim()}
                </p>
              : null}

              {(p.duration_hours > 0 || tiers.length > 0) ?
                <div
                  className={cn(
                    detailStackClass,
                    "border-t border-indigo-100/70 pt-1.5 sm:pt-2",
                    packagesTabRowLayout &&
                      "sm:flex-1 sm:min-w-[11rem] sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2 sm:border-0 sm:border-l sm:border-indigo-100 sm:pt-0 sm:pl-4",
                  )}
                >
                  {p.duration_hours > 0 ?
                    <div
                      className={cn(
                        detailRowClass,
                        packagesTabRowLayout && "sm:inline-flex sm:w-auto sm:flex-none sm:shrink-0",
                      )}
                    >
                      <span className={cn(detailTextLeft, "shrink-0")}>เวลาประมาณ</span>
                      <span className={cn(detailTextRight, "min-w-0 text-right sm:text-left")}>
                        {formatLaundryDurationHoursTh(p.duration_hours)}
                      </span>
                    </div>
                  : null}
                  {tiers.length > 0 ?
                    <ul
                      className={cn(
                      detailStackClass,
                      "list-none p-0",
                      packagesTabRowLayout && "sm:flex sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2",
                    )}
                      aria-label="ราคาตามขนาดตะกร้า"
                    >
                      {tiers.map((t, i) => (
                        <li
                          key={`${t.label}-${t.price}-${i}`}
                          className={cn(
                            detailRowClass,
                            packagesTabRowLayout &&
                              "sm:inline-flex sm:w-auto sm:max-w-none sm:shrink-0 sm:whitespace-nowrap",
                          )}
                        >
                          <span
                            className={cn(
                              detailTextLeft,
                              "min-w-0",
                              packagesTabRowLayout ? "max-sm:truncate sm:whitespace-normal" : "truncate",
                            )}
                          >
                            {t.label.trim()}
                          </span>
                          <span className={cn(detailTextRight, "shrink-0 text-right sm:text-left")}>
                            ฿{t.price.toLocaleString("th-TH")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  : null}
                </div>
              : null}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-[6rem] w-[32%] max-w-[9rem] shrink-0 flex-col justify-between pt-0 pl-2 sm:min-w-[9rem] sm:w-[9rem] sm:max-w-none sm:pt-0.5 sm:pl-3",
            packagesTabRowLayout &&
              "sm:w-auto sm:max-w-none sm:flex-shrink-0 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:pl-5 sm:pt-0",
          )}
        >
          <div
            className={cn(
              "flex flex-col items-end gap-0.5 text-right text-[11px] sm:gap-1 sm:text-xs",
              !packagesTabRowLayout && "pb-1.5 sm:pb-3",
              packagesTabRowLayout && "sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-end sm:gap-x-3 sm:gap-y-1 sm:pb-0",
            )}
          >
            <p className="max-w-full leading-snug text-slate-600">
              <span className="font-medium">{laundryPricingModelLabelTh(p.pricing_model)}</span>
              <span className="mx-1.5 text-slate-300" aria-hidden>
                ·
              </span>
              <span className={cn("font-semibold", p.is_active ? "text-emerald-700" : "text-slate-500")}>
                {p.is_active ? "ใช้งาน" : "ปิด"}
              </span>
              <span className="mx-1.5 text-slate-300" aria-hidden>
                ·
              </span>
              <span className="font-semibold tabular-nums text-slate-500">#{p.id}</span>
            </p>
            <p className="text-base font-bold tabular-nums tracking-tight text-emerald-700 sm:text-lg">
              ฿{p.base_price.toLocaleString("th-TH")}
            </p>
          </div>

          <div
            className={cn(
              "mt-auto flex flex-row flex-nowrap items-center justify-end gap-1 pt-1.5 sm:pt-3",
              packagesTabRowLayout && "sm:mt-0 sm:pt-0",
            )}
          >
            <LaundryToolbarIconButton label="ดูข้อมูลแพ็กเกจ" onClick={onView}>
              <LaundryIconEye />
            </LaundryToolbarIconButton>
            <LaundryToolbarIconButton label="แก้ไขแพ็กเกจ" onClick={onEdit}>
              <LaundryIconPencil />
            </LaundryToolbarIconButton>
            <LaundryToolbarIconButton label="ลบแพ็กเกจ" variant="danger" onClick={onDelete}>
              <LaundryIconTrash />
            </LaundryToolbarIconButton>
          </div>
        </div>
      </div>
    </article>
  );
}
