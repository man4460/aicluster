import { proResumePublicPath } from "@/systems/pro-resume/pro-resume-module-nav";

export function parseImagesJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((u): u is string => typeof u === "string")
      .map((u) => normalizeResumeMediaUrl(u))
      .filter((u): u is string => Boolean(u))
      .slice(0, 24);
  } catch {
    return [];
  }
}

/**
 * ลิงก์รูปที่เก็บ/แสดงได้จริง
 * - `/uploads/...` (ตัดโดเมน localhost/prod ออก เหลือ path)
 * - `https://...` ภายนอก (เช่น Unsplash)
 * - ตัดความยาวไม่เกิน 512 กันคอลัมน์ขาด
 */
export function normalizeResumeMediaUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  let url = raw.trim();
  if (!url) return null;
  if (url.startsWith("data:image/")) return null;
  if (/^(javascript|vbscript|file):/i.test(url)) return null;

  if (url.startsWith("uploads/")) url = `/${url}`;

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/uploads/")) {
        return parsed.pathname.slice(0, 512);
      }
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return url.slice(0, 512);
      }
      return null;
    } catch {
      return null;
    }
  }

  if (url.startsWith("/uploads/")) return url.slice(0, 512);
  return null;
}

export function serializeImagesJson(images: string[]): string {
  return JSON.stringify(
    images
      .map((u) => normalizeResumeMediaUrl(u))
      .filter((u): u is string => Boolean(u))
      .slice(0, 24),
  );
}

/** รวมปก + แกลเลอรี โดยไม่ซ้ำ — ใช้แสดงบนพอร์ทัล */
export function resumeSkillGalleryUrls(skill: {
  coverImage?: string | null;
  images?: string[] | null;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null | undefined) => {
    const url = normalizeResumeMediaUrl(raw);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  };
  push(skill.coverImage);
  for (const u of skill.images ?? []) push(u);
  return out;
}

/** ตรวจ/จัดรูปปก+แกลเลอรีก่อนบันทึก DB — กันลิงก์เสียและปกหลุดจากแกลเลอรี */
export function resolveResumeSkillMedia(input: {
  coverImage?: unknown;
  images?: unknown;
}): { coverImage: string | null; images: string[] } {
  const fromList = Array.isArray(input.images)
    ? input.images
        .filter((u): u is string => typeof u === "string")
        .map((u) => normalizeResumeMediaUrl(u))
        .filter((u): u is string => Boolean(u))
    : [];

  let cover =
    typeof input.coverImage === "string"
      ? normalizeResumeMediaUrl(input.coverImage)
      : input.coverImage === null
        ? null
        : undefined;

  const images: string[] = [];
  const seen = new Set<string>();
  const push = (url: string | null | undefined) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    images.push(url);
  };

  if (cover) push(cover);
  for (const u of fromList) push(u);

  if (cover === undefined) {
    cover = images[0] ?? null;
  } else if (cover === null && images.length) {
    cover = images[0]!;
  }

  if (cover && images[0] !== cover) {
    const rest = images.filter((u) => u !== cover);
    return { coverImage: cover, images: [cover, ...rest].slice(0, 24) };
  }

  return { coverImage: cover ?? null, images: images.slice(0, 24) };
}

