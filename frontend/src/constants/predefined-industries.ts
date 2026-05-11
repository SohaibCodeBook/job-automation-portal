import predefinedIndustriesJson from "./predefined-industries.json";

/** Deduped catalog (first occurrence order); used by industries searchable multi-select. */
export const PREDEFINED_INDUSTRIES: readonly string[] =
  predefinedIndustriesJson as string[];
