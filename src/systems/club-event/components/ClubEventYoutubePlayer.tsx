"use client";

import { ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  clubEventYoutubeEmbedSrc,
  clubEventYoutubeWatchUrlFromStored,
} from "@/systems/club-event/lib/youtube";
import { clubEventOutlineButtonClass } from "@/systems/club-event/lib/ui-tokens";

type Props = {
  youtubeEmbedUrl: string | null | undefined;
  title: string;
  className?: string;
};

/** เล่นวิดีโอในหน้า — เปิดดูบน YouTube ได้ · ไม่มีปุ่มคัดลอกลิงก์ */
export function ClubEventYoutubePlayer({ youtubeEmbedUrl, title, className }: Props) {
  const embed = clubEventYoutubeEmbedSrc(youtubeEmbedUrl);
  const watch = clubEventYoutubeWatchUrlFromStored(youtubeEmbedUrl);
  if (!embed) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="aspect-video overflow-hidden rounded-xl border border-slate-200/90 bg-black">
        <iframe
          src={embed}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {watch ? (
        <a
          href={watch}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(clubEventOutlineButtonClass, "inline-flex w-full items-center justify-center gap-2 sm:w-auto")}
        >
          <Play className="h-4 w-4" aria-hidden />
          เปิดดูวิดีโอบน YouTube
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}
