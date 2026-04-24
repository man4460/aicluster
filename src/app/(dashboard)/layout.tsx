import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TokenGate } from "@/components/dashboard/TokenGate";
import { isDemoSessionUsername } from "@/lib/auth/demo-account";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { computeDashboardAccessAllowed } from "@/lib/tokens/dashboard-access";
import { applyBuffetMonthlyBilling } from "@/lib/tokens/buffet-monthly-billing";
import { applyDailyTokenDeduction } from "@/lib/tokens/daily-deduction";
import { canAccessAppModule } from "@/lib/modules/access";
import {
  displayAppModuleTitle,
  filterAppModulesForDashboardUi,
  MQTT_SERVICE_MODULE_SLUG,
} from "@/lib/modules/config";
import { SYSTEM_MAP_CATALOG_SLUG } from "@/lib/modules/system-map-catalog";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";

function DashboardDataError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white p-8 text-center">
      <p className="max-w-md text-sm font-medium text-amber-950">{message}</p>
      <p className="max-w-lg text-xs leading-relaxed text-slate-600">
        ตรวจสอบว่า MySQL ทำงานและค่า <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> ใน{" "}
        <code className="rounded bg-slate-100 px-1">.env</code> ถูกต้อง จากนั้นรีสตาร์ทเซิร์ฟเวอร์ Next
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          href="/dashboard"
          className="rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#000098]"
        >
          ลองกลับแดชบอร์ด
        </a>
        <a
          href="/login"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          เข้าสู่ระบบใหม่
        </a>
      </div>
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await applyDailyTokenDeduction(session.sub);
    await applyBuffetMonthlyBilling(session.sub);
  } catch (e) {
    console.error("[token billing]", e);
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        username: true,
        fullName: true,
        role: true,
        tokens: true,
        subscriptionTier: true,
        subscriptionType: true,
        lastBuffetBillingMonth: true,
        avatarUrl: true,
        employerUserId: true,
      },
    });
  } catch (e) {
    console.error("[dashboard layout] user lookup", e);
    return (
      <DashboardDataError message="โหลดข้อมูลผู้ใช้ไม่สำเร็จ — อาจเชื่อมต่อฐานข้อมูลไม่ได้" />
    );
  }

  if (!user) redirect("/login");

  let billCtx;
  try {
    billCtx = await getModuleBillingContext(session.sub);
  } catch (e) {
    console.error("[dashboard layout] billing context", e);
    return <DashboardDataError message="โหลดบริบทการสมัครใช้งานไม่สำเร็จ — ตรวจสอบฐานข้อมูล" />;
  }
  if (!billCtx) redirect("/login");

  let allModulesRaw;
  try {
    allModulesRaw = await prisma.appModule.findMany({
      where: { isActive: true },
      orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, slug: true, title: true, groupId: true },
    });
  } catch (e) {
    console.error("[dashboard layout] app modules", e);
    return <DashboardDataError message="โหลดรายการระบบไม่สำเร็จ — ตรวจสอบฐานข้อมูล" />;
  }
  const allModules = filterAppModulesForDashboardUi(allModulesRaw, user.role);

  const [subscribedIds, trialIds] = await Promise.all([
    listSubscribedModuleIds(session.sub).catch((e) => {
      console.error("[dashboard layout] subscriptions", e);
      return [] as string[];
    }),
    listTrialModuleIds(session.sub).catch((e) => {
      console.error("[dashboard layout] trials", e);
      return [] as string[];
    }),
  ]);
  const subscribedSet = new Set(subscribedIds);
  const trialSet = new Set(trialIds);

  const demoUser = isDemoSessionUsername(user.username);
  const allowDashboard = user.employerUserId
    ? true
    : demoUser
      ? true
      : computeDashboardAccessAllowed({
          role: user.role,
          subscriptionType: user.subscriptionType,
          subscriptionTier: user.subscriptionTier,
          tokens: user.tokens,
          lastBuffetBillingMonth: user.lastBuffetBillingMonth,
        });

  const accessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };

  let serviceModules = allModules
    .filter((m) => m.slug !== SYSTEM_MAP_CATALOG_SLUG)
    .filter((m) => !user.employerUserId || STAFF_ALLOWED_MODULE_SLUGS.has(m.slug))
    .filter((m) => subscribedSet.has(m.id) || trialSet.has(m.id))
    .filter(
      (m) =>
        user.role === "ADMIN" ||
        user.employerUserId ||
        canAccessAppModule(accessFields, { slug: m.slug, groupId: m.groupId }),
    )
    .map(({ slug, title, groupId }) => ({
      slug,
      title: displayAppModuleTitle(slug, title),
      groupId,
    }));

  if (!isMqttServiceModuleEnabled()) {
    serviceModules = serviceModules.filter((m) => m.slug !== MQTT_SERVICE_MODULE_SLUG);
  }

  serviceModules.sort((a, b) =>
    a.groupId !== b.groupId ? a.groupId - b.groupId : a.title.localeCompare(b.title, "th"),
  );

  const safeAvatar =
    user.avatarUrl && user.avatarUrl.startsWith("/uploads/") ? user.avatarUrl : null;

  const demoSession = demoUser;

  return (
    <DashboardShell
      username={user.username}
      displayName={user.fullName?.trim() || user.username}
      role={user.role}
      tokens={user.tokens}
      subscriptionTier={user.subscriptionTier}
      subscriptionType={user.subscriptionType}
      serviceModules={serviceModules}
      avatarUrl={safeAvatar}
      demoSession={demoSession}
    >
      <TokenGate allowDashboard={allowDashboard} role={user.role}>
        {children}
      </TokenGate>
    </DashboardShell>
  );
}
