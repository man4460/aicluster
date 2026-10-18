import "server-only";

/**
 * สร้างคำให้การ — ใช้แบบจำลองฟอร์ม (header + ถาม/ตอบ)
 * คงไฟล์นี้ไว้ให้ API/server import ชัดเจน ไม่ดึงเข้า client bundle
 */
export {
  fillStatementDocument,
  type FillStatementInput,
} from "@/lib/smart-police/form-templates/fill-statement";
