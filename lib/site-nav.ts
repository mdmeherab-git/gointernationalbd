/* The public site's main menu, shared by the home header, the jobs header and
   the footer, so they can never drift apart. Section links use "/#id" so they
   work from any page (on the home page they just scroll; elsewhere they go
   home first). */

export type SiteNavItem = {
  key: string;
  href: string;
  bn: string;
  en: string;
};

export const SITE_NAV: SiteNavItem[] = [
  { key: "home", href: "/", bn: "হোম", en: "Home" },
  { key: "services", href: "/#services", bn: "সেবা", en: "Services" },
  { key: "visa-check", href: "/#visa-check", bn: "ভিসা চেক", en: "Visa Check" },
  { key: "ai", href: "/#ai-assistant", bn: "AI সহকারী", en: "AI Assistant" },
  { key: "jobs", href: "/jobs", bn: "চাকরি", en: "Jobs" },
  { key: "news", href: "/#news", bn: "নিউজ", en: "News" },
  { key: "about", href: "/#about", bn: "আমাদের সম্পর্কে", en: "About Us" },
  { key: "contact", href: "/#contact", bn: "যোগাযোগ", en: "Contact" },
];

/** The services listed in the footer; each one opens the real feature. */
export const SITE_SERVICES: SiteNavItem[] = [
  { key: "visa-check", href: "/#visa-check", bn: "ভিসা চেক", en: "Visa Check" },
  { key: "jobs", href: "/jobs", bn: "চাকরির সার্কুলার", en: "Job Circular" },
  { key: "cv", href: "/account/cv", bn: "সিভি তৈরি", en: "Build Your CV" },
  { key: "track", href: "/account/applications", bn: "আবেদন ট্র্যাকিং", en: "Application Tracking" },
  { key: "ai", href: "/#ai-assistant", bn: "AI Assistant", en: "AI Assistant" },
];
