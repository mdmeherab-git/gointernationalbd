import "server-only";
import {
  asBool01,
  asInt,
  asJsonArray,
  asText,
  asTextOrNull,
  oneOf,
  type Coercer,
} from "./crud";

/** Writable columns per table, with their coercers. */

export const CIRCULAR_FIELDS: Record<string, Coercer> = {
  country: asText,
  country_code: asText,
  flag: asText,
  category: asText,
  title: asText,
  sponsor: asText,
  salary: asText,
  vacancy: asInt,
  duty: asText,
  accommodation: asText,
  deadline: asText,
  posted: asText,
  description: asText,
  requirements: asJsonArray,
  circular_url: asTextOrNull,
  circular_type: asTextOrNull,
  is_featured: asBool01,
  featured_image_url: asTextOrNull,
  status: oneOf(["active", "inactive"] as const, "active"),
  sort_order: asInt,
};

export const NOTICE_FIELDS: Record<string, Coercer> = {
  title_bn: asText,
  title_en: asText,
  notice_date: asText,
  tag_type: oneOf(["new", "general", "report"] as const, "general"),
  tag_label_bn: asText,
  tag_label_en: asText,
  status: oneOf(["active", "inactive"] as const, "active"),
  sort_order: asInt,
};

export const SETTINGS_FIELDS: Record<string, Coercer> = {
  contact_phone: asText,
  contact_whatsapp: asText,
  contact_email: asText,
  office_address: asText,
  notice_enabled: asBool01,
  notice_bn: asText,
  notice_en: asText,
  notice_speed: asInt,
  notice_direction: oneOf(["left", "right"] as const, "left"),
};

export const APPLICATION_STATUS = [
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "hired",
] as const;
