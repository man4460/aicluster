import { LmsCertificateVerifyClient } from "@/systems/lms/components/LmsCertificateVerifyClient";

type Props = { params: Promise<{ slug: string; code: string }> };

export default async function LmsCertificateVerifyPage({ params }: Props) {
  const { slug, code } = await params;
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <LmsCertificateVerifyClient slug={slug} code={code} />
    </div>
  );
}
