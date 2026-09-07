/** PATCH ทำเครื่องหมายตรวจสลิปแล้ว / ยกเลิก */
export async function patchClubEventSubmissionSlipVerified(
  submissionId: string,
  slipVerified: boolean,
): Promise<{
  id: string;
  slipVerified: boolean;
  slipVerifiedAt: string | null;
}> {
  const res = await fetch(`/api/club-event/session/submissions/${encodeURIComponent(submissionId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slipVerified }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    submission?: {
      id: string;
      slipVerified?: boolean;
      slipVerifiedAt?: string | null;
    };
  };
  if (!res.ok || !json.submission) {
    throw new Error(json.error ?? "บันทึกการตรวจสลิปไม่สำเร็จ");
  }
  return {
    id: json.submission.id,
    slipVerified: Boolean(json.submission.slipVerified),
    slipVerifiedAt: json.submission.slipVerifiedAt ?? null,
  };
}
