import { setRequestLocale, getTranslations } from "next-intl/server";
import { Star, ShieldCheck, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { CURRENCY_SYMBOL, TAX_ABBR } from "@/components/domain/country";
import type { CountryCode } from "@/components/layout";

const SLOTS = ["09:00", "11:00", "14:00", "16:00"];

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("provider");
  const country = "AU" as CountryCode;
  const isZh = locale === "zh";
  const sym = CURRENCY_SYMBOL[country];
  const taxAbbr = TAX_ABBR[country];

  const services = isZh
    ? [
        { n: "基础清洁 2 小时", d: "客厅 + 厨房 + 1 卫", p: 110 },
        { n: "深度清洁 3 小时", d: "全屋 + 玻璃 + 油烟机", p: 195 },
        { n: "换季大扫除 4 小时", d: "全屋整理 + 收纳", p: 280 },
      ]
    : [
        { n: "Basic clean · 2h", d: "Living + kitchen + 1 bath", p: 110 },
        { n: "Deep clean · 3h", d: "Whole home + windows + range", p: 195 },
        { n: "Seasonal · 4h", d: "Whole home + organising", p: 280 },
      ];
  const days = isZh
    ? ["今", "周二", "周三", "周四", "周五", "周六", "周日"]
    : ["Today", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const totalPrice = country === "CN" ? "¥1,560" : `${sym}195.00`;
  const ctaText = isZh
    ? `下一步 · ${totalPrice} 含 ${taxAbbr}`
    : `Continue · ${totalPrice} incl. ${taxAbbr}`;

  return (
    <>
      <Header country={country} back />
      <main className="mx-auto w-full max-w-content overflow-auto bg-bg-surface px-5 pb-[120px] pt-5">
        {/* Header */}
        <header className="flex items-start gap-4">
          <ProviderAvatar size={100} hue={0} initials={isZh ? "李" : "HL"} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-extrabold text-text-primary">
              {isZh ? "李 师傅 (Helen Li)" : "Helen Li"}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5">
              <Star size={18} className="text-[var(--brand-accent)]" aria-hidden />
              <span className="font-bold">4.9</span>
              <span className="text-[14px] text-text-tertiary">
                (132 {t("reviews", { count: 132 }).replace(/^132 /, "")})
              </span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              <li>
                <span className="inline-flex h-7 items-center gap-1 rounded-sm bg-success-soft px-2 text-[14px] font-semibold text-success">
                  <ShieldCheck size={14} aria-hidden /> {t("verified")}
                </span>
              </li>
              <li>
                <span className="inline-flex h-7 items-center rounded-sm bg-brand-soft px-2 text-[14px] font-semibold text-brand">
                  {t("firstAid")}
                </span>
              </li>
              <li>
                <span className="inline-flex h-7 items-center rounded-sm bg-brand-soft px-2 text-[14px] font-semibold text-brand">
                  {isZh ? "中文" : "Mandarin"}
                </span>
              </li>
            </ul>
          </div>
        </header>

        {/* Bio */}
        <section className="mt-4 rounded-md border border-border bg-bg-base p-3.5">
          <p className="text-[15px] leading-relaxed text-text-secondary">{t("bio")}</p>
        </section>

        {/* Services offered */}
        <section className="mt-6">
          <h2 className="mb-2.5 text-[18px] font-bold">{t("servicesOffered")}</h2>
          <ul className="flex flex-col gap-2.5">
            {services.map((s, i) => {
              const selected = i === 1;
              return (
                <li key={s.n}>
                  <label
                    className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-md border-[1.5px] bg-bg-base p-3.5 ${
                      selected ? "border-2 border-brand" : "border-border"
                    }`}
                  >
                    <input type="radio" name="svc" defaultChecked={selected} className="sr-only" />
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-brand" : "border-border-strong"
                      }`}
                      aria-hidden
                    >
                      {selected && <span className="h-3 w-3 rounded-full bg-brand" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-bold">{s.n}</span>
                      <span className="mt-0.5 block text-[13px] text-text-secondary">{s.d}</span>
                    </span>
                    <span className="shrink-0 text-[17px] font-bold text-brand">
                      {country === "CN" ? `¥${s.p * 8}` : `${sym}${s.p}`}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 7-day availability */}
        <section className="mt-6">
          <h2 className="mb-2.5 text-[18px] font-bold">{t("available7d")}</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, di) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <span className="text-[12px] font-bold uppercase text-text-secondary">{d}</span>
                {SLOTS.map((s, si) => {
                  const avail = (di + si) % 3 !== 0;
                  const sel = di === 1 && si === 2;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={!avail}
                      className={`h-9 w-full rounded-sm text-[12px] font-semibold ${
                        sel
                          ? "bg-brand text-white"
                          : avail
                          ? "border border-border bg-bg-base text-text-primary"
                          : "bg-bg-surface-2 text-text-tertiary opacity-50"
                      }`}
                    >
                      {avail ? s : "—"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="mt-6">
          <h2 className="mb-2.5 text-[18px] font-bold">{t("reviewsTitle")}</h2>
          <div className="flex items-start gap-4 rounded-md border border-border bg-bg-base p-3.5">
            <div className="text-[36px] font-extrabold text-text-primary">4.9</div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((n) => (
                <div key={n} className="mb-0.5 flex items-center gap-1.5">
                  <span className="w-3 text-[12px] text-text-tertiary">{n}</span>
                  <Star size={12} className="text-[var(--brand-accent)]" aria-hidden />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-bg-surface-2">
                    <div
                      className="h-full bg-[var(--brand-accent)]"
                      style={{ width: [85, 12, 2, 1, 0][5 - n] + "%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <article className="mt-3 rounded-md border border-border bg-bg-base p-3.5">
            <div className="flex gap-1 text-[var(--brand-accent)]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} aria-hidden />
              ))}
            </div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">
              {isZh
                ? "李师傅非常细心，把家里打扫得干干净净，老妈很满意。下次还会再约。"
                : "Helen was thorough and kind to my mum. Will book again — she felt very comfortable."}
            </p>
            <p className="mt-1.5 text-[12px] text-text-tertiary">
              — Sarah W. · {isZh ? "2 周前" : "2 weeks ago"}
            </p>
          </article>
        </section>
      </main>

      {/* Sticky CTA */}
      <div className="sticky bottom-[84px] z-10 flex gap-2 border-t border-border bg-bg-base p-3 sm:bottom-0">
        <button
          type="button"
          aria-label={t("messageLabel")}
          className="inline-flex h-14 w-14 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-bg-base text-text-secondary"
        >
          <MessageCircle size={22} aria-hidden />
        </button>
        <Link
          href={`/bookings/new?providerId=${id}&step=1`}
          className="flex h-14 flex-1 items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
        >
          {ctaText}
        </Link>
      </div>
    </>
  );
}
