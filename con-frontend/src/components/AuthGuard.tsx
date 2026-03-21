"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/index";

const PUBLIC_ROUTES = ["/login", "/register", "/auth", "/forgot-password"];

/**
 * Auth guard that protects routes.
 * - On mount, tries to restore session from stored token
 * - Redirects to /login if not authenticated on a protected route
 * - Redirects to /dashboard if authenticated and on a login page
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authorized, isLoading, tryRestore } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    tryRestore();
  }, [tryRestore]);

  useEffect(() => {
    if (isLoading) return;

    if (!authorized && !isPublicRoute) {
      router.replace("/login");
    }

    if (authorized && isPublicRoute) {
      router.replace("/dashboard");
    }
  }, [authorized, isLoading, isPublicRoute, router]);

  // Show nothing while checking auth on protected routes
  if (isLoading && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
