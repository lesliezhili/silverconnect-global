/**
 * Storage Provider Switch
 *
 * Controls whether file uploads (dispute evidence photos, provider
 * compliance documents) go to:
 *   - "supabase" = Supabase Storage — current AU deployment
 *   - "oss"      = Alibaba Cloud OSS — mainland China deployment
 *     (see docs/CHINA_DEPLOYMENT.md; Supabase is unreachable from
 *     mainland China behind the GFW)
 *
 * Set via environment variable STORAGE_PROVIDER.
 * Default: "supabase" (backwards compatible).
 */

export type StorageProvider = "supabase" | "oss";

export function getStorageProvider(): StorageProvider {
  const env = process.env.STORAGE_PROVIDER?.toLowerCase();
  if (env === "oss" || env === "aliyun") return "oss";
  return "supabase";
}

export interface UploadResult {
  success: boolean;
  provider: StorageProvider;
  url?: string;
  path?: string;
  /** True when no provider credentials are configured — a fake URL was returned so local/dev flows don't hard-fail. */
  simulated?: boolean;
  error?: string;
}

export interface SignedUploadResult {
  success: boolean;
  provider: StorageProvider;
  signedUrl?: string;
  path?: string;
  error?: string;
}
