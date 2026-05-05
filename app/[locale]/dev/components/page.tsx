import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge, type BadgeStatus } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";
import { AIFloatButton } from "@/components/layout/AIFloatButton";
import {
  C1GrandmaWang,
  C3HelperMei,
  C9AICompanion,
  S1TeaTime,
  S5PaymentSuccess,
  S7NetworkError,
} from "@/components/illustrations";

const STATUSES: BadgeStatus[] = [
  "pending",
  "confirmed",
  "inprogress",
  "completed",
  "cancelled",
  "refunded",
];

export default async function DevComponentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  const { locale } = await params;
  setRequestLocale(locale);
  const tDev = await getTranslations("dev");
  const tStatus = await getTranslations("status");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-content px-4 pb-24 pt-6">
        <h1 className="text-h1">{tDev("title")}</h1>
        <p className="mt-2 text-body text-text-secondary">{tDev("subtitle")}</p>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="grid gap-3">
            <Input placeholder="Default input" />
            <Input placeholder="Invalid input" invalid />
          </div>
        </Section>

        <Section title="Status badges">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Badge key={s} status={s}>
                {tStatus(camel(s))}
              </Badge>
            ))}
          </div>
        </Section>

        <Section title="Card">
          <Card>
            <CardTitle>Sample card</CardTitle>
            <CardBody>
              Cards use --bg-surface, --border, --shadow-card per UI_DESIGN §1.3.
            </CardBody>
          </Card>
        </Section>

        <Section title="Skeleton">
          <div className="grid gap-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Section>

        <Section title="Illustrations (placeholders)">
          <div className="flex flex-wrap items-end gap-6">
            <C1GrandmaWang />
            <C3HelperMei />
            <C9AICompanion size={64} />
            <S1TeaTime />
            <S5PaymentSuccess />
            <S7NetworkError />
          </div>
        </Section>

        <p className="mt-12 text-small text-text-secondary">
          Locale: <code>{locale}</code>
        </p>
      </main>
      <AIFloatButton />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-h2 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function camel(s: BadgeStatus): "pending" | "confirmed" | "inProgress" | "completed" | "cancelled" | "refunded" {
  return s === "inprogress" ? "inProgress" : (s as Exclude<BadgeStatus, "inprogress">);
}
