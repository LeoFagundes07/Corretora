import type { AuthUser, SiteSettings } from "./types";

export type { AuthUser, SiteSettings } from "./types";

/** Editable mirror of the settings form — numeric fields kept as strings for the inputs. */
export interface SiteSettingsForm {
  brand_name: string;
  tagline: string;
  realtor_name: string;
  realtor_full_name: string;
  creci: string;
  phone: string;
  whatsapp: string;
  contact_email: string;
  address: string;
  about_text: string;
  about_photo_url: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  footer_note: string;
  default_interest_rate: string;
  retention_months: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
}
