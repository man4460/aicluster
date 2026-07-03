import { ImageResponse } from "next/og";
import { mawellPwaIconMarkup } from "@/lib/pwa/mawell-pwa-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(mawellPwaIconMarkup(), { ...size });
}
