"use client";

import { useState, useEffect, Suspense, useRef } from "react";

const DOC_TYPES = [
  { type: "wwc", label: "Working with Vulnerable People", label_zh: "弱势群体工作许可证", required: true, icon: "\ud83d\udee1\ufe0f" },
  { type: "police_check", label: "National Police Check", label_zh: "全国犯罪记录检查", required: true, icon: "\ud83d\udc6e" },
  { type: "first_aid", label: "First Aid Certificate", label_zh: "急救证书", required: false, icon: "\u2695\ufe0f" },
];

interface DocRecord { id: string; type: string; status: string; uploaded_at: string; expiry_date?: string; document_number?: string; rejection_reason?: string; }

function DocumentsContent() {
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/provider/wwvp-upload")
      .then(r => r.json())
      .then(data => { if (data.success) setDocuments(data.documents || []); })
      .catch(() => {});
  }, [uploadSuccess]);

  const getStatus = (type: string) => {
    const doc = documents.find(d => d.type === type);
    if (!doc) return null;
    return doc;
  };

  const handleUpload = async (docType: string) => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select a file"); return; }

    setUploading(docType); setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", docType);
    if (cardNumber) formData.append("cardNumber", cardNumber);
    if (expiryDate) formData.append("expiryDate", expiryDate);

    try {
      const res = await fetch("/api/provider/wwvp-upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess(docType);
        setActiveUpload(null);
        setCardNumber(""); setExpiryDate("");
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setError(data.error);
      }
    } catch { setError("Upload failed. Please try again."); }
    setUploading(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-base font-medium">Under Review</span>;
      case "approved": return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-base font-medium">\u2713 Verified</span>;
      case "rejected": return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-base font-medium">Rejected</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-base">{status}</span>;
    }
  };

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        <p className="text-lg text-gray-500 mt-1">Upload required checks to start serving</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"><p className="text-red-700 text-lg">{error}</p></div>}
      {uploadSuccess && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4"><p className="text-green-700 text-lg">\u2713 Document uploaded! Verification takes 1-2 days.</p></div>}

      <div className="space-y-4">
        {DOC_TYPES.map(dt => {
          const existing = getStatus(dt.type);
          return (
            <div key={dt.type} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{dt.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-800">{dt.label}</h3>
                </div>
                {dt.required && <span className="text-sm text-red-500 font-medium">Required</span>}
              </div>

              {existing ? (
                <div className="mt-3 space-y-2">
                  {statusBadge(existing.status)}
                  {existing.document_number && <p className="text-base text-gray-600">Card #: {existing.document_number}</p>}
                  {existing.expiry_date && <p className="text-base text-gray-600">Expires: {existing.expiry_date}</p>}
                  {existing.rejection_reason && <p className="text-base text-red-600">Reason: {existing.rejection_reason}</p>}
                  {existing.status === "rejected" && (
                    <button onClick={() => setActiveUpload(dt.type)}
                      className="mt-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-base font-medium">
                      Re-upload
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {activeUpload === dt.type ? (
                    <div className="mt-3 space-y-3">
                      <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png"
                        className="w-full p-3 border border-gray-300 rounded-xl text-base" />
                      <input value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                        placeholder="Card/Certificate Number"
                        className="w-full p-3 border border-gray-300 rounded-xl text-lg" />
                      <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl text-lg" />
                      <div className="flex gap-2">
                        <button onClick={() => setActiveUpload(null)}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-lg font-medium">Cancel</button>
                        <button onClick={() => handleUpload(dt.type)} disabled={uploading === dt.type}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl text-lg font-bold">
                          {uploading === dt.type ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setActiveUpload(dt.type)}
                      className="mt-3 w-full py-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-700 text-lg font-medium min-h-[56px]">
                      + Upload Document
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="text-lg font-bold text-blue-800 mb-2">\ud83d\udca1 How to get your WWVP check</h3>
        <ul className="space-y-1 text-base text-gray-700">
          <li>\u2022 VIC: Apply at <strong>Service Victoria</strong></li>
          <li>\u2022 NSW: Apply at <strong>Service NSW</strong> (WWCC)</li>
          <li>\u2022 QLD: Apply for <strong>Blue Card</strong></li>
          <li>\u2022 WA: Apply for <strong>Working with Children Check</strong></li>
          <li>\u2022 Processing takes 5-10 business days</li>
        </ul>
      </div>
    </main>
  );
}

export default function DocumentsPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><DocumentsContent /></Suspense>;
}
