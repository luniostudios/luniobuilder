type JsonLdProps = {
  schema: Record<string, unknown>;
};

/** Server-safe JSON-LD for rich results / entity signals. */
export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
