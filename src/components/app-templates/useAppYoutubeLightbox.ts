"use client";

import { useCallback, useState } from "react";

export type AppYoutubeLightboxState = {
  youtubeUrl: string | null;
  title: string;
  open: (youtubeUrl: string, title?: string) => void;
  close: () => void;
};

/** คู่กับ AppYoutubeLightbox — เปิดคลิปจาก thumb แล้วปิดเมื่อจบ */
export function useAppYoutubeLightbox(): AppYoutubeLightboxState {
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("วิดีโอ YouTube");

  const open = useCallback((url: string, clipTitle = "วิดีโอ YouTube") => {
    setYoutubeUrl(url);
    setTitle(clipTitle);
  }, []);

  const close = useCallback(() => {
    setYoutubeUrl(null);
  }, []);

  return { youtubeUrl, title, open, close };
}
