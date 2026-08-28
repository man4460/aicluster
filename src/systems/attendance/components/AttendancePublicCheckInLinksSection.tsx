import {
  PublicCheckInLinkCopy,
  type PublicCheckInLinkNotice,
} from "@/systems/attendance/components/PublicCheckInLinkCopy";
import { publicCheckInUrl } from "@/systems/attendance/lib/public-check-in-url";

type Props = {
  ownerSub: string;
  baseUrl: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  locations: { id: number; name: string }[];
  faceLinkNotice: PublicCheckInLinkNotice;
};

function resolveUrl(
  ctx: Props,
  locId: number | null,
  faceKiosk?: boolean,
) {
  const prefix = ctx.baseUrl || "";
  return publicCheckInUrl(prefix, ctx.ownerSub, locId, ctx.trialSessionId, ctx.isTrialSandbox, {
    faceKiosk,
  });
}

export function AttendancePublicCheckInLinksSection(props: Props) {
  const { locations, faceLinkNotice } = props;

  return (
    <div className="space-y-4">
      {locations.length <= 1 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <PublicCheckInLinkCopy
            title="เช็คอินแบบเดิม"
            description="เบอร์โทร · บุคคลภายนอก"
            tone="violet"
            url={resolveUrl(props, locations[0]?.id ?? null)}
          />
          <PublicCheckInLinkCopy
            title="สแกนใบหน้า"
            description="ลิงก์ iPad ที่จุดเช็ค"
            tone="emerald"
            notice={faceLinkNotice}
            url={resolveUrl(props, locations[0]?.id ?? null, true)}
          />
        </div>
      ) : (
        locations.map((loc) => {
          const locLabel = loc.name.trim() || `จุด #${loc.id}`;
          return (
            <div key={loc.id} className="space-y-2">
              <p className="text-xs font-bold text-[#5f5a8a] line-clamp-1" title={locLabel}>
                {locLabel}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <PublicCheckInLinkCopy
                  title="เช็คอินแบบเดิม"
                  description={locLabel}
                  tone="violet"
                  url={resolveUrl(props, loc.id)}
                />
                <PublicCheckInLinkCopy
                  title="สแกนใบหน้า"
                  description={locLabel}
                  tone="emerald"
                  notice={faceLinkNotice}
                  url={resolveUrl(props, loc.id, true)}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
