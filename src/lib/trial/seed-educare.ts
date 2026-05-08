import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type DbLike = Tx | PrismaClient;

function bangkokYmd(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function ymdToDateUTC(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function shiftYmd(ymd: string, deltaDays: number): string {
  const d = ymdToDateUTC(ymd);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return bangkokYmd(d);
}

const STUDENT_PHOTOS = {
  girl: [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518976024611-28bf4b48222e?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=200&q=80&auto=format&fit=crop",
  ],
  boy: [
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503944168849-8bf86f78d6ec?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1510924199351-4e9d94df18a6?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=200&q=80&auto=format&fit=crop",
  ],
};

type StudentSpec = {
  studentNo: string;
  fullName: string;
  nickname: string;
  gender: "M" | "F";
  parentName: string;
  parentPhone: string;
};

const ROOMS: ReadonlyArray<{
  name: string;
  grade: string;
  level: string;
  homeroomTeacherName: string;
  homeroomTeacherPhone: string;
  students: StudentSpec[];
}> = [
  {
    name: "อนุบาล 2/1",
    grade: "อ.2",
    level: "อนุบาล",
    homeroomTeacherName: "คุณครูสุภาวดี ใจดี",
    homeroomTeacherPhone: "081-234-5678",
    students: [
      { studentNo: "01", fullName: "ด.ช. ภคิน รักเรียน", nickname: "เก่ง", gender: "M", parentName: "คุณสมชาย รักเรียน", parentPhone: "081-111-1111" },
      { studentNo: "02", fullName: "ด.ญ. นภัสสร แสงทอง", nickname: "เพลง", gender: "F", parentName: "คุณนภา แสงทอง", parentPhone: "082-222-2222" },
      { studentNo: "03", fullName: "ด.ช. ปุณยวัจน์ ทรัพย์ดี", nickname: "ปลื้ม", gender: "M", parentName: "คุณปริญญา ทรัพย์ดี", parentPhone: "083-333-3333" },
      { studentNo: "04", fullName: "ด.ญ. ณัฏฐกานต์ พัฒน์ใหม่", nickname: "ฟ้า", gender: "F", parentName: "คุณกานต์ พัฒน์ใหม่", parentPhone: "084-444-4444" },
      { studentNo: "05", fullName: "ด.ช. กฤตภาส ตั้งใจ", nickname: "เปอร์", gender: "M", parentName: "คุณกฤษฎา ตั้งใจ", parentPhone: "085-555-5555" },
      { studentNo: "06", fullName: "ด.ญ. พิชญา ดีใจ", nickname: "พีช", gender: "F", parentName: "คุณพิมพ์ ดีใจ", parentPhone: "086-666-6666" },
      { studentNo: "07", fullName: "ด.ช. ชยานันท์ มั่งมี", nickname: "ชยา", gender: "M", parentName: "คุณชวลิต มั่งมี", parentPhone: "087-777-7777" },
      { studentNo: "08", fullName: "ด.ญ. ปุณณดา รุ่งโรจน์", nickname: "ปูเป้", gender: "F", parentName: "คุณปุณณ รุ่งโรจน์", parentPhone: "088-888-8888" },
    ],
  },
  {
    name: "อนุบาล 2/2",
    grade: "อ.2",
    level: "อนุบาล",
    homeroomTeacherName: "คุณครูปาริชาติ สดใส",
    homeroomTeacherPhone: "082-345-6789",
    students: [
      { studentNo: "01", fullName: "ด.ญ. ธนัญชนก เพชรล้ำ", nickname: "ออม", gender: "F", parentName: "คุณธีรพล เพชรล้ำ", parentPhone: "081-100-1001" },
      { studentNo: "02", fullName: "ด.ช. ภูริช วงศ์งาม", nickname: "ภูริ", gender: "M", parentName: "คุณภูวดล วงศ์งาม", parentPhone: "082-200-2002" },
      { studentNo: "03", fullName: "ด.ญ. ฐิติมา สายฝน", nickname: "ติว", gender: "F", parentName: "คุณฐิติ สายฝน", parentPhone: "083-300-3003" },
      { studentNo: "04", fullName: "ด.ช. รัชชานนท์ ขยันดี", nickname: "นนท์", gender: "M", parentName: "คุณรัชต ขยันดี", parentPhone: "084-400-4004" },
      { studentNo: "05", fullName: "ด.ญ. ปริยากร ใจกล้า", nickname: "ใหม่", gender: "F", parentName: "คุณปาริฉัตร ใจกล้า", parentPhone: "085-500-5005" },
      { studentNo: "06", fullName: "ด.ช. ธนกฤต อยู่ดี", nickname: "กฤต", gender: "M", parentName: "คุณธนา อยู่ดี", parentPhone: "086-600-6006" },
      { studentNo: "07", fullName: "ด.ญ. เกศินี ดวงดี", nickname: "เกศ", gender: "F", parentName: "คุณเกียรติ ดวงดี", parentPhone: "087-700-7007" },
    ],
  },
  {
    name: "อนุบาล 3/1",
    grade: "อ.3",
    level: "อนุบาล",
    homeroomTeacherName: "คุณครูวรรณภา ขวัญใจ",
    homeroomTeacherPhone: "083-456-7890",
    students: [
      { studentNo: "01", fullName: "ด.ช. ปวริศ มีสุข", nickname: "เปอร์", gender: "M", parentName: "คุณปกรณ์ มีสุข", parentPhone: "081-010-0101" },
      { studentNo: "02", fullName: "ด.ญ. ปานวาด หวานใจ", nickname: "วาด", gender: "F", parentName: "คุณปานทิพย์ หวานใจ", parentPhone: "082-020-0202" },
      { studentNo: "03", fullName: "ด.ช. ภาคิน บุญมาก", nickname: "ภา", gender: "M", parentName: "คุณภัทร บุญมาก", parentPhone: "083-030-0303" },
      { studentNo: "04", fullName: "ด.ญ. ลภัสรดา หอมหวาน", nickname: "ออย", gender: "F", parentName: "คุณลัดดา หอมหวาน", parentPhone: "084-040-0404" },
      { studentNo: "05", fullName: "ด.ช. ธีรเดช เก่งกาจ", nickname: "เดช", gender: "M", parentName: "คุณธรณ์ เก่งกาจ", parentPhone: "085-050-0505" },
      { studentNo: "06", fullName: "ด.ญ. กัญญาภัค สวยงาม", nickname: "อัยย์", gender: "F", parentName: "คุณกัญญา สวยงาม", parentPhone: "086-060-0606" },
    ],
  },
];

export async function seedEducareProdDemoForOwner(db: DbLike, ownerUserId: string): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;

  const existingClassrooms = await db.educareClassroom.count({
    where: { ownerUserId, trialSessionId },
  });
  if (existingClassrooms > 0) return;

  const school = await db.educareSchool.upsert({
    where: {
      ownerUserId_trialSessionId_name: {
        ownerUserId,
        trialSessionId,
        name: "โรงเรียนสาธิตทดลอง",
      },
    },
    update: { isActive: true },
    create: {
      ownerUserId,
      trialSessionId,
      name: "โรงเรียนสาธิตทดลอง",
      address: "เลขที่ 123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กทม. 10110",
      phone: "02-123-4567",
    },
  });

  await db.educareSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {
      schoolName: "โรงเรียนสาธิตทดลอง",
      schoolAddress: "เลขที่ 123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กทม. 10110",
      schoolPhone: "02-123-4567",
    },
    create: {
      ownerUserId,
      trialSessionId,
      schoolName: "โรงเรียนสาธิตทดลอง",
      schoolAddress: "เลขที่ 123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กทม. 10110",
      schoolPhone: "02-123-4567",
    },
  });

  const today = bangkokYmd();
  const featureKeys = ["ASSEMBLY", "TIDINESS", "CLASS_ATTENDANCE", "MILK", "MEAL", "BRUSHING"] as const;

  let girlPhotoIdx = 0;
  let boyPhotoIdx = 0;

  for (let roomIdx = 0; roomIdx < ROOMS.length; roomIdx++) {
    const r = ROOMS[roomIdx];
    const classroom = await db.educareClassroom.create({
      data: {
        ownerUserId,
        trialSessionId,
        schoolId: school.id,
        name: r.name,
        grade: r.grade,
        level: r.level,
        homeroomTeacherName: r.homeroomTeacherName,
        homeroomTeacherPhone: r.homeroomTeacherPhone,
        sortOrder: roomIdx,
      },
    });

    for (const s of r.students) {
      const photo =
        s.gender === "F"
          ? STUDENT_PHOTOS.girl[girlPhotoIdx++ % STUDENT_PHOTOS.girl.length]
          : STUDENT_PHOTOS.boy[boyPhotoIdx++ % STUDENT_PHOTOS.boy.length];

      const student = await db.educareStudent.create({
        data: {
          ownerUserId,
          trialSessionId,
          classroomId: classroom.id,
          studentNo: s.studentNo,
          fullName: s.fullName,
          nickname: s.nickname,
          gender: s.gender,
          photoUrl: photo,
          parentName: s.parentName,
          parentPhone: s.parentPhone,
        },
      });

      // 7 วันย้อนหลัง (รวมวันนี้)
      for (let dayBack = 6; dayBack >= 0; dayBack--) {
        const ymd = shiftYmd(today, -dayBack);
        const dateUtc = ymdToDateUTC(ymd);

        const isWeekend = (() => {
          const dt = new Date(`${ymd}T00:00:00`);
          const dow = dt.getUTCDay();
          return dow === 0 || dow === 6;
        })();
        if (isWeekend) continue;

        const seed = (Number(student.id) * 31 + (Number(s.studentNo) || 0) * 7 + dayBack) % 100;
        let assemblyStatus: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" = "PRESENT";
        if (seed < 5) assemblyStatus = "ABSENT";
        else if (seed < 8) assemblyStatus = "EXCUSED";
        else if (seed < 18) assemblyStatus = "LATE";

        for (const f of featureKeys) {
          let status:
            | "PRESENT" | "LATE" | "ABSENT" | "EXCUSED"
            | "PASS" | "FAIL"
            | "DONE" | "PARTIAL" | "NOT_DONE" | "NA" = "DONE";

          if (f === "ASSEMBLY") {
            status = assemblyStatus;
          } else if (assemblyStatus === "ABSENT" || assemblyStatus === "EXCUSED") {
            if (f === "CLASS_ATTENDANCE") status = assemblyStatus;
            else status = "NA";
          } else if (f === "CLASS_ATTENDANCE") {
            status = assemblyStatus === "LATE" ? "LATE" : "PRESENT";
          } else if (f === "TIDINESS") {
            status = seed < 80 ? "PASS" : "FAIL";
          } else {
            // MILK / MEAL / BRUSHING
            const r2 = (seed + (f === "MILK" ? 3 : f === "MEAL" ? 7 : 11)) % 100;
            if (r2 < 70) status = "DONE";
            else if (r2 < 85) status = "PARTIAL";
            else status = "NOT_DONE";
          }

          await db.educareCheckRecord.upsert({
            where: {
              studentId_date_feature: {
                studentId: student.id,
                date: dateUtc,
                feature: f,
              },
            },
            update: { status },
            create: {
              ownerUserId,
              trialSessionId,
              classroomId: classroom.id,
              studentId: student.id,
              date: dateUtc,
              feature: f,
              status,
            },
          });
        }
      }
    }
  }
}
