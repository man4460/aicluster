"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  AppDashboardSection,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppSectionHeader,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { LANDING_HERO_BANNER } from "@/app/landing/landing-media";
import { isSafeLandingBannerDisplayUrl } from "@/lib/landing/banner-url";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

export function LandingBannerAdmin() {
  const [displayUrl, setDisplayUrl] = useState(LANDING_HERO_BANNER);
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const camera = useAppCameraCapture({ title: "ถ่ายแบนเนอร์หน้าแรก" });
  const lb = useAppImageLightbox();

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/landing", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      landingBannerUrl?: string | null;
      displayUrl?: string;
      error?: string;
    };
    if (!res.ok) {
      setErr(j.error ?? "โหลดแบนเนอร์ไม่สำเร็จ");
      return;
    }
    setCustomUrl(j.landingBannerUrl ?? null);
    setDisplayUrl(j.displayUrl && isSafeLandingBannerDisplayUrl(j.displayUrl) ? j.displayUrl : LANDING_HERO_BANNER);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadFile(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await fetch("/api/admin/landing/banner", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as {
        landingBannerUrl?: string | null;
        displayUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      setCustomUrl(j.landingBannerUrl ?? null);
      if (j.displayUrl && isSafeLandingBannerDisplayUrl(j.displayUrl)) setDisplayUrl(j.displayUrl);
    } finally {
      setBusy(false);
    }
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await uploadFile(file);
  }

  async function resetDefault() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/landing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ landingBannerUrl: null }),
      });
      const j = (await res.json().catch(() => ({}))) as { displayUrl?: string; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "คืนค่ารูปเดิมไม่สำเร็จ");
        return;
      }
      setCustomUrl(null);
      setDisplayUrl(j.displayUrl && isSafeLandingBannerDisplayUrl(j.displayUrl) ? j.displayUrl : LANDING_HERO_BANNER);
    } finally {
      setBusy(false);
    }
  }

  const preview = isSafeLandingBannerDisplayUrl(displayUrl) ? displayUrl : LANDING_HERO_BANNER;

  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader tone="violet" title="แบนเนอร์หน้าแรก" />
      <div className="mt-4 space-y-3">
        {err ? (
          <p className="rounded-xl border border-rose-100 bg-rose-50/80 px-3 py-2 text-xs font-bold text-rose-700">{err}</p>
        ) : null}
        <AppGalleryCameraFileInputs
          galleryInputRef={galleryRef}
          cameraInputRef={camera.cameraInputRef}
          onChange={(e) => void onPick(e)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <AppImagePickCameraButtons
            className="justify-start"
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() =>
              camera.openCamera(async (file) => {
                await uploadFile(file);
              })
            }
            disabled={busy}
            busy={busy}
            labels={{ gallery: "เลือกรูปแบนเนอร์", camera: "ถ่ายแบนเนอร์" }}
          />
          {customUrl ? (
            <button
              type="button"
              className={assetRowRemoveIconButtonClass}
              disabled={busy}
              onClick={() => void resetDefault()}
              aria-label="คืนรูปแบนเนอร์ค่าเริ่มต้น"
              title="คืนรูปเดิม"
            >
              <IconRowRemove className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => lb.open(preview)}
          className="relative block w-full overflow-hidden rounded-xl border border-white/70 bg-white/80"
          aria-label="ดูแบนเนอร์"
        >
          <Image
            src={preview}
            alt=""
            width={1200}
            height={480}
            className="h-40 w-full object-cover object-center sm:h-52"
            unoptimized
          />
        </button>
        {camera.cameraModal}
        <AppImageLightbox src={lb.src} sources={lb.sources} initialIndex={lb.initialIndex} onClose={lb.close} alt="แบนเนอร์หน้าแรก" />
      </div>
    </AppDashboardSection>
  );
}
