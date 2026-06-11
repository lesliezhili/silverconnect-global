"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const LICENSED_TRADES = [
  { code: "electrical", en: "Electrician", zh: "电工", licenseLabel: "Electrical License", zhLabel: "电工执照号" },
  { code: "plumber", en: "Plumber", zh: "水管工", licenseLabel: "Plumbing License", zhLabel: "水管工执照号" },
  { code: "tree_cut", en: "Arborist / Tree Cutter", zh: "树艺师/伐木工", licenseLabel: "Arborist Certificate", zhLabel: "树艺师证书号" },
];

interface LicenseEntry {
  serviceCode: string;
  licenseNumber: string;
  licenseType: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  status: string;
}

export default function LicensesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const isVi = locale === "vi";

  const [licenses, setLicenses] = useState<LicenseEntry[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/provider/licenses")
      .then(r => r.json())
      .then(d => {
        if (d.licenses && d.licenses.length > 0) {
          setLicenses(d.licenses);
        } else {
          // Initialize empty entries for each trade
          setLicenses(LICENSED_TRADES.map(t => ({
            serviceCode: t.code,
            licenseNumber: "",
            licenseType: t.licenseLabel,
            insuranceProvider: "",
            insurancePolicyNumber: "",
            insuranceExpiry: "",
            status: "pending",
          })));
        }
      })
      .catch(() => {});
  }, []);

  const update = (code: string, field: string, value: string) => {
    setLicenses(prev => prev.map(l =>
      l.serviceCode === code ? { ...l, [field]: value } : l
    ));
  };

  const save = async () => {
    await fetch("/api/provider/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenses }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="max-w-lg mx-auto p-6 pb-32">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {isZh ? "📋 执照与保险" : isVi ? "📋 Giấy Phép & Bảo Hiểm" : "📋 License & Insurance"}
      </h1>
      <p className="text-lg text-gray-500 mb-2">
        {isZh ? "持牌服务需要验证后才能接单" : isVi ? "Dịch vụ cần giấy phép phải được xác minh trước khi nhận việc" : "Licensed services require verification before accepting jobs."}
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
        <p className="text-sm text-amber-800">
          ⚠️ {isZh ? "电工、水管工和砍树服务依法需要持有有效执照和公共责任险。" : isVi ? "Thợ điện, thợ ống nước và thợ cắt cây cần giấy phép và bảo hiểm theo luật." : "Electrical, plumbing, and tree cutting work legally requires a valid trade license and public liability insurance."}
        </p>
      </div>

      {LICENSED_TRADES.map(trade => {
        const entry = licenses.find(l => l.serviceCode === trade.code);
        if (!entry) return null;
        return (
          <div key={trade.code} className="mb-8 bg-white border rounded-2xl p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isZh ? trade.zh : trade.en}
            </h2>

            {/* License Section */}
            <div className="mb-4">
              <h3 className="text-[15px] font-semibold text-gray-700 mb-2">
                🪪 {isZh ? trade.zhLabel : trade.licenseLabel}
              </h3>
              <input
                type="text"
                placeholder={isZh ? "输入执照编号" : isVi ? "Nhập số giấy phép" : "Enter license number"}
                value={entry.licenseNumber}
                onChange={(e) => update(trade.code, "licenseNumber", e.target.value)}
                className="w-full border rounded-xl p-3 text-lg mb-2"
              />
            </div>

            {/* Insurance Section */}
            <div className="mb-4">
              <h3 className="text-[15px] font-semibold text-gray-700 mb-2">
                🛡️ {isZh ? "公共责任险" : isVi ? "Bảo hiểm trách nhiệm" : "Public Liability Insurance"}
              </h3>
              <input
                type="text"
                placeholder={isZh ? "保险公司名称" : isVi ? "Tên công ty bảo hiểm" : "Insurance provider name"}
                value={entry.insuranceProvider}
                onChange={(e) => update(trade.code, "insuranceProvider", e.target.value)}
                className="w-full border rounded-xl p-3 text-lg mb-2"
              />
              <input
                type="text"
                placeholder={isZh ? "保单编号" : isVi ? "Số hợp đồng" : "Policy number"}
                value={entry.insurancePolicyNumber}
                onChange={(e) => update(trade.code, "insurancePolicyNumber", e.target.value)}
                className="w-full border rounded-xl p-3 text-lg mb-2"
              />
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  {isZh ? "保险到期日" : isVi ? "Ngày hết hạn" : "Insurance expiry date"}
                </label>
                <input
                  type="date"
                  value={entry.insuranceExpiry}
                  onChange={(e) => update(trade.code, "insuranceExpiry", e.target.value)}
                  className="w-full border rounded-xl p-3 text-lg"
                />
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mt-3">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${entry.licenseNumber && entry.insurancePolicyNumber ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {entry.licenseNumber && entry.insurancePolicyNumber
                  ? (isZh ? "✅ 已提交" : "✅ Submitted")
                  : (isZh ? "⏳ 待填写" : "⏳ Incomplete")}
              </span>
            </div>
          </div>
        );
      })}

      <button
        onClick={save}
        className="w-full bg-blue-600 text-white text-xl font-bold rounded-xl py-4 active:scale-[0.97]"
      >
        {saved ? (isZh ? "✅ 已保存" : "✅ Saved!") : (isZh ? "保存执照与保险信息" : isVi ? "Lưu Giấy Phép & Bảo Hiểm" : "Save License & Insurance")}
      </button>

      <p className="text-sm text-gray-400 text-center mt-4">
        {isZh ? "提交后管理员会在24小时内审核。审核通过前无法接受电工/水管工/砍树订单。" : isVi ? "Quản trị viên sẽ xác minh trong 24h. Bạn không thể nhận việc cho đến khi được phê duyệt." : "Admin will verify within 24 hours. You cannot accept electrical/plumbing/tree jobs until approved."}
      </p>
    </main>
  );
}
