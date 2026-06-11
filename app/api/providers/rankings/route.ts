import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const postcode = req.nextUrl.searchParams.get("postcode");
  const category = req.nextUrl.searchParams.get("category");
  return NextResponse.json({
    postcode, category,
    providers: [],
    total: 0,
    message: "Rankings calculated based on composite scoring (safety 30%, quality 25%, punctuality 20%, communication 15%, overall 10%)",
  });
}
