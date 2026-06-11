"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const MOOD_EMOJI: Record<string, string> = { joyful: "\ud83d\ude0a", peaceful: "\u262e\ufe0f", struggling: "\ud83d\ude1f", grieving: "\ud83d\ude22" };

interface LinkedSenior {
  seniorId: string; name: string; phone: string | null; relationship: string; approved: boolean;
  stats: { totalVisits: number; completed: number; upcoming: number; lastVisit: string | null };
  lastMood: string | null; lastSurvey: { rating: number; emotional: string; date: string } | null;
}

function FamilyPortalContent() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const t = (en: string, zh: string, th?: string, ko?: string, ja?: string) => {
    if (locale.startsWith("zh")) return zh;
    if (locale === "th") return th || en;
    if (locale === "ko") return ko || en;
    if (locale === "ja") return ja || en;
    return en;
  };
  const isZh = locale.startsWith("zh");
  const [seniors, setSeniors] = useState<LinkedSenior[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLink, setShowLink] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkRelation, setLinkRelation] = useState("child");
  const [linkMsg, setLinkMsg] = useState("");

  useEffect(() => {
    fetch("/api/family").then(r => r.json()).then(d => { if (d.success) setSeniors(d.linkedSeniors || []); }).finally(() => setLoading(false));
  }, []);

  const linkSenior = async () => {
    if (!linkEmail.trim()) return;
    const r = await fetch("/api/family", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seniorEmail: linkEmail, relationship: linkRelation }) });
    const d = await r.json();
    if (d.success) { setLinkMsg(isZh ? "\u5df2\u53d1\u9001\u8bf7\u6c42\u7ed9 " + d.seniorName : "Request sent to " + d.seniorName); setShowLink(false); setLinkEmail(""); }
    else { setLinkMsg(d.error || "Error"); }
  };

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "\u52a0\u8f7d\u4e2d..." : "Loading..."}</div>;

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isZh ? "\u5bb6\u5ead\u5173\u7231" : "Family Care"}</h1>
          <p className="text-lg text-gray-500">{isZh ? "\u5173\u6ce8\u60a8\u7684\u4eb2\u4eba" : "Watch over your loved ones"}</p>
        </div>
        <button onClick={() => setShowLink(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-base font-medium">
          + {isZh ? "\u6dfb\u52a0" : "Link"}
        </button>
      </div>

      {linkMsg && <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-blue-700 text-center">{linkMsg}</div>}

      {/* Link modal */}
      {showLink && (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 mb-6">
          <h3 className="text-xl font-semibold mb-3">{isZh ? "\u8fde\u63a5\u4eb2\u4eba" : "Link a Senior"}</h3>
          <input value={linkEmail} onChange={e => setLinkEmail(e.target.value)}
            placeholder={isZh ? "\u4eb2\u4eba\u7684\u90ae\u7bb1" : "Senior's email address"}
            className="w-full p-3 border border-gray-300 rounded-xl text-lg mb-3" />
          <select value={linkRelation} onChange={e => setLinkRelation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl text-lg mb-4">
            <option value="child">{isZh ? "\u5b50\u5973" : "Son/Daughter"}</option>
            <option value="grandchild">{isZh ? "\u5b59\u5b50\u5973" : "Grandchild"}</option>
            <option value="sibling">{isZh ? "\u5144\u5f1f\u59d0\u59b9" : "Sibling"}</option>
            <option value="spouse">{isZh ? "\u914d\u5076" : "Spouse"}</option>
            <option value="other">{isZh ? "\u5176\u4ed6" : "Other"}</option>
          </select>
          <div className="flex gap-3">
            <button onClick={() => setShowLink(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-lg">{isZh ? "\u53d6\u6d88" : "Cancel"}</button>
            <button onClick={linkSenior} className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-lg font-bold">{isZh ? "\u53d1\u9001\u8bf7\u6c42" : "Send Request"}</button>
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">{isZh ? "\u4eb2\u4eba\u9700\u8981\u6279\u51c6\u6b64\u8fde\u63a5" : "Senior must approve this connection"}</p>
        </div>
      )}

      {/* Linked seniors */}
      {seniors.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <p className="text-5xl mb-4">\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66</p>
          <p className="text-xl text-gray-500 mb-2">{isZh ? "\u8fd8\u6ca1\u6709\u8fde\u63a5\u4eb2\u4eba" : "No linked seniors yet"}</p>
          <p className="text-base text-gray-400">{isZh ? "\u70b9\u51fb\u4e0a\u65b9\u201c\u6dfb\u52a0\u201d\u6309\u94ae\u8fde\u63a5" : "Tap '+ Link' above to connect"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {seniors.map(s => (
            <button key={s.seniorId} onClick={() => router.push("/" + locale + "/family/" + s.seniorId)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-left">
              {/* Header */}
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600">{(s.name||"?")[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-semibold text-gray-800">{s.name}</p>
                  <p className="text-sm text-gray-400">{s.relationship} {!s.approved && "\u2022 \u23f3 pending"}</p>
                </div>
                {s.lastMood && <span className="text-2xl">{MOOD_EMOJI[s.lastMood]||""}</span>}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{s.stats.completed}</p>
                  <p className="text-xs text-emerald-600">{isZh ? "\u5b8c\u6210" : "Visits"}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-700">{s.stats.upcoming}</p>
                  <p className="text-xs text-blue-600">{isZh ? "\u5373\u5c06" : "Upcoming"}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-700">{s.lastSurvey ? s.lastSurvey.rating + "/5" : "\u2014"}</p>
                  <p className="text-xs text-amber-600">{isZh ? "\u6ee1\u610f" : "Rating"}</p>
                </div>
              </div>

              {/* Last visit */}
              {s.stats.lastVisit && (
                <p className="text-sm text-gray-400 mt-2">{isZh ? "\u6700\u8fd1\u63a2\u8bbf" : "Last visit"}: {new Date(s.stats.lastVisit).toLocaleDateString()}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

export default function FamilyPortalPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><FamilyPortalContent /></Suspense>; }
