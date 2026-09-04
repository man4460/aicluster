"use client";

import { cn } from "@/lib/cn";
import { toDisplayContentHtml } from "@/systems/pro-resume/lib/content-plain";
import { proResumePortalRichContentClass } from "@/systems/pro-resume/lib/ui-tokens";

/** แสดงรายละเอียดผลงาน / ผลงานย่อย — หัวข้อ · ตัวหนา · ย่อหน้า · บูลเล็ต */
export function ProResumeRichContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const html = toDisplayContentHtml(content);
  if (!html) return null;
  return (
    <div
      className={cn(proResumePortalRichContentClass, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
