type ExtendedMediaTrackCapabilities = MediaTrackCapabilities & {
  backgroundBlur?: boolean[];
};

type ExtendedMediaTrackConstraints = MediaTrackConstraints & {
  backgroundBlur?: boolean;
};

/** พยายามปิด blur/ตัดพื้นหลังที่ OS หรือเบราว์เซอร์ใส่ให้กล้อง (เช่น Windows Studio Effects) */
export async function disableOsCameraBackgroundEffects(stream: MediaStream): Promise<void> {
  const [track] = stream.getVideoTracks();
  if (!track) return;

  try {
    const caps = track.getCapabilities() as ExtendedMediaTrackCapabilities;
    if (!caps.backgroundBlur?.includes(false)) return;
    await track.applyConstraints({ backgroundBlur: false } as ExtendedMediaTrackConstraints);
  } catch {
    // บางเครื่องบังคับเปิดเอฟเฟกต์จาก OS — ผู้ใช้ต้องปิดเองในการตั้งค่า Windows
  }
}

export type OpenUserCameraStreamOptions = {
  width?: number;
  height?: number;
};

/** เปิดกล้องหน้า พร้อมพยายามปิดเอฟเฟกต์พื้นหลังของระบบ */
export async function openUserCameraStream(
  options: OpenUserCameraStreamOptions = {},
): Promise<MediaStream> {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) {
    throw new Error("เบราว์เซอร์ไม่รองรับการเปิดกล้อง");
  }

  const width = options.width ?? 1280;
  const height = options.height ?? 720;

  const stream = await md.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: width },
      height: { ideal: height },
      backgroundBlur: false,
    } as ExtendedMediaTrackConstraints,
    audio: false,
  });

  await disableOsCameraBackgroundEffects(stream);
  return stream;
}
