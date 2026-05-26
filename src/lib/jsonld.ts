/**
 * Helpers to build JSON-LD structured data objects (schema.org).
 * Use the JsonLd component to render them safely as <script> tags.
 */

export function organizationLd(opts: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: string;
  telephone?: string;
  email?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: opts.name,
    url: opts.url,
    logo: opts.logo,
    description: opts.description,
    address: opts.address ? { "@type": "PostalAddress", streetAddress: opts.address } : undefined,
    telephone: opts.telephone,
    email: opts.email,
    sameAs: opts.sameAs?.filter(Boolean),
  };
}

export function newsArticleLd(opts: {
  url: string;
  headline: string;
  image?: string;
  datePublished: Date;
  dateModified?: Date;
  publisherName: string;
  publisherLogo?: string;
  description?: string;
  inLanguage: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: opts.url,
    headline: opts.headline,
    image: opts.image ? [opts.image] : undefined,
    datePublished: opts.datePublished.toISOString(),
    dateModified: (opts.dateModified ?? opts.datePublished).toISOString(),
    inLanguage: opts.inLanguage,
    description: opts.description,
    publisher: {
      "@type": "EducationalOrganization",
      name: opts.publisherName,
      logo: opts.publisherLogo ? { "@type": "ImageObject", url: opts.publisherLogo } : undefined,
    },
  };
}

export function eventLd(opts: {
  name: string;
  startsAt: Date;
  endsAt?: Date | null;
  location?: string | null;
  description?: string | null;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opts.name,
    startDate: opts.startsAt.toISOString(),
    endDate: opts.endsAt?.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: opts.location
      ? { "@type": "Place", name: opts.location, address: opts.location }
      : undefined,
    description: opts.description ?? undefined,
    url: opts.url,
  };
}
