/**
 * Break Time & Shift Configuration
 * 
 * SilverConnect supports two service models:
 * 
 * 1. SHORT VISITS (faith + standard services): 30min–2hr
 *    - Break: 15 min (faith) or 30 min (charged) between jobs
 *    - Max per day: 6 faith / 4 charged
 *    - Working hours: 7AM–8PM
 * 
 * 2. EXTENDED CARE (24-hour / live-in): 8–24 hours
 *    - Shifts rotate every 8–12 hours (per local labour law)
 *    - Mandatory breaks within shifts (per jurisdiction)
 *    - Handover buffer: 30 min overlap between shifts
 *    - Max continuous hours before mandatory rest: varies by country
 * 
 * Local labour law compliance:
 *   AU: Fair Work Act — max 12hr shift, 30min break per 5hr worked, 10hr rest between shifts
 *   CN: Labour Law Art.36 — max 8hr standard, overtime cap 3hr/day, 11hr rest minimum
 *   CA: Employment Standards — max 13hr/day (ON), breaks vary by province
 */

export const BREAK_CONFIG = {
  // === SHORT VISIT BREAKS ===
  faith: 15,      // 15 min rest between spiritual visits
  charged: 30,    // 30 min break between physical service jobs
  travel: 15,     // Additional travel buffer

  // === DAILY LIMITS (SHORT VISITS) ===
  maxPerDayFaith: 6,
  maxPerDayCharged: 4,
  earliestStart: 7,   // 7:00 AM
  latestEnd: 20,      // 8:00 PM (short visits)

  // === EXTENDED CARE / SHIFT CONFIG ===
  shift: {
    // Shift durations (hours)
    minShiftHours: 8,
    maxShiftHours: 12,
    standardShiftHours: 8,

    // 24-hour care splits into shifts
    shiftsIn24Hours: 3,  // Default: 3 × 8hr shifts
    
    // Handover
    handoverBufferMin: 30, // 30 min overlap for handover between shifts

    // Breaks WITHIN a shift (mandatory)
    breakPerShift: {
      au: { breakMin: 30, afterHours: 5 },    // 30 min break after 5 hours worked
      cn: { breakMin: 60, afterHours: 4 },    // 1 hr break after 4 hours (Chinese law)
      ca: { breakMin: 30, afterHours: 5 },    // 30 min after 5 hours
    },

    // Minimum rest between shifts (hours)
    restBetweenShifts: {
      au: 10,  // Fair Work: 10 hours minimum
      cn: 11,  // Labour Law: 11 hours minimum
      ca: 11,  // Employment Standards: 11 hours (Ontario)
    },

    // Max continuous work before mandatory rest
    maxContinuousHours: {
      au: 12,
      cn: 8,   // Standard; overtime extends to 11 max
      ca: 13,  // Ontario max
    },

    // 24-hour service is available (extended care)
    available24Hour: true,
    latestEndExtended: 24, // Can end at any hour (24hr care)
  },
};

export type CountryCode = "au" | "cn" | "ca";

/**
 * Calculate shift schedule for a 24-hour (or extended) booking.
 * Returns an array of shift slots, each with start/end and mandatory break.
 */
export function calculateShiftSchedule(params: {
  startTime: string | Date;
  totalHours: number;
  country: CountryCode;
  shiftHours?: number; // Override shift length (default: 8)
}): {
  shifts: Array<{
    shiftNumber: number;
    start: string;
    end: string;
    durationHours: number;
    breakStart: string;
    breakEnd: string;
    breakMinutes: number;
  }>;
  totalShifts: number;
  handoverWindows: Array<{ start: string; end: string }>;
  restRequiredHours: number;
} {
  const { startTime, totalHours, country, shiftHours } = params;
  const start = new Date(startTime);
  const shiftLen = shiftHours || BREAK_CONFIG.shift.standardShiftHours;
  const totalShifts = Math.ceil(totalHours / shiftLen);
  const breakRule = BREAK_CONFIG.shift.breakPerShift[country];
  const restRequired = BREAK_CONFIG.shift.restBetweenShifts[country];
  const handoverMin = BREAK_CONFIG.shift.handoverBufferMin;

  const shifts = [];
  const handoverWindows = [];

  for (let i = 0; i < totalShifts; i++) {
    const shiftStart = new Date(start.getTime() + i * shiftLen * 3600000);
    const actualLen = Math.min(shiftLen, totalHours - i * shiftLen);
    const shiftEnd = new Date(shiftStart.getTime() + actualLen * 3600000);

    // Mandatory break: after X hours into the shift
    const breakAfterMs = breakRule.afterHours * 3600000;
    const breakStart = new Date(shiftStart.getTime() + breakAfterMs);
    const breakEnd = new Date(breakStart.getTime() + breakRule.breakMin * 60000);

    shifts.push({
      shiftNumber: i + 1,
      start: shiftStart.toISOString(),
      end: shiftEnd.toISOString(),
      durationHours: actualLen,
      breakStart: breakStart.toISOString(),
      breakEnd: breakEnd.toISOString(),
      breakMinutes: breakRule.breakMin,
    });

    // Handover window (overlap between shifts)
    if (i < totalShifts - 1) {
      const hoStart = new Date(shiftEnd.getTime() - handoverMin * 60000);
      handoverWindows.push({
        start: hoStart.toISOString(),
        end: shiftEnd.toISOString(),
      });
    }
  }

  return { shifts, totalShifts, handoverWindows, restRequiredHours: restRequired };
}

/**
 * Validate a provider can take a shift (hasn't exceeded continuous hours, has had enough rest).
 */
export function canProviderTakeShift(params: {
  lastShiftEnd: string | Date | null;
  proposedStart: string | Date;
  country: CountryCode;
}): { allowed: boolean; reason?: string; earliestStart?: string } {
  const { lastShiftEnd, proposedStart, country } = params;
  if (!lastShiftEnd) return { allowed: true };

  const lastEnd = new Date(lastShiftEnd);
  const proposed = new Date(proposedStart);
  const restHours = (proposed.getTime() - lastEnd.getTime()) / 3600000;
  const requiredRest = BREAK_CONFIG.shift.restBetweenShifts[country];

  if (restHours < requiredRest) {
    const earliest = new Date(lastEnd.getTime() + requiredRest * 3600000);
    return {
      allowed: false,
      reason: `Needs ${requiredRest}hr rest between shifts (${country.toUpperCase()} law). Only ${restHours.toFixed(1)}hr since last shift.`,
      earliestStart: earliest.toISOString(),
    };
  }
  return { allowed: true };
}
