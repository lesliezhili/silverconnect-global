"use client";

const TRANSLATIONS: Record<string, { banner30: string; banner31: string; ref: string; footer: string; footerRef: string }> = {
  en: {
    banner30: "Love the Lord your God with all your heart and with all your soul and with all your mind and with all your strength.",
    banner31: "Love your neighbour as yourself.",
    ref: "— Mark 12:30-31",
    footer: "Love one another. As I have loved you, so you must love one another.",
    footerRef: "— John 13:34",
  },
  zh: {
    banner30: "你要尽心、尽性、尽意、尽力爱主你的神。",
    banner31: "要爱人如己。",
    ref: "— 马可福音 12:30-31",
    footer: "你们要彼此相爱，像我爱你们一样，你们也要彼此相爱。",
    footerRef: "— 约翰福音 13:34",
  },
  zh_tw: {
    banner30: "你要盡心、盡性、盡意、盡力愛主你的神。",
    banner31: "要愛人如己。",
    ref: "— 馬可福音 12:30-31",
    footer: "你們要彼此相愛，像我愛你們一樣，你們也要彼此相愛。",
    footerRef: "— 約翰福音 13:34",
  },
  th: {
    banner30: "จงรักพระเจ้าของท่านด้วยสุดใจ สุดจิต สุดความคิด และสุดกำลังของท่าน",
    banner31: "จงรักเพื่อนบ้านเหมือนรักตนเอง",
    ref: "— มาระโก 12:30-31",
    footer: "จงรักซึ่งกันและกัน เรารักพวกท่านอย่างไร ท่านก็จงรักกันอย่างนั้น",
    footerRef: "— ยอห์น 13:34",
  },
  ko: {
    banner30: "네 마음을 다하고 목숨을 다하고 뜻을 다하고 힘을 다하여 주 너의 하나님을 사랑하라.",
    banner31: "네 이웃을 네 자신과 같이 사랑하라.",
    ref: "— 마가복음 12:30-31",
    footer: "서로 사랑하라. 내가 너희를 사랑한 것 같이 너희도 서로 사랑하라.",
    footerRef: "— 요한복음 13:34",
  },
  ja: {
    banner30: "心を尽くし、精神を尽くし、思いを尽くし、力を尽くして、あなたの神である主を愛せよ。",
    banner31: "あなたの隣人をあなた自身のように愛せよ。",
    ref: "— マルコ 12:30-31",
    footer: "互いに愛し合いなさい。わたしがあなたがたを愛したように、あなたがたも互いに愛し合いなさい。",
    footerRef: "— ヨハネ 13:34",
  },
  vi: {
    banner30: "Ngươi phải hết lòng, hết linh hồn, hết trí khôn, hết sức lực mà kính mến Chúa là Đức Chúa Trời ngươi.",
    banner31: "Ngươi phải yêu người lân cận như mình.",
    ref: "— Mác 12:30-31",
    footer: "Hãy yêu nhau. Như ta đã yêu các ngươi thể nào, thì các ngươi cũng hãy yêu nhau thể ấy.",
    footerRef: "— Giăng 13:34",
  },
};

function getLocale(): string {
  if (typeof window === "undefined") return "en";
  const path = window.location.pathname;
  const seg = path.split("/")[1] || "en";
  return seg in TRANSLATIONS ? seg : "en";
}

export function ScriptureBanner() {
  const t = TRANSLATIONS[getLocale()] || TRANSLATIONS.en;
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center">
      <p className="text-[14px] text-amber-800 italic leading-relaxed">
        &#x201C;{t.banner30}&#x201D;
      </p>
      <p className="text-[14px] text-amber-800 italic mt-0.5">
        &#x201C;{t.banner31}&#x201D; <span className="text-amber-700 text-[13px] not-italic font-normal">{t.ref}</span>
      </p>
    </div>
  );
}

export function ScriptureFooter() {
  const t = TRANSLATIONS[getLocale()] || TRANSLATIONS.en;
  return (
    <footer className="w-full bg-indigo-50 border-t border-indigo-200 py-3 px-4 text-center mt-auto">
      <p className="text-[14px] text-indigo-800 italic">
        &#x201C;{t.footer}&#x201D;
      </p>
      <p className="text-[12px] text-indigo-600 mt-1">{t.footerRef}</p>
    </footer>
  );
}
