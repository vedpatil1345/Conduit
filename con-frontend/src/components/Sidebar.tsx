"use client";

import React from "react";
import ThemedLogo from "./ThemedLogo";
import ThemedIcon from "./ThemedIcon";
import Link from "next/link"; 
import { useSidebar } from "@/store/useSidebar";
import { cn } from "@/lib/utils";
import { MAIN_LINKS, WORKSPACE_LINKS } from "@/common/constants/routes";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/index";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


function SidebarItem({ 
  item, 
  isExpanded 
}: { 
  item: { name: string; href: string; icon: React.ElementType };
  isExpanded?: boolean;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  
  const isActive = item.href === "/" 
    ? pathname === "/" 
    : pathname?.startsWith(item.href);

  const linkContent = (
    <Link 
      href={item.href} 
      className={cn(
        "py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground", 
        isExpanded ? "px-4" : "px-0 justify-center",
        isActive 
          ? "text-foreground bg-accent/50 font-medium" + (isExpanded ? " border-r-2 border-primary" : "") 
          : "text-muted-foreground"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
      {isExpanded && <span className="whitespace-nowrap">{item.name}</span>}
    </Link>
  );

  if (isExpanded) return linkContent;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        {linkContent}
      </TooltipTrigger>
      <TooltipContent side="right">
        {item.name}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarUserProfile({ isExpanded }: { isExpanded: boolean }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!isExpanded) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={() => router.push("/settings")}
            className="flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {user.username} · Profile
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="px-3 py-2 flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{user.role}</p>
      </div>
      <button
        onClick={handleLogout}
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SidebarContent({ isExpanded = true }: { isExpanded?: boolean }) {
  return (
    <TooltipProvider>
      <Link href="/" className={cn("border-b flex items-center h-10 shrink-0 transition-all duration-300", isExpanded ? "px-4" : "px-0 justify-center")}>
        {isExpanded ? <ThemedLogo className="h-16 shrink-0 top-0 left-0 absolute" /> : <ThemedIcon className="h-8 w-8 shrink-0" />}
      </Link>

      <nav className="flex-1 overflow-y-auto space-y-1 py-2 overflow-x-hidden">
        {MAIN_LINKS.map(item => (
          <SidebarItem key={item.name} item={item} isExpanded={isExpanded} />
        ))}

        {isExpanded && <div className="text-[11px] text-muted-foreground/70 px-4 pt-4 pb-1 uppercase tracking-wider font-semibold whitespace-nowrap">Workspace</div>}
        {!isExpanded && <div className="border-t my-2 mx-4" />}

        {WORKSPACE_LINKS.map(item => (
          <SidebarItem key={item.name} item={item} isExpanded={isExpanded} />
        ))}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t w-full flex justify-center">
        <SidebarUserProfile isExpanded={isExpanded} />
      </div>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const { isExpanded } = useSidebar();
  
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 bottom-0 bg-background border-r py-4 hidden md:flex flex-col z-40 transition-all duration-300",
        isExpanded ? "w-52" : "w-16"
      )}
    >
      <SidebarContent isExpanded={isExpanded} />
    </aside>
  );
}
