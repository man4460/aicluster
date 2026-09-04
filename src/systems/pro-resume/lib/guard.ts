import { requireModulePage } from "@/lib/modules/guard";
import { PRO_RESUME_MODULE_SLUG } from "@/lib/modules/config";

export async function requireProResumeSection() {
  await requireModulePage(PRO_RESUME_MODULE_SLUG);
}
