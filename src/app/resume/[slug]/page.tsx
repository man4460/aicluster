import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadProResumePublicPortal } from "@/lib/pro-resume/load-public-portal";
import { ProResumePublicClient } from "@/systems/pro-resume/components/ProResumePublicClient";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Resume · ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function ResumePublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t } = await searchParams;
  const data = await loadProResumePublicPortal(slug, t ?? null);
  if (!data) notFound();

  return <ProResumePublicClient slug={slug} trialParam={t} initialData={data} />;
}
