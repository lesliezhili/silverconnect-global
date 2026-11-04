"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { compressPhoto } from "@/lib/client/compressPhoto";

/**
 * Customer feedback photos (up to 3), compressed on the device and stored
 * as booking evidence (phase "feedback"). Required when the rating is
 * 2★ or lower — the server action enforces that.
 */
export function FeedbackPhotos({ bookingId, zh, initialCount }: { bookingId: string; zh: boolean; initialCount: number }) {
  const [count, setCount] = React.useState(initialCount);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const full = count >= 3;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, 3 - count);
    e.target.value = "";
    if (picked.length === 0) return;
    setBusy(true);
    setError("");
    for (const f of picked) {
      const photo = await compressPhoto(f);
      const fd = new FormData();
      fd.set("file", photo);
      fd.set("bookingId", bookingId);
      fd.set("type", "feedback");
      const res = await fetch("/api/upload/evidence", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || (zh ? "上传失败，请重试" : "Upload failed — please try again"));
        break;
      }
      setCount((c) => c + 1);
    }
    setBusy(false);
  }

  return (
    <div>
      <p className="text-[16px] font-bold text-text-primary">
        {zh ? "照片（可选；评分 2 星或以下时必填）" : "Photos (optional; required for 2★ or lower)"}
      </p>
      <label
        className={
          "mt-2 flex min-h-16 items-center gap-3 rounded-md border-2 border-dashed px-4 py-3 text-[16px] " +
          (full ? "border-success bg-success-soft" : "cursor-pointer border-border-strong bg-bg-surface-2")
        }
      >
        <Camera size={24} aria-hidden />
        <span className="flex-1">
          {busy
            ? zh ? "上传中…" : "Uploading…"
            : count > 0
              ? zh ? `已上传 ${count}/3 张` : `${count}/3 uploaded`
              : zh ? "点击拍照或选择照片" : "Tap to take or choose photos"}
        </span>
        <input type="file" accept="image/*" multiple disabled={busy || full} onChange={onPick} className="sr-only" />
      </label>
      {error && <p className="mt-1.5 text-[15px] text-danger">{error}</p>}
    </div>
  );
}
