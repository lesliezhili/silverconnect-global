"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function FaithInfoContent() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">\u271D</div>
        <h1 className="text-3xl font-bold text-gray-900">Serve Through Faith</h1>
        <p className="text-lg text-gray-500 mt-2">Volunteer your gifts to bless elderly neighbours</p>
      </div>

      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-emerald-800 mb-3">\ud83d\ude4f What is Faith Service?</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Faith service volunteers bring spiritual care and companionship to isolated seniors.
            Whether through Bible study, prayer, hymn-singing, or a simple pastoral visit —
            you can make an eternal difference in someone&apos;s life.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-3">\ud83d\udcd6 Services You Can Offer</h2>
          <ul className="space-y-2 text-lg text-gray-700">
            <li>\u2022 Bible Study — lead small group studies</li>
            <li>\u2022 Prayer Group — guided intercessory prayer</li>
            <li>\u2022 Pastoral Visit — conversation, communion, care</li>
            <li>\u2022 Worship &amp; Hymns — sing together</li>
            <li>\u2022 Discipleship — one-on-one faith mentoring</li>
            <li>\u2022 Sunday School — structured Bible teaching</li>
            <li>\u2022 Church Planting — training for new communities</li>
            <li>\u2022 Bible Reading Plan — daily guided reading</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-amber-800 mb-3">\u2728 What We Ask</h2>
          <ul className="space-y-2 text-lg text-gray-700">
            <li>\u2022 Active church member (pastor reference required)</li>
            <li>\u2022 Working with Vulnerable People check</li>
            <li>\u2022 Affirm the Apostles&apos; Creed</li>
            <li>\u2022 Serve with love and patience</li>
            <li>\u2022 Respect all people regardless of beliefs</li>
            <li>\u2022 No financial gain (volunteer only)</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-purple-800 mb-3">\ud83c\udf1f Why Volunteer?</h2>
          <blockquote className="text-lg italic text-gray-700 mb-3">
            &ldquo;Whatever you did for one of the least of these brothers and sisters of mine, you did for me.&rdquo;
          </blockquote>
          <p className="text-right text-base font-semibold text-purple-600">&mdash; Matthew 25:40</p>
        </div>

        <button onClick={() => router.push("/" + locale + "/provider/register-faith")}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold rounded-xl min-h-[64px] mt-4">
          Register as Faith Volunteer
        </button>
      </div>
    </main>
  );
}

export default function FaithInfoPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><FaithInfoContent /></Suspense>;
}
