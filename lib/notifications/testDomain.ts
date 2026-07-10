/**
 * Recipient domains used by e2e tests that never accept real mail.
 * Sending to them over real SMTP either bounces immediately (example.com/
 * .org/.net publish an RFC 7505 null MX — "Address not found") or queues a
 * silent "temporary problem" retry for ~24h against invented subdomains
 * like `test.silverconnect.app` that have no DNS at all. Either way it
 * spams whoever owns the sending mailbox. Any email-sending path should
 * check this before dispatching over real SMTP/API and just log instead.
 */
const RESERVED_NO_MAIL_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "example.edu",
]);

export function isUnroutableTestDomain(to: string): boolean {
  const domain = to.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return (
    domain.startsWith("test.") ||
    domain.endsWith(".test") ||
    RESERVED_NO_MAIL_DOMAINS.has(domain)
  );
}
