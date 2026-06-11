import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST() {
  const h = process.env.VERCEL_DEPLOY_HOOK;
  if (h) { const r = await fetch(h, {method:"POST"}); return NextResponse.json({success:true, status:r.status}); }
  return NextResponse.json({success:true, message:"Set VERCEL_DEPLOY_HOOK env var in Vercel Dashboard", ts: new Date().toISOString()});
}
export async function GET() { return NextResponse.json({endpoint:"/api/admin/redeploy", method:"POST"}); }
