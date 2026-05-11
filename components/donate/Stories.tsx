import { getTranslations } from "next-intl/server";

type ChipColor = "blue" | "amber" | "green" | "red" | "pink" | "purple";

interface Story {
  key: "s1" | "s2" | "s3";
  initial: string;
  initialColor: ChipColor;
  tag1Color: ChipColor;
  tag2Color: ChipColor;
}

const STORIES: Story[] = [
  { key: "s1", initial: "陈", initialColor: "pink", tag1Color: "blue", tag2Color: "amber" },
  { key: "s2", initial: "王", initialColor: "green", tag1Color: "red", tag2Color: "green" },
  { key: "s3", initial: "林", initialColor: "purple", tag1Color: "amber", tag2Color: "blue" },
];

function chipStyle(c: ChipColor) {
  return { background: `var(--chip-${c}-bg)`, color: `var(--chip-${c}-fg)` };
}

export async function Stories() {
  const t = await getTranslations("donate.stories");
  return (
    <div className="mt-14">
      <h3 className="text-h3 font-bold mb-6">{t("title")}</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {STORIES.map((s) => (
          <article
            key={s.key}
            className="rounded-lg bg-bg-surface border border-border shadow-card p-6"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold"
                style={chipStyle(s.initialColor)}
                aria-hidden
              >
                {s.initial}
              </div>
              <div>
                <div className="font-bold">{t(`${s.key}.name`)}</div>
                <div className="text-xs text-text-tertiary">{t(`${s.key}.meta`)}</div>
              </div>
            </div>
            <p className="mt-4 text-text-secondary leading-relaxed">{t(`${s.key}.quote`)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs" style={chipStyle(s.tag1Color)}>
                {t(`${s.key}.tag1`)}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs" style={chipStyle(s.tag2Color)}>
                {t(`${s.key}.tag2`)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
