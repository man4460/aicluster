import Link from "next/link";
import { MawellLogo } from "@/components/layout/MawellLogo";
import { AuthPageFrame } from "@/components/auth/AuthCard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
