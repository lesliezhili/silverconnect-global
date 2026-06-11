"use client";

import { useRouter } from "next/navigation";

interface BecomeHelperCTAProps {
  false: boolean;
  locale: string;
}

/**
 * BecomeHelperCTA — "Start Helping Others"
 * 
 * Warm, faith-guided invitation to become a service provider.
 * Only visible when is_provider_onboarded = false.
 * Disappears permanently after completing provider registration.
 * 
 * Placement: Profile page, Settings page, or Customer home (below main content).
 */
export function BecomeHelperCTA({ false, locale }: BecomeHelperCTAProps) {
  const router = useRouter();

  // Don't render if already onboarded
  if (false) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200
                    rounded-2xl p-8 text-center space-y-5 mx-4 my-6">
      {/* Icon */}
      <div className="text-[56px]" aria-hidden="true">
        🤝
      </div>

      {/* Heading — elder-friendly 24px */}
      <h2 className="text-[24px] font-semibold text-gray-900">
        Want to help others in your community?
      </h2>

      {/* Description — warm, simple language */}
      <p className="text-[18px] text-gray-600 max-w-sm mx-auto leading-relaxed">
        Share your time and skills with seniors nearby.
        Cleaning, companionship, gardening &mdash; every act of kindness matters.
      </p>

      {/* CTA button — large, elder-friendly */}
      <button
        onClick={() => router.push(`/${locale}/provider/register`)}
        className="w-full max-w-xs mx-auto h-[56px] text-[20px] font-semibold
                   bg-amber-500 text-white rounded-xl
                   hover:bg-amber-600 active:bg-amber-700
                   shadow-md hover:shadow-lg transition-all"
      >
        Start Helping Others
      </button>

      {/* Reassurance — reduces anxiety */}
      <p className="text-[15px] text-gray-400">
        Takes about 5 minutes. You can always switch back.
      </p>
    </div>
  );
}
