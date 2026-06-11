"use client";

import { useTranslations } from "next-intl";

/**
 * Elder-First Home Screen
 * Design: 20px base font, 56px touch targets, max 3 actions, bottom nav
 * 4 hours session timeout, AAA contrast 7:1
 */
export default function HomeScreen() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen bg-white px-4 pb-24 pt-6">
      {/* Greeting - large, warm */}
      <section className="mb-8">
        <h1 className="text-elder-heading font-bold text-gray-900">
          {t("greeting")}
        </h1>
        <p className="mt-2 text-elder-body text-gray-600">
          {t("subtitle")}
        </p>
      </section>

      {/* Quick Actions - max 3, large touch targets */}
      <section className="mb-8 space-y-4">
        <QuickActionButton
          icon="🏠"
          label={t("quickBook")}
          href="/bookings/new"
          primary
        />
        <QuickActionButton
          icon="📋"
          label={t("myBookings")}
          href="/bookings"
        />
        <QuickActionButton
          icon="📞"
          label={t("emergency")}
          href="/safety"
          emergency
        />
      </section>

      {/* Upcoming Service Card */}
      <section className="mb-8">
        <h2 className="mb-4 text-elder-subheading font-semibold text-gray-900">
          {t("upcoming")}
        </h2>
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
          <p className="text-elder-body text-gray-700">
            {t("noUpcoming")}
          </p>
        </div>
      </section>

      {/* Service Categories Grid - 2 columns, large icons */}
      <section>
        <h2 className="mb-4 text-elder-subheading font-semibold text-gray-900">
          {t("categories")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <CategoryCard icon="🧹" label={t("cleaning")} href="/services/domestic" />
          <CategoryCard icon="🌳" label={t("garden")} href="/services/garden" />
          <CategoryCard icon="🔧" label={t("repair")} href="/services/repair" />
          <CategoryCard icon="💊" label={t("personalCare")} href="/services/personal" />
          <CategoryCard icon="👋" label={t("companion")} href="/services/companion" />
          <CategoryCard icon="🚗" label={t("transport")} href="/services/transport" />
        </div>
      </section>
    </main>
  );
}

function QuickActionButton({ icon, label, href, primary, emergency }: {
  icon: string; label: string; href: string; primary?: boolean; emergency?: boolean;
}) {
  const baseClasses = "flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-transform active:scale-[0.98]";
  const classes = emergency
    ? `${baseClasses} bg-red-600 text-white shadow-lg border-2 border-red-700`
    : primary
    ? `${baseClasses} bg-blue-600 text-white shadow-lg border-2 border-blue-700`
    : `${baseClasses} bg-gray-50 text-gray-900 border-2 border-gray-200`;

  return (
    <a href={href} className={classes} style={{ minHeight: "64px" }}>
      <span className="text-3xl">{icon}</span>
      <span className="text-elder-body font-semibold">{label}</span>
    </a>
  );
}

function CategoryCard({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white p-6 text-center transition-transform active:scale-[0.97]"
      style={{ minHeight: "120px" }}
    >
      <span className="mb-2 text-4xl">{icon}</span>
      <span className="text-elder-small font-medium text-gray-900">{label}</span>
    </a>
  );
}
