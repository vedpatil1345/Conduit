"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useSidebar } from "@/store/useSidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { AuthGuard } from "./AuthGuard";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();
  const pathname = usePathname();

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/auth");

  if (isAuthRoute) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <Sidebar />
      <div 
        className={cn(
          "min-h-screen bg-muted/20 flex flex-col transition-all duration-300",
          isExpanded ? "md:ml-52" : "md:ml-16"
        )}
      >
        <Topbar />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
