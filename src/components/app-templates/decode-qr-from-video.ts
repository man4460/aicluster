type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<{ rawValue?: string }[]>;
};

declare global {
  // eslint-disable-next-line no-var
  var BarcodeDetector: {
    new (options?: { formats?: string[] }): BarcodeDetectorLike;
  } | undefined;
}

/** ถอดรหัส QR จากเฟรมวิดีโอกล้อง — BarcodeDetector ก่อน แล้ว jsQR */
export async function decodeQrFromVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return null;
  }

  if (typeof globalThis.BarcodeDetector !== "undefined") {
    try {
      const detector = new globalThis.BarcodeDetector({ formats: ["qr_code"] });
      const codes = await detector.detect(video);
      const raw = codes[0]?.rawValue?.trim();
      if (raw) return raw;
    } catch {
      /* ใช้ jsQR ต่อ */
    }
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(video, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const { default: jsQR } = await import("jsqr");
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  return result?.data?.trim() ?? null;
}
