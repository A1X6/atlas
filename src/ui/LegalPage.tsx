import { Separator } from "@/src/components/ui/separator";

/**
 * Presentational shell for legal pages (Privacy, Terms). Kept deliberately plain
 * and readable — a single document column with a header band and numbered
 * sections — while still matching the site theme.
 */
export function LegalPage({
  eyebrow,
  title,
  lastUpdatedLabel,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  intro?: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      {/* Header */}
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
        {eyebrow}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-text-3">
        {lastUpdatedLabel}: {lastUpdated}
      </p>
      {intro ? (
        <p className="mt-6 text-[15px] leading-relaxed text-text-2">{intro}</p>
      ) : null}

      <Separator className="mt-8" />

      {/* Sections */}
      <div className="mt-8 space-y-8">
        {sections.map((section, i) => (
          <section key={section.title}>
            <h2 className="flex items-baseline gap-3 text-lg font-semibold text-text">
              <span className="font-mono text-sm text-text-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-text-2">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
