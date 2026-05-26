import Link from "next/link";

export default function NewsCard({
  lang,
  slug,
  title,
  publishedAt,
  featuredImage,
  excerpt,
}: {
  lang: string;
  slug: string;
  title: string;
  publishedAt: Date | null;
  featuredImage?: string | null;
  excerpt?: string | null;
}) {
  return (
    <Link
      href={`/${lang}/news/${slug}`}
      className="group block overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
    >
      {featuredImage ? (
        <div className="aspect-video w-full bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredImage}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-brand-500 to-brand-700" />
      )}
      <div className="p-4">
        {publishedAt && (
          <div className="text-xs text-slate-500">
            {publishedAt.toLocaleDateString()}
          </div>
        )}
        <h3 className="mt-1 font-semibold leading-snug group-hover:text-brand-500">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{excerpt}</p>
        )}
      </div>
    </Link>
  );
}
