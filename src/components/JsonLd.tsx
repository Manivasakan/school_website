/**
 * Renders a JSON-LD object as a <script type="application/ld+json"> tag.
 * Strips undefined values to keep the output clean.
 */
export default function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data, (_k, v) => (v === undefined ? undefined : v));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
