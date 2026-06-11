"use client";

import * as React from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/**
 * ABN input with auto-lookup from Australian Business Register.
 * When user enters 11 digits, fetches business name from ABR API.
 * Shows green tick + business name if valid, red alert if invalid.
 */
export function AbnLookupInput({
  name = "abn",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [abn, setAbn] = React.useState(defaultValue);
  const [entityName, setEntityName] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "found" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const lookup = React.useCallback(async (value: string) => {
    const digits = value.replace(/\s/g, "");
    if (digits.length !== 11) {
      setStatus("idle");
      setEntityName("");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`/api/abn-lookup?abn=${digits}`);
      const data = await res.json();

      if (res.ok && data.entityName) {
        setEntityName(data.entityName);
        setStatus(data.isCurrent ? "found" : "error");
        if (!data.isCurrent) {
          setErrorMsg("ABN is not active");
        }
      } else {
        setStatus("error");
        setErrorMsg(data.error || "ABN not found");
        setEntityName("");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Lookup failed — check connection");
      setEntityName("");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAbn(val);
    
    // Debounce lookup
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => lookup(val), 600);
  };

  return (
    <div>
      <label htmlFor={name} className="block text-[18px] font-semibold text-gray-700 mb-1">
        ABN (Australian Business Number)
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type="text"
          value={abn}
          onChange={handleChange}
          placeholder="e.g. 51 824 753 556"
          maxLength={14}
          pattern="[0-9 ]{11,14}"
          aria-describedby="abn-hint"
          className="w-full rounded-xl border-2 border-gray-300 p-4 pr-12 text-[20px] text-gray-900 placeholder:text-gray-400"
        />
        {/* Status indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {status === "loading" && <Loader2 size={24} className="animate-spin text-gray-400" />}
          {status === "found" && <CheckCircle size={24} className="text-green-500" />}
          {status === "error" && <AlertCircle size={24} className="text-red-500" />}
        </div>
      </div>

      {/* Business name result */}
      {status === "found" && entityName && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <p className="text-[18px] font-semibold text-green-800">{entityName}</p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <p className="text-[18px] text-red-700">{errorMsg}</p>
        </div>
      )}

      <p id="abn-hint" className="mt-1.5 text-[17px] text-gray-500">
        Optional — we’ll auto-verify your business name from ABR
      </p>

      {/* Hidden field for business name (submitted with form) */}
      {entityName && <input type="hidden" name="abnEntityName" value={entityName} />}
    </div>
  );
}
