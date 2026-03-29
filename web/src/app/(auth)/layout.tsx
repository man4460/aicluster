import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPageFrame } from "@/components/auth/AuthCard";
import { MawellLogo } from "@/components/layout/MawellLogo";
import { getSession } from "@/lib/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <AuthPageFrame>
      <div className="mb-8 flex flex-col items-center text-center">
        <Link href="/login" className="inline-flex flex-col items-center">
          <MawellLogo size="lg" />
        </Link>
      </div>
      {children}
    </AuthPageFrame>
  );
}
