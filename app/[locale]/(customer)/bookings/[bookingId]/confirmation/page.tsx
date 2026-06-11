import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; bookingId: string }>;
}) {
  const { locale, bookingId } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header title="Booking Confirmed" />
      <main className="max-w-lg mx-auto p-6 text-center">
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-green-800 mb-3">
            Payment Successful!
          </h1>
          <p className="text-xl text-green-700 mb-4">
            Your booking is confirmed. Your helper will be notified.
          </p>
          <p className="text-base text-gray-600">
            Booking ref: {bookingId.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/home"
            className="block w-full py-4 px-6 bg-green-600 text-white text-xl 
                       font-bold rounded-xl text-center min-h-[56px]"
          >
            Back to Home
          </Link>

          <Link
            href="/bookings"
            className="block w-full py-4 px-6 bg-gray-100 text-gray-700 text-lg
                       font-semibold rounded-xl text-center"
          >
            View My Bookings
          </Link>
        </div>
      </main>
    </>
  );
}
