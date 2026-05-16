#!/usr/bin/env node
/**
 * HTTP smoke checks for production/staging (no Playwright required).
 * Usage: node scripts/smoke-production.mjs [baseUrl]
 */
const base = (process.argv[2] || process.env.PLAYWRIGHT_TEST_BASE_URL || "http://47.236.169.73").replace(/\/$/, "");

const checks = [
  { path: "/zh/home", expect: 200, includes: "你好" },
  { path: "/en/home", expect: 200, includes: "Guest" },
  { path: "/en/help", expect: 200, includes: "Help" },
  { path: "/en/auth/login", expect: 200, includes: "email" },
  { path: "/en/help/nope-not-real", expect: 404 },
];

let failed = 0;
for (const { path, expect, includes } of checks) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const okStatus = res.status === expect;
    const okBody = includes ? body.toLowerCase().includes(includes.toLowerCase()) : true;
    if (okStatus && okBody) {
      console.log(`OK  ${res.status} ${path}`);
    } else {
      failed++;
      console.error(`FAIL ${path} status=${res.status} expected=${expect} body~=${includes}`);
    }
  } catch (e) {
    failed++;
    console.error(`FAIL ${path}`, e.message);
  }
}
process.exit(failed ? 1 : 0);
