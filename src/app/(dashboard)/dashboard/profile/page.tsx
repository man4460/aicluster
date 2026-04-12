import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { isDemoSessionUsername } from "@/lib/auth/demo-account";

export const metadata: Metadata = {
  title: "โปรไฟล์ | MAWELL Buffet",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, prodDorm, barberScope] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        email: true,
        username: true,
        subscriptionTier: true,
        subscriptionType: true,
        fullName: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        avatarUrl: true,
        tokens: true,
        referredByUserId: true,
        referredBy: { select: { phone: true, username: true } },
      },
    }),
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: session.sub,
          trialSessionId: TRIAL_PROD_SCOPE,
        },
      },
      select: { promptPayPhone: true, paymentChannelsNote: true, defaultPaperSize: true },
    }),
    getBarberDataScope(session.sub),
  ]);

  if (!user) redirect("/login");

  const business = await getBusinessProfile(session.sub, {
    barberTrialSessionId: barberScope.trialSessionId,
  });

  const { referredBy, ...userForEditor } = user;
  const referrerSummary =
    user.referredByUserId && referredBy
      ? referredBy.phone?.trim() || (referredBy.username ? `@${referredBy.username}` : null)
      : null;
  const demoAccount = isDemoSessionUsername(user.username);

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="app-surface relative overflow-hidden rounded-3xl border border-white/70 px-5 py-6 shadow-[0_16px_48px_-24px_rgba(79,70,229,0.2)] sm:px-8 sm:py-7">
        <div
          className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#c7d2fe]/50 to-fuchsia-200/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-[#0000BF]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0000BF]/75">MAWELL Buffet</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2e2a58] sm:text-3xl">โปรไฟล์</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#66638c]">
            ตั้งค่าบริษัท/ร้านส่วนกลาง: รูปโปรไฟล์ (โลโก้) ชื่อร้าน ที่อยู่ เบอร์ติดต่อ โลเคชั่น และเลขกำกับภาษี — ใช้ร่วมทุกระบบ
          </p>
        </div>
      </header>
      <ProfileEditor
        initial={{
          ...userForEditor,
          taxId: business?.taxId ?? null,
          promptPayPhone: prodDorm?.promptPayPhone ?? null,
          paymentChannelsNote: prodDorm?.paymentChannelsNote ?? null,
          defaultPaperSize: prodDorm?.defaultPaperSize ?? "SLIP_58",
          referrerLocked: Boolean(user.referredByUserId),
          referrerSummary,
          demoAccount,
        }}
      />
    </div>
  );
}
