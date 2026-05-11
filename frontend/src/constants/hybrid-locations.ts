export type HybridLocationOption = {
  name: string;
  flag: string;
  subLabel: string;
};

export const HYBRID_CITY_OPTIONS: readonly HybridLocationOption[] = [
  { name: "New York", flag: "🇺🇸", subLabel: "New York · USA" },
  { name: "Miami", flag: "🇺🇸", subLabel: "Florida · USA" },
  { name: "Austin", flag: "🇺🇸", subLabel: "Texas · USA" },
  { name: "San Francisco", flag: "🇺🇸", subLabel: "California · USA" },
  { name: "Toronto", flag: "🇨🇦", subLabel: "Ontario · Canada" },
  { name: "Vancouver", flag: "🇨🇦", subLabel: "British Columbia · Canada" },
  { name: "London", flag: "🇬🇧", subLabel: "England · UK" },
  { name: "Manchester", flag: "🇬🇧", subLabel: "England · UK" },
  { name: "Dubai", flag: "🇦🇪", subLabel: "Dubai · UAE" },
  { name: "Abu Dhabi", flag: "🇦🇪", subLabel: "Abu Dhabi · UAE" },
  { name: "Karachi", flag: "🇵🇰", subLabel: "Sindh · Pakistan" },
  { name: "Islamabad", flag: "🇵🇰", subLabel: "Islamabad Capital Territory · Pakistan" },
  { name: "Lahore", flag: "🇵🇰", subLabel: "Punjab · Pakistan" },
  { name: "Delhi", flag: "🇮🇳", subLabel: "Delhi · India" },
  { name: "Bengaluru", flag: "🇮🇳", subLabel: "Karnataka · India" },
  { name: "Mumbai", flag: "🇮🇳", subLabel: "Maharashtra · India" },
  { name: "Sydney", flag: "🇦🇺", subLabel: "New South Wales · Australia" },
  { name: "Melbourne", flag: "🇦🇺", subLabel: "Victoria · Australia" },
  { name: "Berlin", flag: "🇩🇪", subLabel: "Berlin · Germany" },
  { name: "Amsterdam", flag: "🇳🇱", subLabel: "North Holland · Netherlands" },
];

export const HYBRID_STATE_OPTIONS: readonly HybridLocationOption[] = [
  { name: "California", flag: "🇺🇸", subLabel: "USA" },
  { name: "Texas", flag: "🇺🇸", subLabel: "USA" },
  { name: "Florida", flag: "🇺🇸", subLabel: "USA" },
  { name: "New York", flag: "🇺🇸", subLabel: "USA" },
  { name: "Washington", flag: "🇺🇸", subLabel: "USA" },
  { name: "Ontario", flag: "🇨🇦", subLabel: "Canada" },
  { name: "British Columbia", flag: "🇨🇦", subLabel: "Canada" },
  { name: "Alberta", flag: "🇨🇦", subLabel: "Canada" },
  { name: "England", flag: "🇬🇧", subLabel: "United Kingdom" },
  { name: "Scotland", flag: "🇬🇧", subLabel: "United Kingdom" },
  { name: "Maharashtra", flag: "🇮🇳", subLabel: "India" },
  { name: "Karnataka", flag: "🇮🇳", subLabel: "India" },
  { name: "Punjab", flag: "🇵🇰", subLabel: "Pakistan" },
  { name: "Sindh", flag: "🇵🇰", subLabel: "Pakistan" },
  { name: "Dubai", flag: "🇦🇪", subLabel: "UAE" },
  { name: "Abu Dhabi", flag: "🇦🇪", subLabel: "UAE" },
  { name: "New South Wales", flag: "🇦🇺", subLabel: "Australia" },
  { name: "Victoria", flag: "🇦🇺", subLabel: "Australia" },
  { name: "Berlin", flag: "🇩🇪", subLabel: "Germany" },
  { name: "North Holland", flag: "🇳🇱", subLabel: "Netherlands" },
];
