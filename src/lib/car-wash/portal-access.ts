// พอร์ทัลลูกค้าเป็นจุดรับงานสาธารณะ — เปิดให้เข้าได้เสมอ
// ไม่ต้องตรวจสิทธิ์ subscription/token เพราะลูกค้าหน้าร้านไม่มี session
export async function isCarWashCustomerPortalOpenForOwner(
  _ownerId: string,
): Promise<boolean> {
  return true;
}
