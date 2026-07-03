import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPageClient } from "@/app/landing/LandingPageClient";
import { getSession } from "@/lib/auth/session";
import { MAWELL_OG_IMAGE, MAWELL_OG_IMAGE_SQUARE } from "@/lib/pwa/brand-assets";

const landingTitle = "MAWELL — แพลตฟอร์มธุรกิจครบวงจร";
const landingDescription =
  "แพลตฟอร์มเดียวครบระบบหลังบ้าน องค์กร ธุรกิจ โรงเรียน — โมดูลฟรีหลายระบบ และสายรายวัน 1 บาทต่อวันต่อระบบ";

export const metadata: Metadata = {
  title: landingTitle,
  description: landingDescription,
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "MAWELL",
    title: landingTitle,
    description: landingDescription,
    url: "/",
    images: [
      {
        url: MAWELL_OG_IMAGE_SQUARE,
        width: 1200,
        height: 1200,
        alt: "MAWELL",
      },
      {
        url: MAWELL_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "MAWELL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: landingTitle,
    description: landingDescription,
    images: [MAWELL_OG_IMAGE_SQUARE, MAWELL_OG_IMAGE],
  },
};

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return <LandingPageClient />;
}
