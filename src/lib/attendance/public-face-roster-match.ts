import {
  FACE_DESCRIPTOR_LENGTH,
  FACE_ENROLL_MAX_SAMPLES,
  matchFaceDescriptorMulti,
  parseFaceDescriptorBank,
  type FaceMatchCandidate,
} from "@/lib/attendance/face-descriptor";
import { prisma } from "@/lib/prisma";

export type PublicFaceRosterMatchResult =
  | {
      ok: true;
      entry: FaceMatchCandidate;
      distance: number;
      margin: number;
      support: number;
    }
  | { ok: false; error: string; status: number };

/** จับคู่ descriptor กับรายชื่อของเจ้าขององค์กรนั้นเท่านั้น — ไม่เปรียบเทียบข้าม user */
export async function matchPublicFaceToRoster(params: {
  ownerUserId: string;
  trialSessionId: string;
  descriptor: number[];
  descriptors?: number[][];
}): Promise<PublicFaceRosterMatchResult> {
  if (params.descriptor.length !== FACE_DESCRIPTOR_LENGTH) {
    return { ok: false, error: "ข้อมูลใบหน้าไม่ถูกต้อง", status: 400 };
  }

  const roster = await prisma.attendanceRosterEntry.findMany({
    where: {
      ownerUserId: params.ownerUserId,
      trialSessionId: params.trialSessionId,
      isActive: true,
      faceDescriptorJson: { not: null },
    },
    select: {
      id: true,
      displayName: true,
      phone: true,
      faceDescriptorJson: true,
    },
    take: 2500,
  });

  const candidates: FaceMatchCandidate[] = [];
  for (const row of roster) {
    const bank = parseFaceDescriptorBank(row.faceDescriptorJson);
    if (!bank?.length) continue;
    candidates.push({
      id: row.id,
      displayName: row.displayName,
      phone: row.phone,
      descriptors: bank,
    });
  }

  const probes =
    params.descriptors && params.descriptors.length >= 2 ? params.descriptors : [params.descriptor];
  const match = matchFaceDescriptorMulti(probes, candidates);

  if (!match.ok) {
    if (match.reason === "NO_CANDIDATES") {
      return {
        ok: false,
        error: "ยังไม่มีพนักงานที่ลงทะเบียนใบหน้า — ให้เจ้าของลงทะเบียนในรายชื่อก่อน",
        status: 400,
      };
    }
    if (match.reason === "AMBIGUOUS") {
      return {
        ok: false,
        error: "ใบหน้าคล้ายหลายคนในรายชื่อ — ลองใหม่ในแสงดีขึ้น หรือให้เจ้าของลงทะเบียนใบหน้าใหม่",
        status: 400,
      };
    }
    if (match.reason === "NO_MATCH") {
      return {
        ok: false,
        error: "ไม่ตรงกับใบหน้าในรายชื่อ — ลองใหม่ในแสงสว่าง หน้าตรงกล้อง หรือให้เจ้าของลงทะเบียนใบหน้าใหม่",
        status: 400,
      };
    }
    return { ok: false, error: "จับคู่ใบหน้าไม่สำเร็จ", status: 400 };
  }

  return {
    ok: true,
    entry: match.entry,
    distance: match.distance,
    margin: match.margin,
    support: match.support,
  };
}

export const PUBLIC_FACE_FORM_DESCRIPTOR_MAX = FACE_ENROLL_MAX_SAMPLES;
