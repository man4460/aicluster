import type { ReactNode } from "react";

/** เว็บลูกค้าโชว์รูม — เต็มจอ ไม่จำกัดความกว้าง */
export default function CarPublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-[#faf9ff]">{children}</div>;
}
