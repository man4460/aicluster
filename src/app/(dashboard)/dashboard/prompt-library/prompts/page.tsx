import { redirect } from "next/navigation";

/** คลังคำสั่งรวมอยู่ที่หน้าแรกแล้ว */
export default function PromptLibraryPromptsPage() {
  redirect("/dashboard/prompt-library");
}
