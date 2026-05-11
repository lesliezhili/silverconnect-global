import { getTranslations } from "next-intl/server";

interface Story {
  key: "s1" | "s2" | "s3";
  initial: string;
  initialBg: string;
  initialFg: string;
  tag1Bg: string;
  tag1Fg: string;
  tag2Bg: string;
  tag2Fg: string;
}

const STORIES: Story[] = [
  {
    key: "s1",
    initial: "陈",
    initialBg: "#FCE7F3",
    initialFg: "#DB2777",
    tag1Bg: "#E8F0FE",
    tag1Fg: "#1F6FEB",
    tag2Bg: "#FEF3C7",
    tag2Fg: "#92400E",
  },
  {
    key: "s2",
    initial: "王",
    initialBg: "#DCFCE7",
    initialFg: "#16A34A",
    tag1Bg: "#FEE2E2",
    tag1Fg: "#B91C1C",
    tag2Bg: "#DCFCE7",
    tag2Fg: "#15803D",
  },
  {
    key: "s3",
    initial: "林",
    initialBg: "#EDE9FE",
    initialFg: "#7C3AED",
    tag1Bg: "#FEF3C7",
    tag1Fg: "#92400E",
    tag2Bg: "#E8F0FE",
    tag2Fg: "#1F6FEB",
  },
];

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
                style={{ background: s.initialBg, color: s.initialFg }}
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
              <span
                className="px-2.5 py-0.5 rounded-full text-xs"
                style={{ background: s.tag1Bg, color: s.tag1Fg }}
              >
                {t(`${s.key}.tag1`)}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs"
                style={{ background: s.tag2Bg, color: s.tag2Fg }}
              >
                {t(`${s.key}.tag2`)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
