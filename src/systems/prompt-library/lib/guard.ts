import { requireModulePage } from "@/lib/modules/guard";
import { PROMPT_LIBRARY_MODULE_SLUG } from "@/lib/modules/config";

/**
 * Layout ใต้ /dashboard/prompt-library — guard โมดูลกลาง (หักโทเคนรายวันตามแพ็ก)
 */
export async function requirePromptLibrarySection() {
  await requireModulePage(PROMPT_LIBRARY_MODULE_SLUG);
}
