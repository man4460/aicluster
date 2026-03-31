import { redirect } from "next/navigation";
import { AuthPageFrame } from "@/components/auth/AuthCard";
import { getSession } from "@/lib/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <AuthPageFrame>
      <div className="w-full max-w-md">{children}</div>
    </AuthPageFrame>
  );
}
