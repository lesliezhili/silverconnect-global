import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";

/**
 * POST /api/parse-document
 * Parses uploaded PDF/image to extract TAC/WorkSafe/NDIS claim details.
 * 
 * For MVP: uses regex pattern matching on PDF text content.
 * Future: integrate with Azure Document Intelligence or Google Vision API.
 *
 * Body: FormData with "file" field (PDF, JPG, PNG)
 * Returns: { claimNumber, approvalDate, serviceScope, fundingAmount, scheme }
 */
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file as text (works for text-based PDFs)
    // For scanned PDFs, would need OCR service
    const buffer = await file.arrayBuffer();
    const text = extractTextFromBuffer(Buffer.from(buffer), file.type);

    // Pattern matching for various schemes
    const extracted = parseClaimDetails(text);

    return NextResponse.json({
      ...extracted,
      fileName: file.name,
      fileSize: file.size,
      confidence: extracted.claimNumber ? "high" : "low",
      rawTextPreview: text.slice(0, 500),
    });
  } catch (error: any) {
    console.error("Document parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse document" },
      { status: 500 }
    );
  }
}

/**
 * Extract readable text from buffer.
 * For PDFs: basic text extraction (works for text-based PDFs).
 * For images: would need OCR — return empty for now.
 */
function extractTextFromBuffer(buffer: Buffer, mimeType: string): string {
  if (mimeType === "application/pdf") {
    // Basic PDF text extraction — scan for text between stream markers
    // This catches most text-based PDFs (not scanned images)
    const str = buffer.toString("latin1");
    
    // Extract text objects from PDF streams
    const textParts: string[] = [];
    
    // Method 1: Find text between parentheses in PDF text objects
    const textMatches = str.matchAll(/\(([^)]+)\)/g);
    for (const match of textMatches) {
      const decoded = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/[^\x20-\x7E\n]/g, " ");
      if (decoded.trim().length > 2) {
        textParts.push(decoded.trim());
      }
    }

    // Method 2: Look for readable ASCII sequences
    const asciiMatches = str.matchAll(/[A-Z][a-zA-Z0-9\s:./\-]{10,}/g);
    for (const match of asciiMatches) {
      textParts.push(match[0].trim());
    }

    return textParts.join(" ");
  }

  // For images, return empty (would need OCR)
  return "";
}

/**
 * Parse claim details from extracted text using pattern matching.
 */
