/**
 * Unified Storage Gateway
 *
 * Single interface that routes file uploads to either Supabase Storage
 * or Alibaba Cloud OSS based on the STORAGE_PROVIDER environment
 * variable. See provider-config.ts.
 *
 * Usage:
 *   import { uploadFile, createSignedUploadUrl } from "@/lib/storage/gateway";
 *   const result = await uploadFile({ bucket: "evidence", path, buffer, contentType });
 */

import { getStorageProvider, UploadResult, SignedUploadResult } from "./provider-config";

/** The two buckets this app currently uses. */
export type StorageBucket = "evidence" | "documents";

interface UploadInput {
  bucket: StorageBucket;
  path: string;
  buffer: Buffer;
  contentType: string;
}

interface SignedUploadInput {
  bucket: StorageBucket;
  path: string;
}

// ════════════════════════════════════════════════════════════
// UPLOAD (buffer already in memory — used by multipart form uploads)
// ════════════════════════════════════════════════════════════

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  const provider = getStorageProvider();
  if (provider === "oss") return uploadFileOSS(input);
  return uploadFileSupabase(input);
}

async function uploadFileSupabase({ bucket, path, buffer, contentType }: UploadInput): Promise<UploadResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      success: true,
      provider: "supabase",
      simulated: true,
      url: `https://storage.silverconnect.app/${bucket}/${path}`,
      path,
    };
  }
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key);
  const { data, error } = await sb.storage.from(bucket).upload(path, buffer, { contentType });
  if (error) return { success: false, provider: "supabase", error: error.message };
  const { data: u } = sb.storage.from(bucket).getPublicUrl(data.path);
  return { success: true, provider: "supabase", url: u.publicUrl, path: data.path };
}

/** OSS bucket names are globally unique, so each Supabase "bucket" maps to its own env var rather than reusing "evidence"/"documents" directly. */
function ossBucketFor(bucket: StorageBucket): string | undefined {
  return bucket === "evidence"
    ? process.env.ALIYUN_OSS_BUCKET_EVIDENCE
    : process.env.ALIYUN_OSS_BUCKET_DOCUMENTS;
}

function ossCredentials() {
  return {
    region: process.env.ALIYUN_OSS_REGION,
    accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
  };
}

async function uploadFileOSS({ bucket, path, buffer, contentType }: UploadInput): Promise<UploadResult> {
  const { region, accessKeyId, accessKeySecret } = ossCredentials();
  const ossBucket = ossBucketFor(bucket);
  if (!region || !accessKeyId || !accessKeySecret || !ossBucket) {
    return {
      success: true,
      provider: "oss",
      simulated: true,
      url: `https://storage.silverconnect.cn/${bucket}/${path}`,
      path,
    };
  }
  const OSS = (await import("ali-oss")).default;
  const client = new OSS({ region, accessKeyId, accessKeySecret, bucket: ossBucket });
  const result = await client.put(path, buffer, { mime: contentType });
  const cdnDomain = process.env.ALIYUN_OSS_CDN_DOMAIN;
  const publicUrl = cdnDomain ? `https://${cdnDomain}/${path}` : result.url;
  return { success: true, provider: "oss", url: publicUrl, path };
}

// ════════════════════════════════════════════════════════════
// SIGNED UPLOAD URL (client uploads directly, used by the JSON-body path)
// ════════════════════════════════════════════════════════════

export async function createSignedUploadUrl(input: SignedUploadInput): Promise<SignedUploadResult> {
  const provider = getStorageProvider();
  if (provider === "oss") return createSignedUploadUrlOSS(input);
  return createSignedUploadUrlSupabase(input);
}

async function createSignedUploadUrlSupabase({ bucket, path }: SignedUploadInput): Promise<SignedUploadResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { success: false, provider: "supabase", error: "Supabase not configured" };
  }
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key);
  const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path);
  if (error) return { success: false, provider: "supabase", error: error.message };
  return { success: true, provider: "supabase", signedUrl: data.signedUrl, path };
}

async function createSignedUploadUrlOSS({ bucket, path }: SignedUploadInput): Promise<SignedUploadResult> {
  const { region, accessKeyId, accessKeySecret } = ossCredentials();
  const ossBucket = ossBucketFor(bucket);
  if (!region || !accessKeyId || !accessKeySecret || !ossBucket) {
    return { success: false, provider: "oss", error: "Aliyun OSS not configured" };
  }
  const OSS = (await import("ali-oss")).default;
  const client = new OSS({ region, accessKeyId, accessKeySecret, bucket: ossBucket });
  const signedUrl = client.signatureUrl(path, { method: "PUT", expires: 900 });
  return { success: true, provider: "oss", signedUrl, path };
}
