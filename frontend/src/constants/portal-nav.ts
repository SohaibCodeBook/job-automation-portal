import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Briefcase,
  Calendar,
  FileText,
  LayoutDashboard,
  Send,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";

export type PortalNavSectionId = "main" | "tracking" | "account";

export type PortalNavItem = {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  section: PortalNavSectionId;
  badge?: string;
  badgeTone?: "default" | "success" | "muted";
  comingSoon?: boolean;
};

export const PORTAL_NAV_SECTIONS: { id: PortalNavSectionId; label: string }[] = [
  { id: "main", label: "MAIN" },
  { id: "tracking", label: "TRACKING" },
  { id: "account", label: "ACCOUNT" },
];

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    section: "main",
  },
  {
    id: "scrapped-jobs",
    label: "Scrapped Jobs",
    href: ROUTES.scrappedJobs,
    icon: Briefcase,
    section: "main",
    badge: "—",
    badgeTone: "default",
  },
  {
    id: "job-specs",
    label: "Job Specs",
    href: ROUTES.jobSpecs,
    icon: SlidersHorizontal,
    section: "main",
  },
  {
    id: "applied",
    label: "Applied",
    href: `${ROUTES.scrappedJobs}?view=applied`,
    icon: Send,
    section: "tracking",
    badgeTone: "success",
  },
  {
    id: "saved",
    label: "Saved",
    href: `${ROUTES.scrappedJobs}?view=favorites`,
    icon: Bookmark,
    section: "tracking",
    badgeTone: "default",
  },
  {
    id: "interviews",
    label: "Interviews",
    icon: Calendar,
    section: "tracking",
    comingSoon: true,
  },
  {
    id: "resume",
    label: "Resume",
    icon: FileText,
    section: "account",
    comingSoon: true,
  },
  {
    id: "settings",
    label: "Settings",
    href: ROUTES.settings,
    icon: Settings,
    section: "account",
  },
];
