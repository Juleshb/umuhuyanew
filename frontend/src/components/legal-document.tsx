import Link from "next/link";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "group"; title: string; items: string[] };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

type Props = {
  eyebrow: string;
  title: string;
  effective: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  closing?: string;
};

export function LegalDocument({
  eyebrow,
  title,
  effective,
  updated,
  intro,
  sections,
  closing,
}: Props) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl text-[#0b1c2c] sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-ink/55">
        Owned, operated and managed by Shima Prime Services Ltd
      </p>
      <p className="mt-1 text-sm text-ink/55">
        Effective date: {effective}
        <span className="mx-2">·</span>
        Last updated: {updated}
      </p>
      <p className="mt-8 text-lg leading-relaxed text-ink/80">{intro}</p>

      <div className="mt-10 space-y-10">
        {sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="font-display text-2xl text-[#0b1c2c]">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-ink/80">
              {section.blocks.map((block, blockIndex) => {
                if (block.type === "p") {
                  return <p key={blockIndex}>{block.text}</p>;
                }
                if (block.type === "group") {
                  return (
                    <div key={blockIndex}>
                      <h3 className="font-semibold text-[#0b1c2c]">{block.title}</h3>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                const ListTag = block.ordered ? "ol" : "ul";
                return (
                  <ListTag
                    key={blockIndex}
                    className={
                      block.ordered
                        ? "list-decimal space-y-1.5 pl-5"
                        : "list-disc space-y-1.5 pl-5"
                    }
                  >
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ListTag>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {closing ? <p className="mt-12 text-sm leading-relaxed text-ink/60">{closing}</p> : null}

      <p className="mt-8 text-sm text-ink/55">
        <Link href="/terms" className="text-teal hover:underline">
          Terms and Conditions
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="text-teal hover:underline">
          Privacy Policy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/about" className="text-teal hover:underline">
          About
        </Link>
      </p>
    </article>
  );
}
