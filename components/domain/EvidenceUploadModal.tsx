"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { Modal, ModalContent, ModalTrigger, ModalClose } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type Strings = {
  triggerLabel: string;
  title: string;
  hint: string;
  photoLabel: string;
  cancel: string;
  submit: string;
  uploading: string;
  uploadFailed: string;
  /** Heading above the checklist (complete only). */
  checklistTitle?: string;
};

type Item = { key: string; label: string };

/**
 * Requires a before/after photo or short video before a job can move to "in progress" or
 * "completed" — uploads via /api/upload/evidence (which persists a
 * booking_evidence row), then invokes the same jobAction server action
 * DeclineJobModal uses, but programmatically once the upload succeeds
 * rather than via a plain form submit (a File can't travel through a
 * server-action FormData the same way a text field can alongside it).
 */
// Videos and large photos go straight to storage via a signed URL —
// they exceed the serverless request-body limit (~4.5MB).
const DIRECT_UPLOAD = (f: File) => f.type.startsWith("video/") || f.size > 4 * 1024 * 1024;

/** Returns true on success, otherwise an error message (or "" for generic). */
async function uploadViaRoute(file: File, bookingId: string, phase: string, area: string): Promise<true | string> {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("bookingId", bookingId);
  fd.set("type", phase);
  fd.set("area", area);
  const res = await fetch("/api/upload/evidence", { method: "POST", body: fd });
  const data = await res.json();
  return res.ok && data.success ? true : data.error || "";
}

async function uploadDirect(file: File, bookingId: string, phase: string, area: string): Promise<true | string> {
  const post = (body: object) =>
    fetch("/api/upload/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => ({ ok: r.ok, data: await r.json() }));

  const sign = await post({ bookingId, type: phase, contentType: file.type, size: file.size });
  if (!sign.ok || !sign.data.success) return sign.data.error || "";
  const put = await fetch(sign.data.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) return "";
  const rec = await post({ action: "record", bookingId, type: phase, path: sign.data.path, area });
  return rec.ok && rec.data.success ? true : rec.data.error || "";
}

export function EvidenceUploadModal({
  action,
  actionValue,
  phase,
  locale,
  jobId,
  strings,
  areas,
  checklist = [],
}: {
  action: (formData: FormData) => void | Promise<void>;
  actionValue: "start" | "complete";
  phase: "before" | "after";
  locale: string;
  jobId: string;
  strings: Strings;
  /** QC areas that each need a photo/video (lib/release-quality.ts). */
  areas: Item[];
  /** Items the provider must tick before completing. */
  checklist?: Item[];
}) {
  const [files, setFiles] = React.useState<Record<string, File | null>>({});
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});
  const [state, setState] = React.useState<"idle" | "uploading">("idle");
  const [error, setError] = React.useState("");

  const ready =
    areas.every((a) => files[a.key]) && checklist.every((c) => checks[c.key]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setState("uploading");
    setError("");
    try {
      for (const a of areas) {
        const file = files[a.key]!;
        const ok = DIRECT_UPLOAD(file)
          ? await uploadDirect(file, jobId, phase, a.key)
          : await uploadViaRoute(file, jobId, phase, a.key);
        if (ok !== true) {
          setError(`${a.label}: ${ok || strings.uploadFailed}`);
          setState("idle");
          return;
        }
      }
      const jobFd = new FormData();
      jobFd.set("locale", locale);
      jobFd.set("id", jobId);
      jobFd.set("action", actionValue);
      for (const c of checklist) if (checks[c.key]) jobFd.set(`qc_${c.key}`, "on");
      await action(jobFd);
    } catch {
      setError(strings.uploadFailed);
      setState("idle");
    }
  }

  return (
    <Modal>
      <ModalTrigger asChild>
        <button
          type="button"
          className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white"
        >
          {strings.triggerLabel}
        </button>
      </ModalTrigger>
      <ModalContent title={strings.title}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-[16px] text-text-secondary">{strings.hint}</p>
          {areas.map((a) => {
            const f = files[a.key];
            return (
              <label
                key={a.key}
                className={
                  "flex min-h-20 cursor-pointer items-center gap-3 rounded-md border-2 border-dashed px-4 py-3 " +
                  (f ? "border-success bg-success-soft text-text-primary" : "border-border-strong bg-bg-surface-2 text-text-tertiary")
                }
              >
                <Camera size={24} aria-hidden />
                <span className="flex-1 text-[16px] font-semibold">
                  {a.label}
                  <span className="block text-[14px] font-normal">{f ? `✓ ${f.name}` : strings.photoLabel}</span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setFiles((prev) => ({ ...prev, [a.key]: file }));
                  }}
                />
              </label>
            );
          })}
          {checklist.length > 0 && (
            <fieldset className="rounded-md border border-border p-3">
              <legend className="px-1 text-[16px] font-bold">{strings.checklistTitle}</legend>
              {checklist.map((c) => (
                <label key={c.key} className="flex min-h-11 items-center gap-3 text-[16px]">
                  <input
                    type="checkbox"
                    checked={!!checks[c.key]}
                    onChange={(e) => setChecks((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                    className="h-5 w-5"
                  />
                  {c.label}
                </label>
              ))}
            </fieldset>
          )}
          {error && <p className="text-[15px] text-danger">{error}</p>}
          <div className="mt-2 flex gap-3">
            <ModalClose
              type="button"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-bg-base text-[17px] font-semibold text-text-primary"
            >
              {strings.cancel}
            </ModalClose>
            <Button type="submit" variant="primary" size="md" disabled={!ready || state === "uploading"}>
              {state === "uploading" ? strings.uploading : strings.submit}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