function parseClaimDetails(text: string): {
  claimNumber: string | null;
  approvalDate: string | null;
  serviceScope: string | null;
  fundingAmount: number | null;
  scheme: string | null;
  serviceDuration: string | null;
  hourlyRate: number | null;
} {
  const result = {
    claimNumber: null as string | null,
    approvalDate: null as string | null,
    serviceScope: null as string | null,
    fundingAmount: null as number | null,
    scheme: null as string | null,
    serviceDuration: null as string | null,
    hourlyRate: null as number | null,
  };

  // Detect scheme from text
  if (/transport accident commission|\bTAC\b/i.test(text)) {
    result.scheme = "tac";
  } else if (/worksafe|work\s*safe/i.test(text)) {
    result.scheme = "worksafe";
  } else if (/\bNDIS\b|national disability/i.test(text)) {
    result.scheme = "ndis";
  } else if (/\bDVA\b|veterans/i.test(text)) {
    result.scheme = "dva";
  } else if (/my aged care|aged\s*care/i.test(text)) {
    result.scheme = "my_aged_care";
  } else if (/centrelink|aged\s*pension|commonwealth\s*home\s*support|CHSP/i.test(text)) {
    result.scheme = "aged_pension";
  } else if (/superannuation|super\s*fund|retirement\s*fund|member\s*statement/i.test(text)) {
    result.scheme = "super";
  }

  // TAC claim number: TAC-YYYY-NNNNNN or TAC/YYYY/NNNNNN or just YYYY-NNNNNN after "Claim"
  const tacMatch = text.match(/TAC[-/]?(\d{4})[-/]?(\d{4,6})/i) ||
                   text.match(/[Cc]laim\s*(?:[Nn]o\.?|[Nn]umber)?\s*:?\s*(\d{4})[-/](\d{4,6})/) ||
                   text.match(/[Cc]laim\s*(?:[Nn]o\.?|[Nn]umber)?\s*:?\s*([A-Z]{2,4}[-/]\d{4}[-/]\d{4,6})/);
  if (tacMatch) {
    if (tacMatch[0].match(/[A-Z]{2,4}[-/]/)) {
      result.claimNumber = tacMatch[1] || tacMatch[0];
    } else {
      result.claimNumber = `TAC-${tacMatch[1]}-${tacMatch[2]}`;
    }
  }

  // WorkSafe: WS-YYYY-NNNNNN
  const wsMatch = text.match(/WS[-/]?(\d{4})[-/]?(\d{4,6})/i);
  if (wsMatch) {
    result.claimNumber = `WS-${wsMatch[1]}-${wsMatch[2]}`;
  }

  // NDIS number: 4XX XXX XXXX
  const ndisMatch = text.match(/\b(4\d{2}\s?\d{3}\s?\d{4})\b/);
  if (ndisMatch) {
    result.claimNumber = ndisMatch[1].replace(/\s/g, " ");
  }

  // Centrelink CRN: XXX XXX XXXA (9 digits + 1 letter)
  const crnMatch = text.match(/\b(\d{3}\s?\d{3}\s?\d{3}\s?[A-Z])\b/);
  if (crnMatch && !result.claimNumber) {
    result.claimNumber = crnMatch[1].replace(/\s/g, " ");
  }

  // Super fund member number
  const memberMatch = text.match(/[Mm]ember\s*(?:[Nn]o\.?|[Nn]umber)?\s*:?\s*(\d{6,12})/);
  if (memberMatch && !result.claimNumber) {
    result.claimNumber = memberMatch[1];
  }

  // Date patterns: DD/MM/YYYY, YYYY-MM-DD, DD Month YYYY
  const dateMatch = text.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/) ||
                    text.match(/(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/) ||
                    text.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
  if (dateMatch) {
    // Try to parse as YYYY-MM-DD
    const raw = dateMatch[0];
    const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      result.approvalDate = isoMatch[0];
    } else {
      // DD/MM/YYYY → YYYY-MM-DD
      const dmyMatch = raw.match(/(\d{1,2})[/](\d{1,2})[/](\d{4})/);
      if (dmyMatch) {
        result.approvalDate = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
      }
    }
  }

  // Service scope: look for "approved services", "support category", etc.
  const scopeMatch = text.match(/(?:approved\s+services?|support\s+category|service\s+type)\s*:?\s*([^.\n]{5,100})/i);
  if (scopeMatch) {
    result.serviceScope = scopeMatch[1].trim();
  }

  // Funding amount: $X,XXX.XX or "amount" followed by number
  const amountMatch = text.match(/\$([\d,]+\.?\d{0,2})/) ||
                      text.match(/(?:amount|total|budget|funding)\s*:?\s*\$?([\d,]+\.?\d{0,2})/i);
  if (amountMatch) {
    result.fundingAmount = parseFloat(amountMatch[1].replace(/,/g, ""));
  }

  // Hourly rate: $XX/hr, $XX per hour, $XX.XX/hour
  const rateMatch = text.match(/\$(\d+\.?\d{0,2})\s*(?:\/|per)\s*(?:hr|hour)/i);
  if (rateMatch) {
    result.hourlyRate = parseFloat(rateMatch[1]);
  }

  // Service duration: X hours, X hrs/week, X sessions
  const durationMatch = text.match(/(\d+)\s*(?:hours?|hrs?)\s*(?:per|\/)\s*(?:week|month|session)/i) ||
                        text.match(/(\d+)\s*(?:sessions?|visits?)\s*(?:per|\/)\s*(?:week|month)/i);
  if (durationMatch) {
    result.serviceDuration = durationMatch[0];
  }

  return result;
}
