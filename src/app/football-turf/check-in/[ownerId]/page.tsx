import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ ownerId: string }>;
};

/** ลิงก์เช็กอินสาธารณะถูกปิดแล้ว — ไม่ปลอดภัย */
export default async function FootballTurfCheckInPage(_props: Props) {
  notFound();
}