export type ResumeProfileDto = {
  id: string;
  slug: string;
  fullName: string;
  positionTitle: string;
  bio: string;
  profileImageUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isPremium: boolean;
  publicEnabled: boolean;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type ResumeEducationDto = {
  id: string;
  degree: string;
  institution: string;
  startYear: number | null;
  endYear: number | null;
  description: string;
  orderIndex: number;
};

export type ResumeExperienceDto = {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string | null;
  achievements: string;
  orderIndex: number;
};

export type ResumeCertificateDto = {
  id: string;
  name: string;
  issuedBy: string;
  year: number | null;
  fileUrl: string | null;
  orderIndex: number;
};

export type ResumeSkillDto = {
  id: string;
  name: string;
  level: string;
  shortDesc: string;
  description: string;
  coverImage: string | null;
  images: string[];
  orderIndex: number;
};

export type ResumePortfolioCategoryDto = {
  id: string;
  name: string;
  orderIndex: number;
};

export type ResumePortfolioItemDto = {
  id: string;
  categoryId: string;
  title: string;
  coverImage: string | null;
  shortDesc: string;
  contentHTML: string;
  youtubeUrl: string | null;
  images: string[];
  orderIndex: number;
  clickCount: number;
};

export type ResumePublicDto = {
  profile: ResumeProfileDto;
  educations: ResumeEducationDto[];
  experiences: ResumeExperienceDto[];
  certificates: ResumeCertificateDto[];
  skills: ResumeSkillDto[];
  categories: ResumePortfolioCategoryDto[];
  portfolioItems: ResumePortfolioItemDto[];
};

export function mapResumeProfile(
  row: {
    id: string;
    slug: string;
    fullName: string;
    positionTitle: string;
    bio: string;
    profileImageUrl: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    isPremium: boolean;
    publicEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  trialSessionId?: string,
): ResumeProfileDto {
  return {
    id: row.id,
    slug: row.slug,
    fullName: row.fullName,
    positionTitle: row.positionTitle,
    bio: row.bio,
    profileImageUrl: row.profileImageUrl,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    isPremium: row.isPremium,
    publicEnabled: row.publicEnabled,
    publicUrl: proResumePublicPath(row.slug, trialSessionId && trialSessionId !== "prod" ? trialSessionId : null),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapResumeEducation(row: {
  id: string;
  degree: string;
  institution: string;
  startYear: number | null;
  endYear: number | null;
  description: string;
  orderIndex: number;
}): ResumeEducationDto {
  return {
    id: row.id,
    degree: row.degree,
    institution: row.institution,
    startYear: row.startYear,
    endYear: row.endYear,
    description: row.description,
    orderIndex: row.orderIndex,
  };
}

export function mapResumeExperience(row: {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string | null;
  achievements: string;
  orderIndex: number;
}): ResumeExperienceDto {
  return {
    id: row.id,
    jobTitle: row.jobTitle,
    company: row.company,
    startDate: row.startDate,
    endDate: row.endDate,
    achievements: row.achievements,
    orderIndex: row.orderIndex,
  };
}

export function mapResumeCertificate(row: {
  id: string;
  name: string;
  issuedBy: string;
  year: number | null;
  fileUrl: string | null;
  orderIndex: number;
}): ResumeCertificateDto {
  return {
    id: row.id,
    name: row.name,
    issuedBy: row.issuedBy,
    year: row.year,
    fileUrl: row.fileUrl,
    orderIndex: row.orderIndex,
  };
}

export function mapResumeSkill(row: {
  id: string;
  name: string;
  level: string;
  shortDesc?: string | null;
  description: string;
  coverImage?: string | null;
  imagesJson?: string | null;
  orderIndex: number;
}): ResumeSkillDto {
  const resolved = resolveResumeSkillMedia({
    coverImage: row.coverImage,
    images: parseImagesJson(row.imagesJson),
  });
  return {
    id: row.id,
    name: row.name,
    level: row.level ?? "",
    shortDesc: row.shortDesc ?? "",
    description: row.description ?? "",
    coverImage: resolved.coverImage,
    images: resolved.images,
    orderIndex: row.orderIndex,
  };
}

export function mapResumePortfolioCategory(row: {
  id: string;
  name: string;
  orderIndex: number;
}): ResumePortfolioCategoryDto {
  return { id: row.id, name: row.name, orderIndex: row.orderIndex };
}

export function mapResumePortfolioItem(row: {
  id: string;
  categoryId: string;
  title: string;
  coverImage: string | null;
  shortDesc: string;
  contentHTML: string;
  youtubeUrl: string | null;
  imagesJson: string;
  orderIndex: number;
  clickCount: number;
}): ResumePortfolioItemDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    coverImage: row.coverImage,
    shortDesc: row.shortDesc,
    contentHTML: row.contentHTML,
    youtubeUrl: row.youtubeUrl,
    images: parseImagesJson(row.imagesJson),
    orderIndex: row.orderIndex,
    clickCount: row.clickCount,
  };
}
