import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  ClipboardList,
  ListOrdered,
  MapPin,
  UserRound,
} from "lucide-react";

/** Lucide icon per wizard step id — used in section headers for quick visual scanning. */
export const WIZARD_STEP_ICONS: Record<string, LucideIcon> = {
  "personal-information": UserRound,
  "industry-preferences": Building2,
  "work-preferences": Briefcase,
  "geographic-preferences": MapPin,
  "desired-job-titles": ListOrdered,
  "other-details": ClipboardList,
};
