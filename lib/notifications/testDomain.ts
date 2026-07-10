/**
 * Recipient domains used by e2e tests that don't have real mail servers
 * (e.g. `test.silverconnect.app`, `test.sc.app`). Sending to them over
 * real SMTP produces no immediate rejection — Gmail queues a "temporary
 * problem" bounce and retries for ~24h before giving up, spamming
 * whoever owns the sending mailbox. Any email-sending path should check
 * this before dispatching over real SMTP/API and just log instead.
 */
export function isUnroutableTestDomain(to: string): boolean {
  const domain = to.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return domain.startsWith("test.") || domain.endsWith(".test");
}
