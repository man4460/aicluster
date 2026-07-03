import { ImageResponse } from "next/og";
import { mawellPwaIconMarkup } from "@/lib/pwa/mawell-pwa-icon";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(mawellPwaIconMarkup(), { width: 192, height: 192 });
}
