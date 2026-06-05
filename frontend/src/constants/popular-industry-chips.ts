import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  GraduationCap,
  HeartPulse,
  Landmark,
  ShoppingBag,
} from "lucide-react";

export type PopularIndustryChip = {
  label: string;
  value: string;
  icon: LucideIcon;
};

/** Quick-pick industries shown as toggle chips below the search field. */
export const POPULAR_INDUSTRY_CHIPS: PopularIndustryChip[] = [
  {
    label: "Technology",
    value: "Technology, Information and Internet",
    icon: Cpu,
  },
  {
    label: "Finance",
    value: "Financial Services",
    icon: Landmark,
  },
  {
    label: "Healthcare",
    value: "Hospitals and Health Care",
    icon: HeartPulse,
  },
  {
    label: "E-commerce",
    value: "Internet Marketplace Platforms",
    icon: ShoppingBag,
  },
  {
    label: "Education",
    value: "Education",
    icon: GraduationCap,
  },
];
