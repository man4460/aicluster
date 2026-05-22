export function appointmentQueuePortalSlipOwnerTag(ownerId: string): string {
  return ownerId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
}

export function appointmentQueuePortalSlipPathPrefix(): string {
  return "/uploads/appointment-queue-slips/";
}
