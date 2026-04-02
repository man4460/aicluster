import { randomBytes } from "crypto";

/** โทเคนสำหรับ URL เช็คอินลูกค้า (ไม่มี slash เพื่อใช้ใน path ได้สบาย) */
export function newParkingCheckInToken(): string {
  return randomBytes(24).toString("base64url");
}
