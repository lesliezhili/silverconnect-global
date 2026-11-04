import { describe, expect, it } from "vitest";
import { findLiveArea, isFutureRoute, isReleaseCategory } from "../release";
import { priceFor, recommendQuote, tierHours } from "../release-pricing";
import { missingAreas, qcFlagFor } from "../release-quality";

describe("live areas", () => {
  it("serves Melbourne Chinese hubs", () => {
    for (const pc of ["3128", "3108", "3150", "3168", "3000", "3142", "3101"]) {
      expect(findLiveArea("AU", pc)?.city, pc).toBe("Melbourne");
    }
  });
  it("waitlists other AU postcodes", () => {
    expect(findLiveArea("AU", "2067")).toBeNull(); // Chatswood NSW
    expect(findLiveArea("AU", "3220")).toBeNull(); // Geelong
  });
  it("serves Vancouver FSAs, any spacing/case", () => {
    expect(findLiveArea("CA", "V6X 1A1")?.city).toBe("Vancouver");
    expect(findLiveArea("CA", "v5h2b3")?.city).toBe("Vancouver");
    expect(findLiveArea("CA", "M2N 6K1")).toBeNull(); // Toronto
  });
  it("never matches across countries", () => {
    expect(findLiveArea("CA", "3128")).toBeNull();
    expect(findLiveArea("AU", "V6X 1A1")).toBeNull();
  });
  it("uses BC GST, not Ontario HST", () => {
    expect(findLiveArea("CA", "V6X1A1")?.tax.rate).toBe(0.05);
    expect(findLiveArea("AU", "3128")?.tax.rate).toBe(0.1);
  });
});

describe("scope", () => {
  it("only cleaning, garden, handyman", () => {
    expect(["cleaning", "garden", "repair"].every(isReleaseCategory)).toBe(true);
    expect(isReleaseCategory("personalCare")).toBe(false);
  });
  it("gates future routes but not Release 1 ones", () => {
    expect(isFutureRoute("/book-service")).toBe(true);
    expect(isFutureRoute("/book")).toBe(true);
    expect(isFutureRoute("/xinyuzhe/hub")).toBe(true);
    expect(isFutureRoute("/bookings")).toBe(false);
    expect(isFutureRoute("/bookings/new")).toBe(false);
    expect(isFutureRoute("/services/cleaning")).toBe(false);
    expect(isFutureRoute("/provider/jobs/1")).toBe(false);
  });
});

describe("price model", () => {
  it("regular is a fixed 2h package", () => {
    const p = priceFor({ country: "AU", category: "cleaning", tier: "regular", hours: 6, taxRate: 0.1 });
    expect(p).toMatchObject({ hours: 2, hourly: 55, base: 110, tax: 11, total: 121 });
  });
  it("medium/high scale the rate and respect minimum hours", () => {
    expect(priceFor({ country: "AU", category: "garden", tier: "medium", taxRate: 0.1 })).toMatchObject({ hours: 3, hourly: 72, base: 216 });
    expect(priceFor({ country: "CA", category: "repair", tier: "high", hours: 5, taxRate: 0.05 })).toMatchObject({ hours: 5, hourly: 98, base: 490, tax: 24.5 });
  });
  it("rounds hours up to the half hour and caps at 8", () => {
    expect(tierHours("medium", 3.2)).toBe(3.5);
    expect(tierHours("high", 12)).toBe(8);
    expect(tierHours("high", 1)).toBe(4);
  });
  it("quote follows real time, upgrades an overrunning regular job", () => {
    expect(recommendQuote({ tier: "medium", bookedMin: 180, actualMin: 230 })).toMatchObject({ tier: "medium", hours: 4, varianceMin: 50 });
    expect(recommendQuote({ tier: "regular", bookedMin: 120, actualMin: 170 }).tier).toBe("medium");
    expect(recommendQuote({ tier: "regular", bookedMin: 120, actualMin: 130 }).tier).toBe("regular");
  });
});

describe("quality control", () => {
  it("needs evidence for every required area", () => {
    const ev = [
      { phase: "before", description: "kitchen" },
      { phase: "before", description: "bathroom" },
      { phase: "after", description: "kitchen" },
    ];
    expect(missingAreas("cleaning", ev, "before").map((a) => a.key)).toEqual(["living"]);
    expect(missingAreas("cleaning", ev, "after").map((a) => a.key)).toEqual(["bathroom", "living"]);
    expect(missingAreas("repair", [{ phase: "after", description: "job" }], "after")).toEqual([]);
  });
  it("flags visits under 60% of booked time", () => {
    const start = new Date("2026-11-04T10:00:00Z");
    expect(qcFlagFor(120, start, new Date("2026-11-04T11:00:00Z"))).toBe("short_visit");
    expect(qcFlagFor(120, start, new Date("2026-11-04T11:20:00Z"))).toBeNull();
    expect(qcFlagFor(120, null, new Date())).toBe("no_start_time");
  });
});
