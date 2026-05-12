import {
  complianceRules,
  requiredDocTypes,
  allComplianceDocTypes,
  requiresAbn,
} from "@/lib/compliance/country";

describe("compliance country rules", () => {
  it("AU requires an ABN and all three documents", () => {
    expect(requiresAbn("AU")).toBe(true);
    expect(requiredDocTypes("AU")).toEqual([
      "police_check",
      "first_aid",
      "insurance",
    ]);
    expect(complianceRules("AU").optionalDocs).toEqual([]);
  });

  it("US does not require an ABN; insurance is optional", () => {
    expect(requiresAbn("US")).toBe(false);
    expect(requiredDocTypes("US")).toEqual(["police_check", "first_aid"]);
    expect(complianceRules("US").optionalDocs).toEqual(["insurance"]);
    expect(allComplianceDocTypes("US")).toEqual([
      "police_check",
      "first_aid",
      "insurance",
    ]);
  });

  it("CA does not require an ABN but requires all three documents", () => {
    expect(requiresAbn("CA")).toBe(false);
    expect(requiredDocTypes("CA")).toEqual([
      "police_check",
      "first_aid",
      "insurance",
    ]);
  });

  it("unknown / null country falls back to the strictest (AU) rules", () => {
    expect(requiresAbn(null)).toBe(true);
    expect(requiresAbn(undefined)).toBe(true);
    expect(requiresAbn("XX")).toBe(true);
    expect(requiredDocTypes("XX")).toEqual(requiredDocTypes("AU"));
  });
});
