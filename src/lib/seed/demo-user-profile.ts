/**
 * โปรไฟล์กลางสำหรับบัญชี user demo — ตรงกับข้อมูลบริษัทบนหน้าโปรไฟล์ MAWELL
 * ใช้ใน prisma/seed.ts เท่านั้น (ไม่ใส่ให้ admin@mawell.local)
 */
export const DEMO_USER_PROFILE_SEED = {
  fullName: "หจก.มาเวล",
  phone: "0815418771",
  address: "222/285 ม.1 ต.บางคูวัด อ.เมือง จ.ปทุมธานี 12000",
  latitude: 13.95850284256917,
  longitude: 100.481584149332,
  avatarUrl: "/uploads/avatars/seed-mawell-demo.svg",
} as const;
