/**
 * Human admin support coverage window: Mon–Fri, 9am–6pm Australia/Sydney.
 * Outside this window, and on weekends, AI covers inbound support instead
 * (see lib/ai/service.ts processAIIncomingInquiry). Emergency/dispute
 * intents always escalate to a human immediately, regardless of hours.
 */
const TIMEZONE = "Australia/Sydney";
const START_HOUR = 9;
const END_HOUR = 18;

export function isBusinessHours(date: Date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(date),
  );
  const weekday = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIMEZONE,
    weekday: "short",
  }).format(date);
  const isWeekday = weekday !== "Sat" && weekday !== "Sun";

  return isWeekday && hour >= START_HOUR && hour < END_HOUR;
}
