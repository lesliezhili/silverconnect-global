"use client";

import * as React from "react";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";

/**
 * Document upload that auto-extracts claim details from PDF/image.
 * When user uploads an approval letter, sends to /api/parse-document
 * and auto-fills claim number, date, scope, amount fields.
 */
export function DocumentUploadWithParse({
  onExtracted,
  locale = "en",
}: {
  onExtracted: (data: {
    claimNumber?: string;
    approvalDate?: string;
    serviceScope?: string;
    fundingAmount?: number;
    scheme?: string;
    serviceDuration?: string;
    hourlyRate?: number;
  }) => void;
  locale?: string;
}) {
  const zh = locale === "zh";
  const [file, setFile] = React.useState<File | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [extracted, setExtracted] = React.useState<any>(null);
  const [error, setError] = React.useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    setFile(f);
    setError("");
    setParsing(true);
    setExtracted(null);

    try {
      const formData = new FormData();
      formData.append("file", f);

      const res = await fetch("/api/parse-document", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setExtracted(data);
        
        // Auto-fill parent form
        const fill: any = {};
        if (data.claimNumber) fill.claimNumber = data.claimNumber;
        if (data.approvalDate) fill.approvalDate = data.approvalDate;
        if (data.serviceScope) fill.serviceScope = data.serviceScope;
        if (data.fundingAmount) fill.fundingAmount = data.fundingAmount;
        if (data.scheme) fill.scheme = data.scheme;
        if (data.serviceDuration) fill.serviceDuration = data.serviceDuration;
        if (data.hourlyRate) fill.hourlyRate = data.hourlyRate;
        
        if (Object.keys(fill).length > 0) {
          onExtracted(fill);
        }
      } else {
        setError(zh ? "无法解析文件" : "Could not parse document");
      }
    } catch {
      setError(zh ? "上传失败" : "Upload failed");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div>
      <label className="block text-[18px] font-semibold text-gray-700 mb-2">
        {zh ? "上传批准信 (PDF/图片)" : "Upload Approval Letter (PDF/Image)"} *
      </label>
      
      <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ position: "relative" }}
        />
        <Upload size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-[18px] text-gray-600">
          {zh ? "点击或拖放文件" : "Tap to select file"}
        </p>
        <p className="mt-1 text-[16px] text-gray-400">
          PDF, JPG, PNG — max 10MB
        </p>
      </div>

      {/* File selected */}
      {file && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <FileText size={20} className="text-blue-600 shrink-0" />
          <span className="text-[17px] text-blue-800 font-medium truncate">{file.name}</span>
          <span className="text-[15px] text-blue-600 ml-auto shrink-0">
            {(file.size / 1024).toFixed(0)} KB
          </span>
        </div>
      )}

      {/* Parsing indicator */}
      {parsing && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <Loader2 size={20} className="animate-spin text-amber-600" />
          <span className="text-[17px] text-amber-800">
            {zh ? "正在提取索赔信息..." : "Extracting claim details..."}
          </span>
        </div>
      )}

      {/* Extracted data summary */}
      {extracted && !parsing && extracted.claimNumber && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-green-600" />
            <span className="text-[17px] font-bold text-green-800">
              {zh ? "自动提取结果" : "Auto-extracted from document"}
            </span>
          </div>
          <ul className="space-y-1 text-[17px] text-green-700">
            {extracted.claimNumber && <li>• Claim: <strong>{extracted.claimNumber}</strong></li>}
            {extracted.approvalDate && <li>• Date: {extracted.approvalDate}</li>}
            {extracted.serviceScope && <li>• Scope: {extracted.serviceScope}</li>}
            {extracted.fundingAmount && <li>• Amount: ${extracted.fundingAmount}</li>}
            {extracted.hourlyRate && <li>• Rate: ${extracted.hourlyRate}/hr</li>}
            {extracted.serviceDuration && <li>• Duration: {extracted.serviceDuration}</li>}
          </ul>
          <p className="mt-2 text-[15px] text-green-600 italic">
            {zh ? "请确认以上信息正确" : "Please verify — you can edit any field below"}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-[17px] text-red-600">{error}</p>
      )}
    </div>
  );
}
