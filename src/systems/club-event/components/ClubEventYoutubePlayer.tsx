"use client";

import { AppSecureYoutubePlayer } from "@/components/app-templates";
import { cn } from "@/lib/cn";

type Props = {
  youtubeEmbedUrl: string | null | undefined;
  title: string;
  className?: string;
};

/** เล่นวิดีโอในหน้า — แบบเดียวกับ LMS (ไม่มีลิงก์เปิด/คัดลอก YouTube) */
export function ClubEventYoutubePlayer({ youtubeEmbedUrl, title, className }: Props) {
  const url = youtubeEmbedUrl?.trim();
  if (!url) return null;

  return (
    <AppSecureYoutubePlayer
      youtubeUrl={url}
      title={title}
      className={cn(className)}
    />
  );
}
