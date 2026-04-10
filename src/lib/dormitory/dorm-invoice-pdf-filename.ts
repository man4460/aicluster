export function safeDormInvoicePdfFileName(roomNumber: string, periodMonth: string): string {
  const raw = `invoice-room${roomNumber}-${periodMonth}.pdf`;
  return raw.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-");
}
