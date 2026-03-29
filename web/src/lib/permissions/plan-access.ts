/**
 * สิทธิ์แพ็กเกจ / โมดูล — ใช้ใน Server Components หรือ API
 * ตัวอย่าง: if (!canAccessAppModule(user, { slug, groupId })) redirect("/dashboard/plans?upgrade=1");
 */
export {
  canAccessAppModule,
  canAccessModuleGroup,
  isBuffetSubscriber,
  userMaxModuleGroup,
  tierGroupLabel,
  buffetTierMaxGroup,
  type UserAccessFields,
} from "@/lib/module-permissions";
