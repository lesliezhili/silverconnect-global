export const SESSION_COOKIE_NAME = "sc-session";

export function isSessionSecretConfigured(
  secret = process.env.SESSION_SECRET,
): boolean {
  return !!secret && secret.length >= 32;
}
