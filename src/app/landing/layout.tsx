import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MAWELL_OG_IMAGE, MAWELL_OG_IMAGE_SQUARE } from "@/lib/pwa/brand-assets";

const landingDescription =
  "แพลตฟอร์มเดียวครบระบบหลังบ้าน องค์กร ธุรกิจ โรงเรียน — โมดูลฟรีหลายระบบ และแพ็กเหมารายเดือน 199 (ข้อมูลมากกว่า 10,000 แถว · พิมพ์สลิป)";

export const metadata: Metadata = {
  title: "MAWELL PLATFORM",
  description: landingDescription,
  openGraph: {
    title: "MAWELL PLATFORM",
    description: landingDescription,
    images: [
      { url: MAWELL_OG_IMAGE_SQUARE, width: 1200, height: 1200, alt: "MAWELL" },
      { url: MAWELL_OG_IMAGE, width: 1200, height: 630, alt: "MAWELL" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAWELL PLATFORM",
    description: landingDescription,
    images: [MAWELL_OG_IMAGE_SQUARE, MAWELL_OG_IMAGE],
  },
};

export default function LandingLayout({ children }: { children: ReactNode }) {
  return children;
}
