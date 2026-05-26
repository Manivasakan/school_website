import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { SUPPORTED_LANGS } from "@/lib/i18n-static";
import { loadSettings, siteOrigin } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { get } = await loadSettings();
  const name = get("site.name", "School");
  const tagline = get("site.tagline", "");
  const origin = siteOrigin();
  const ogImage = get("home.heroImage");
  return {
    metadataBase: new URL(origin),
    title: { default: name, template: `%s · ${name}` },
    description: tagline,
    openGraph: {
      type: "website",
      siteName: name,
      title: name,
      description: tagline,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: tagline,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const seg = pathname.split("/")[1] || "";
  const lang =
    (SUPPORTED_LANGS as readonly string[]).includes(seg) ? seg : "en";

  return (
    <html lang={lang}>
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
