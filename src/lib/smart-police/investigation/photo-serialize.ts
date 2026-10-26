import type { Prisma } from "@/generated/prisma/client";
import type { SuspectPhotoDto, SuspectPhotoKind } from "@/lib/smart-police/investigation/photo-types";

export function mapSuspectPhoto(row: Prisma.SmartPoliceSuspectPhotoGetPayload<object>): SuspectPhotoDto {
  return {
    id: row.id,
    url: row.url,
    kind: row.kind as SuspectPhotoKind,
    caption: row.caption,
    bytes: row.bytes,
    hasEmbedding: Boolean(row.faceEmbedding),
    createdAt: row.createdAt.toISOString(),
  };
}
