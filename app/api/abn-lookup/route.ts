import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/abn-lookup?abn=12345678901
 * Queries the Australian Business Register (ABR) public API
 * Returns: { abn, entityName, entityType, status, state, postcode }
 *
 * ABR API docs: https://abr.business.gov.au/Documentation/WebServiceResponse
 * Free public access — no API key required for basic lookup.
 * We use the ABN Lookup XML API with JSON callback trick.
 */
export async function GET(req: NextRequest) {
  const abn = req.nextUrl.searchParams.get("abn")?.replace(/\s/g, "");

  if (!abn || !/^\d{11}$/.test(abn)) {
    return NextResponse.json(
      { error: "Invalid ABN. Must be exactly 11 digits." },
      { status: 400 }
    );
  }

  try {
    // ABR provides a free JSON endpoint via callback parameter
    // Official: https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001
    // Simpler: use the web lookup JSON endpoint
    const url = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${abn}&callback=_`;
    
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 86400 }, // Cache for 24h
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "ABR service unavailable" },
        { status: 502 }
      );
    }

    const text = await res.text();
    // Response is JSONP: _({...})
    const jsonStr = text.replace(/^_\(/, "").replace(/\)$/, "");
    const data = JSON.parse(jsonStr);

    if (data.Message) {
      return NextResponse.json(
        { error: data.Message },
        { status: 404 }
      );
    }

    // Extract entity name (individual vs organisation)
    const entityName = data.EntityName || 
      [data.GivenName, data.OtherGivenName, data.FamilyName]
        .filter(Boolean)
        .join(" ") || 
      "Unknown";

    return NextResponse.json({
      abn: data.Abn,
      entityName,
      entityType: data.EntityTypeName || data.EntityTypeCode,
      status: data.AbnStatus,
      state: data.AddressState,
      postcode: data.AddressPostcode,
      isCurrent: data.AbnStatus === "Active",
    });
  } catch (error: any) {
    console.error("ABN lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up ABN" },
      { status: 500 }
    );
  }
}
