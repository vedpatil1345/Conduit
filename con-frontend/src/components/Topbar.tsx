"use client";

import { ThemeToggle } from "./theme-toggle";
import { pageRoutes } from "@/common/constants/routes";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./Sidebar";
import { useSidebar } from "@/store/useSidebar";
import { useAuthStore } from "@/store/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle } = useSidebar();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  
  const pageName = Object.entries(pageRoutes).find(
    ([, route]) => route === pathname || (route !== "/" && pathname.startsWith(route + "/"))
  )?.[0] || "Dashboard";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  const roleBadgeColor: Record<string, string> = {
    ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400",
    MANAGER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    DEVELOPER: "bg-green-500/10 text-green-600 dark:text-green-400",
    VIEWER: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    SERVICE_ACCOUNT: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-2 md:gap-4">
        <Sheet>
          <SheetTrigger className="md:hidden py-2 flex flex-row items-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[200px] p-0 flex flex-col border-r h-full">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent isExpanded={true} />
          </SheetContent>
        </Sheet>
        <button 
          onClick={toggle}
          className="hidden md:flex p-2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground ml-[-8px]"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </button>
        <h1 className="text-lg font-medium text-foreground capitalize truncate select-none">{pageName}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button className="hidden sm:block h-9 px-4 py-2 text-sm border rounded-md bg-background text-foreground hover:bg-accent hover:text-accent-foreground font-medium transition-colors">
          Last 7 days
        </button>
        <button className="hidden sm:block h-9 px-4 py-2 text-sm border border-primary bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors">
          + New pipeline
        </button>
        <ThemeToggle />

        {/* User Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors outline-none">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-tight">{user.username}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider leading-tight px-1 rounded ${roleBadgeColor[user.role] || ""}`}>
                  {user.role}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
