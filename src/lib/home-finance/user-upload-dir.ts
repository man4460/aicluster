/**
 * Folder ย่อยสำหรับเก็บรูปสลิป / ไฟล์แนบของแต่ละผู้ใช้ภายใต้ `public/uploads/home-finance/`
 *
 * มาตรฐานกลาง: `@/lib/upload/upload-segments` + `saveModuleUpload`
 */

export {
  resolveUserUploadSegment as resolveOwnerUploadSegment,
  sanitizeUploadSegment,
} from "@/lib/upload/upload-segments";
