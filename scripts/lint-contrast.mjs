#!/usr/bin/env node
/**
 * lint:contrast — UI_DESIGN.md §1.1 配色契约自动校验
 *
 * 1. 解析 app/globals.css，抽取 :root / [data-theme=dark] 中的 CSS 变量值。
 * 2. 检查每对 (背景, 前景) 组合的对比度。
 *    - 正文 (text-primary on bg-base / bg-surface) ≥ 7:1 (WCAG AAA)
 *    - 次文本 (text-secondary on bg-*) ≥ 4.5:1
 *    - 链接 (text-link on bg-*) ≥ 4.5:1
 *    - 状态徽章每对 ≥ 4.5:1
 * 3. 任何 ratio 不达标 → 退出码 1，CI 失败。
 *
 * 不依赖外部包，颜色限定为 #RRGGBB / rgba()。
 */

import fs from "node:fs";
import path from "node:path";

const CSS_PATH = path.resolve("app/globals.css");

function parseTokens(css, blockRegex) {
  const block = css.match(blockRegex);
  if (!block) return {};
  const out = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(block[0])) !== null) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const v = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function rgbaToRgb(str, bg) {
  const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  const r = +m[1], g = +m[2], b = +m[3];
  const a = m[4] !== undefined ? +m[4] : 1;
  if (a >= 1) return [r, g, b];
  // composite over bg
  return [
    r * a + bg[0] * (1 - a),
    g * a + bg[1] * (1 - a),
    b * a + bg[2] * (1 - a),
  ];
}

function toRgb(value, bg) {
  if (!value) return null;
  if (value.startsWith("#")) return hexToRgb(value);
  if (value.startsWith("rgb")) return rgbaToRgb(value, bg);
  return null;
}

function relLum([r, g, b]) {
  const conv = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [conv(r), conv(g), conv(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function ratio(fg, bg) {
  const L1 = relLum(fg);
  const L2 = relLum(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

const css = fs.readFileSync(CSS_PATH, "utf8");

const lightTokens = parseTokens(css, /:root\s*\{[\s\S]*?\}/);
const darkTokens = parseTokens(css, /:root\[data-theme="dark"\]\s*\{[\s\S]*?\}/);

const SUITES = [
  { name: "light", tokens: lightTokens },
  { name: "dark", tokens: darkTokens },
];

const TEXT_CHECKS = [
  { fg: "text-primary", bg: "bg-base", min: 7, label: "Body on base" },
  { fg: "text-primary", bg: "bg-surface", min: 7, label: "Body on surface" },
  { fg: "text-secondary", bg: "bg-base", min: 4.5, label: "Secondary on base" },
  { fg: "text-secondary", bg: "bg-surface", min: 4.5, label: "Secondary on surface" },
  { fg: "text-link", bg: "bg-base", min: 4.5, label: "Link on base" },
];

const BADGE_PAIRS = [
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["inprogress", "In progress"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
  ["refunded", "Refunded"],
];

let failed = 0;
let total = 0;

function check(suite, fgKey, bgKey, min, label) {
  const fgValue = suite.tokens[fgKey];
  const bgValue = suite.tokens[bgKey];
  if (!fgValue || !bgValue) {
    console.warn(`  [skip] ${suite.name} :: ${label} (missing token)`);
    return;
  }
  // The page bg under any badge: bg-base. Light = #FFFFFF, Dark = #1E293B.
  const pageBgRaw = suite.tokens["bg-base"] ?? "#FFFFFF";
  const pageBg = toRgb(pageBgRaw, [255, 255, 255]) ?? [255, 255, 255];
  const bgRgb = toRgb(bgValue, pageBg);
  const fgRgb = toRgb(fgValue, bgRgb ?? pageBg);
  if (!bgRgb || !fgRgb) {
    console.warn(`  [skip] ${suite.name} :: ${label} (unparseable color)`);
    return;
  }
  const r = ratio(fgRgb, bgRgb);
  total += 1;
  const ok = r >= min;
  if (!ok) failed += 1;
  console.log(
    `  ${ok ? "✓" : "✗"} ${suite.name} :: ${label.padEnd(28)} ${r.toFixed(2)}:1 (min ${min})`
  );
}

for (const suite of SUITES) {
  console.log(`\n[${suite.name}]`);
  for (const c of TEXT_CHECKS) {
    check(suite, c.fg, c.bg, c.min, c.label);
  }
  for (const [k, label] of BADGE_PAIRS) {
    check(suite, `badge-${k}-fg`, `badge-${k}-bg`, 4.5, `${label} badge`);
  }
}

console.log(`\n${total - failed}/${total} passed`);
if (failed > 0) {
  console.error(`\n✗ ${failed} contrast check(s) failed`);
  process.exit(1);
}
console.log("✓ all contrast checks pass");
