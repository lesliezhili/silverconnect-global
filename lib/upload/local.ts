import { mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";

const ROOT = join(process.cwd(), "public", "uploads");

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

export type UploadResult = { url: string } | { error: string };

/**
 * Persist an uploaded file under public/uploads/{prefix}/.
 *
 * Returns a public URL (/uploads/...) for storage in DB. The obscure
 * UUID filename is the only access control — fine for compliance / dispute
 * uploads where the link only goes to admins. When migrating to S3 /
 * Supabase Storage swap this implementation, the call sites stay.
 */
export async function saveUpload(
  file: File,
  prefix: string,
): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { error: "empty" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "tooLarge" };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { error: "badType" };
  }
  const ext = EXT_BY_MIME[file.type] ?? extname(file.name) ?? ".bin";
  const id = randomUUID();
  const dir = join(ROOT, prefix);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${id}${ext}`);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path, buf);
  return { url: `/uploads/${prefix}/${id}${ext}` };
}
