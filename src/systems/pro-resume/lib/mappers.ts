import { proResumePublicPath } from "@/systems/pro-resume/pro-resume-module-nav";

export function parseImagesJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((u): u is string => typeof u === "string" && u.length > 0).slice(0, 24);
  } catch {
    return [];
  }
}

export function serializeImagesJson(images: string[]): string {
  return JSON.stringify(images.filter((u) => typeof u === "string" && u.length > 0).slice(0, 24));
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
