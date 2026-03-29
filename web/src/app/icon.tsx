import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** ไอคอนแท็บ — ไม่ใช้โลโก้ Next.js */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0000BF",
          color: "#fff",
          fontSize: 20,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
