"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

interface Vol { providerId: string; userId: string; name: string; email: string; phone: string; status: string; churchName: string; completedVisits: number; reportCount: number; fiveStars: number; avgRating: number|null; seniorsServed: number; createdAt: string; }
interface Stats { total: number; active: number; pending: number; suspended: number; }

function VolMgmtContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const [vols, setVols] = useState<Vol[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, suspended: 0 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");

  const load = () => {
    fetch("/api/admin/volunteer-management?status=" + filter).then(r => r.json()).then(d => {
      if (d.success) { setVols(d.volunteers); setStats(d.stats); }
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const toggleSelect = (id: string) => {
    const s = new Set(selected); if (s.has(id)) s.delete(id); else s.add(id); setSelected(s);
  };
  const selectAll = () => { if (selected.size === vols.length) setSelected(new Set()); else setSelected(new Set(vols.map(v => v.providerId))); };

  const bulkAction = async (action: string) => {
    if (selected.size === 0) return;
    const body: Record<string, unknown> = { action, providerIds: Array.from(selected) };
    if (action === "message") { if (!bulkMessage.trim()) return; body.message = bulkMessage; }
    const r = await fetch("/api/admin/volunteer-management", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.success) { setActionMsg(`${action}: ${d.affected} affected`); setSelected(new Set()); setBulkMessage(""); load(); setTimeout(() => setActionMsg(""), 3000); }
  };

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "\u52a0\u8f7d\u4e2d..." : "Loading..."}</div>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{isZh ? "\u5fd7\u613f\u8005\u7ba1\u7406" : "Volunteer Management"}</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-gray-700">{stats.total}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-700">{stats.active}</p><p className="text-xs text-green-600">Active</p></div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-amber-700">{stats.pending}</p><p className="text-xs text-amber-600">Pending</p></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-red-700">{stats.suspended}</p><p className="text-xs text-red-600">Suspended</p></div>
      </div>

      {/* Filter + Bulk actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {["all","approved","pending","suspended"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={"px-3 py-1.5 rounded-full text-sm font-medium " + (filter === f ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600")}>{f}</button>
        ))}
        <span className="flex-1" />
        <button onClick={selectAll} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">{selected.size === vols.length ? "Deselect" : "Select All"}</button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-purple-700 font-medium mb-2">{selected.size} selected</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => bulkAction("approve")} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">\u2713 Approve</button>
            <button onClick={() => bulkAction("suspend")} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">\u26d4 Suspend</button>
            <button onClick={() => bulkAction("reactivate")} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">\u21bb Reactivate</button>
            <button onClick={() => bulkAction("assign_badge")} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium">\ud83c\udfc5 Badge</button>
          </div>
          <div className="flex gap-2 mt-2">
            <input value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} placeholder="Message to send..." className="flex-1 p-2 border border-gray-300 rounded-lg text-sm" />
            <button onClick={() => bulkAction("message")} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">\ud83d\udce8 Send</button>
          </div>
        </div>
      )}

      {actionMsg && <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-center text-green-700 font-medium">{actionMsg}</div>}

      {/* Volunteer list */}
      <div className="space-y-2">
        {vols.map(v => (
          <div key={v.providerId} className={"bg-white border rounded-xl p-4 flex items-center gap-4 " + (selected.has(v.providerId) ? "border-purple-400 bg-purple-50" : "border-gray-200")}>
            <input type="checkbox" checked={selected.has(v.providerId)} onChange={() => toggleSelect(v.providerId)} className="w-5 h-5 accent-purple-600" />
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-purple-600">{(v.name||v.email||"?")[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-gray-800 truncate">{v.name || v.email}</p>
                <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (v.status === "approved" ? "bg-green-100 text-green-700" : v.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{v.status}</span>
              </div>
              <p className="text-xs text-gray-400 truncate">{v.churchName || v.email} \u2022 {v.completedVisits}v \u2022 {v.reportCount}r \u2022 {v.avgRating ? v.avgRating + "\u2b50" : "no rating"} \u2022 {v.seniorsServed}s</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function VolunteerManagementPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><VolMgmtContent /></Suspense>; }
