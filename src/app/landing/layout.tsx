import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MAWELL — แพลตฟอร์มธุรกิจครบวงจร",
  description:
    "แพลตฟอร์มเดียวครบระบบหลังบ้าน องค์กร ธุรกิจ โรงเรียน — โมดูลฟรีหลายระบบ และสายรายวัน 1 บาทต่อวันต่อระบบ",
};

export default function LandingLayout({ children }: { children: ReactNode }) {
  return children;
}
