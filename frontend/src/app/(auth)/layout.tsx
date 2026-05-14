import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { APP_CONFIG } from "@/constants/app";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <header className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <ThemeToggle />
      </header>
      <div className="flex min-h-screen flex-col items-center justify-center p-4 pt-16">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-tight text-foreground hover:underline"
          >
            {APP_CONFIG.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{APP_CONFIG.description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
