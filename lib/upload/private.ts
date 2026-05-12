import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { join, extname, normalize, sep } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Private file store for compliance documents (police checks, insurance,
 * ID). Unlike `lib/upload/local.ts`, files land OUTSIDE `public/` so Next
 * never serves them statically — every download goes through an
 * authenticated route (`app/api/compliance/documents/[id]/route.ts`).
 *
 * TODO before production: swap this for managed object storage (S3 / R2 /
 * Supabase private bucket). Keep the `savePrivateUpload` / `readPrivateUpload`
 * signatures so call sites don't change.
 */
const ROOT = join(process.cwd(), ".private-uploads");

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "application/pdf": ".pdf",
};

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
};

export type PrivateUploadResult = { key: string } | { error: string };

/**
 * Persist `file` under `.private-uploads/{prefix}/{uuid}{ext}` and return
 * the storage key (`{prefix}/{uuid}{ext}`) for DB storage. The key is what
 * later gets passed to `readPrivateUpload`.
 */
export async function savePrivateUpload(
  file: File,
  prefix: string,
): Promise<PrivateUploadResult> {
  if (!(file instanceof File) || file.size === 0) return { error: "empty" };
  if (file.size > MAX_BYTES) return { error: "tooLarge" };
  if (!ALLOWED_MIME.has(file.type)) return { error: "badType" };

  const ext = EXT_BY_MIME[file.type] ?? extname(file.name) ?? ".bin";
  const safePrefix = sanitizeRelPath(prefix);
  const key = `${safePrefix}/${randomUUID()}${ext}`;
  const abs = join(ROOT, key);
  await mkdir(join(ROOT, safePrefix), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));
  return { key };
}

export type PrivateFile = {
  bytes: Buffer;
  contentType: string;
};

/** Read a stored file by its key. Returns null if the key is invalid or the file is missing. */
export async function readPrivateUpload(key: string): Promise<PrivateFile | null> {
  let rel: string;
  try {
    rel = sanitizeRelPath(key);
  } catch {
    return null;
  }
  const abs = join(ROOT, rel);
  try {
    const s = await stat(abs);
    if (!s.isFile()) return null;
  } catch {
    return null;
  }
  const bytes = await readFile(abs);
  const ext = extname(rel).toLowerCase();
  return { bytes, contentType: CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream" };
}

/** Reject `..`, absolute paths, and anything that would escape ROOT. */
function sanitizeRelPath(p: string): string {
  const n = normalize(p).replace(/^([/\\])+/, "");
  if (!n || n === "." || n.startsWith("..") || n.includes(`..${sep}`)) {
    throw new Error("invalid path");
  }
  return n.split(/[/\\]+/).join("/");
}
