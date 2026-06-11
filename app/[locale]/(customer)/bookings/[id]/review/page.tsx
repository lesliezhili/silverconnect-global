import { setRequestLocale } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { reviews } from "@/lib/db/schema/reviews";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function submitReview(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const bookingId = String(formData.get("bookingId") ?? "");
  const rating = Number(formData.get("rating") ?? 5);
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);

  const [booking] = await db.select().from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.customerId, me.id))).limit(1);
  if (!booking || booking.status !== "completed") {
    nextRedirect(`/${locale}/bookings/${bookingId}`);
    return;
  }

  // Insert review (upsert on booking)
  await db.insert(reviews).values({
    bookingId, customerId: me.id, providerId: booking.providerId!,
    rating: Math.min(5, Math.max(1, rating)), comment,
  }).onConflictDoNothing();

  nextRedirect(`/${locale}/bookings/${bookingId}?reviewed=1`);
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: bookingId } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  const country = await getCountry();

  const [booking] = await db.select().from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.customerId, me.id))).limit(1);
  if (!booking || booking.status !== "completed") {
    nextRedirect(`/${locale}/bookings/${bookingId}`);
  }

  // Check if already reviewed
  const [existing] = await db.select({ id: reviews.id }).from(reviews)
    .where(eq(reviews.bookingId, bookingId)).limit(1);
  if (existing) nextRedirect(`/${locale}/bookings/${bookingId}?reviewed=1`);

  return (
    <>
      <Header country={country} back signedIn initials={me.initials} />
      <main id="main-content" className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12">
        <h1 className="text-[26px] font-extrabold">Rate Your Experience</h1>
        <p className="mt-1 text-[16px] text-text-secondary">
          Your feedback helps us rank providers and maintain quality.
        </p>

        <form action={submitReview} className="mt-6 flex flex-col gap-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="bookingId" value={bookingId} />

          {/* Star Rating */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-[17px] font-semibold">Overall Rating</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} className="cursor-pointer">
                  <input type="radio" name="rating" value={star} className="peer sr-only" defaultChecked={star === 5} />
                  <Star size={36} className="text-border peer-checked:fill-warning peer-checked:text-warning transition-colors" />
                </label>
              ))}
            </div>
          </fieldset>

          {/* Comment */}
          <div>
            <label className="mb-1.5 block text-[17px] font-semibold">Comment (optional)</label>
            <textarea
              name="comment" rows={4} maxLength={500}
              placeholder="Tell us about your experience..."
              className="w-full rounded-xl border border-border bg-bg-base px-4 py-3 text-[16px] outline-none focus:border-brand resize-none"
            />
          </div>

          <button type="submit"
            className="mt-2 h-14 w-full rounded-xl bg-brand text-[17px] font-bold text-white shadow-md hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            Submit Review
          </button>
        </form>
      </main>
    </>
  );
}
