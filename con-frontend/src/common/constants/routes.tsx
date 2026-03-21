import { Blocks, GitMerge, KeyRound, LayoutDashboard, PlayCircle, Settings, Users } from "lucide-react";

export const pageRoutes = {
    "Dashboard": "/dashboard",
    "Pipelines": "/pipelines",
    "Runs": "/runs",
    "Integrations": "/integrations",
    "Team": "/team",
    "Settings": "/settings",
    "Credentials": "/credentials",
    "Login": "/login",
}

export const MAIN_LINKS = [
  { name: "Dashboard", href: pageRoutes["Dashboard"] || "/", icon: LayoutDashboard },
  { name: "Pipelines", href: pageRoutes["Pipelines"] || "/pipelines", icon: GitMerge },
  { name: "Runs", href: pageRoutes["Runs"] || "/runs", icon: PlayCircle },
  { name: "Integrations", href: pageRoutes["Integrations"] || "/integrations", icon: Blocks },
];

export const WORKSPACE_LINKS = [
  { name: "Team", href: pageRoutes["Team"] || "/team", icon: Users },
  { name: "Credentials", href: pageRoutes["Credentials"] || "/credentials", icon: KeyRound },
  { name: "Settings", href: pageRoutes["Settings"] || "/settings", icon: Settings },
];