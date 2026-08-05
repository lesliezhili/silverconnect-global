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
};

/**
 * Requires a before/after photo before a job can move to "in progress" or
 * "completed" — uploads via /api/upload/evidence (which persists a
 * booking_evidence row), then invokes the same jobAction server action
 * DeclineJobModal uses, but programmatically once the upload succeeds
 * rather than via a plain form submit (a File can't travel through a
 * server-action FormData the same way a text field can alongside it).
 */
export function EvidenceUploadModal({
  action,
  actionValue,
  phase,
  locale,
  jobId,
  strings,
}: {
  action: (formData: FormData) => void | Promise<void>;
  actionValue: "start" | "complete";
  phase: "before" | "after";
  locale: string;
  jobId: string;
  strings: Strings;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [state, setState] = React.useState<"idle" | "uploading">("idle");
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setState("uploading");
    setError("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("bookingId", jobId);
      fd.set("type", phase);
      const res = await fetch("/api/upload/evidence", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || strings.uploadFailed);
        setState("idle");
        return;
      }
      const jobFd = new FormData();
      jobFd.set("locale", locale);
      jobFd.set("id", jobId);
      jobFd.set("action", actionValue);
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
          <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-bg-surface-2 text-text-tertiary">
            <Camera size={28} aria-hidden />
            <span className="px-4 text-center text-[15px] font-semibold">
              {file ? file.name : strings.photoLabel}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {error && <p className="text-[15px] text-danger">{error}</p>}
          <div className="mt-2 flex gap-3">
            <ModalClose
              type="button"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-bg-base text-[17px] font-semibold text-text-primary"
            >
              {strings.cancel}
            </ModalClose>
            <Button type="submit" variant="primary" size="md" disabled={!file || state === "uploading"}>
              {state === "uploading" ? strings.uploading : strings.submit}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
