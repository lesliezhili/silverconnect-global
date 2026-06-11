#!/usr/bin/env python3
"""
SilverConnect Global — Post-Deploy E2E Smoke Test
Run from your local machine after `git push` + Vercel deploy completes.

Usage:
  pip install requests
  python3 sc_e2e_test.py

Optional — check GitHub Actions build status too:
  GH_TOKEN=ghp_xxx python3 sc_e2e_test.py
"""
import os, re, sys
try:
    import requests
except ImportError:
    print("Run: pip install requests")
    sys.exit(1)

BASE     = "https://silverconnect-global.vercel.app"
GH_TOKEN = os.getenv("GH_TOKEN", "")
GH_REPO  = "lesliezhili/silverconnect-global"

S = requests.Session()
S.headers["User-Agent"] = "Mozilla/5.0 SilverConnect-E2E/1.0"

RESULTS, FAILS = [], []

def chk(label, ok, detail=""):
    icon = "\u2705" if ok else "\u274c"
    RESULTS.append((icon, label, detail))
    if not ok:
        FAILS.append(label)
    pad = max(1, 52 - len(label))
    print(f"  {icon}  {label}{'.' * pad} {detail}")
    return ok

def get(path, cookie=None):
    try:
        cookies = {"sc-country": cookie} if cookie else {}
        r = S.get(BASE + path, cookies=cookies, timeout=14, allow_redirects=True)
        return r.status_code, r.text
    except Exception as e:
        return 0, str(e)

# ======================================================================
# Step 0 — GitHub Actions build status
# ======================================================================
print("\n" + "=" * 60)
print("  STEP 0 — Build status")
print("=" * 60)
if GH_TOKEN:
    try:
        r = requests.get(
            f"https://api.github.com/repos/{GH_REPO}/actions/runs?branch=main&per_page=1",
            headers={"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json"},
            timeout=10
        )
        runs = r.json().get("workflow_runs", [])
        if runs:
            run = runs[0]
            c   = run.get("conclusion") or run.get("status")
            sha = run["head_sha"][:10]
            msg = run["head_commit"]["message"].split("\n")[0][:55]
            chk(f"Build {sha} ({msg})", c == "success", f"conclusion={c}")
            jobs_r = requests.get(run["jobs_url"], headers={"Authorization": f"Bearer {GH_TOKEN}"}, timeout=10)
            for j in jobs_r.json().get("jobs", []):
                icon2 = "\u2705" if j["conclusion"]=="success" else "\u274c" if j["conclusion"]=="failure" else "\u23ed️"
                print(f"       {icon2}  {j['name']} → {j.get('conclusion', j.get('status'))}")
        else:
            print("  \u26a0\ufe0f  No workflow runs found")
    except Exception as e:
        print(f"  \u26a0\ufe0f  GitHub API error: {e}")
else:
    print("  (set GH_TOKEN env var to check build status)")

# ======================================================================
# MODULE 1 — Landing pages
# ======================================================================
print("\n" + "=" * 60)
print("  MODULE 1 — Landing pages")
print("=" * 60)

s, b = get("/zh")
chk("Landing /zh | HTTP 200",             s == 200,                           f"HTTP {s}")
chk("Landing /zh | hero copy",            "\u5c45\u5bb6\u517b\u8001" in b or "\u957f\u8f88" in b or "\u4e13\u4e1a\u62a4\u7406" in b)
chk("Landing /zh | teaser \u2192 /christian",    "/christian" in b)
chk("Landing /zh | \u57fa\u7763\u5f92 NOT in h1",     not re.search(r'<h1[^>]*>[^<]*\u57fa\u7763\u5f92', b))
chk("Landing /zh | \u975e\u8425\u5229\u4e92\u52a9\u5e73\u53f0 tagline",   "\u975e\u8425\u5229\u4e92\u52a9\u5e73\u53f0" in b)
chk("Landing /zh | SilverConnect Global", "SilverConnect Global" in b)

s, b = get("/en")
chk("Landing /en | HTTP 200",             s == 200,                           f"HTTP {s}")
chk("Landing /en | senior/care copy",     "senior" in b.lower() or "care" in b.lower())
chk("Landing /en | register CTA",         "/auth/register" in b)

# ======================================================================
# MODULE 2 — CN branding + country switcher
# ======================================================================
print("\n" + "=" * 60)
print("  MODULE 2 — \u4e5d\u9f0e\u9280\u8054 CN branding")
print("=" * 60)

s, b = get("/zh", cookie="CN")
chk("CN | HTTP 200",                      s == 200,                           f"HTTP {s}")
chk("CN | \u4e5d\u9f0e\u9280\u8054 brand present",       "\u4e5d\u9f0e\u9280\u8054" in b)
chk("CN | \u975e\u8425\u5229\u4e92\u52a9\u5e73\u53f0 subtitle",     "\u975e\u8425\u5229\u4e92\u52a9\u5e73\u53f0" in b)
chk("CN | \u6c11\u653f\u6551\u52a9 funding pill",     "\u6c11\u653f\u6551\u52a9" in b)
chk("CN | \u57fa\u672c\u533b\u4fdd funding pill",     "\u57fa\u672c\u533b\u4fdd" in b)
chk("CN | \u957f\u671f\u62a4\u7406\u9669 funding pill",   "\u957f\u671f\u62a4\u7406\u9669" in b)
chk("CN | \u53c2\u4fdd\u53f7 text (not \u7d22\u8d54\u53f7)",  "\u53c2\u4fdd\u53f7" in b and "\u7d22\u8d54\u53f7" not in b)
chk("CN | \u00a9 2026 \u4e5d\u9f0e\u9280\u8054 footer",    "\u4e5d\u9f0e\u9280\u8054" in b and "2026" in b)

# NDIS should not appear in visible content (may still be in JSON bundle)
vis = re.sub(r'<script[^>]*>.*?</script>', '', b, flags=re.DOTALL)
chk("CN | NDIS not in visible content",   "NDIS" not in vis[:8000])

# CountrySwitcher bundle has CN option
chunks = re.findall(r'/_next/static/chunks/([\w~.-]+\.js)', b)
cn_found = False
for chunk in chunks[:25]:
    try:
        cjs = S.get(f"{BASE}/_next/static/chunks/{chunk}", timeout=8).text
        if 'sc-country' in cjs and ('\U0001f1e8\U0001f1f3' in cjs or 'onSelect("CN")' in cjs):
            cn_found = True
            break
    except:
        pass
chk("CN | \U0001f1e8\U0001f1f3 in CountrySwitcher bundle",  cn_found)

# ======================================================================
# MODULE 3 — Christian membership page
# ======================================================================
print("\n" + "=" * 60)
print("  MODULE 3 — /zh/christian")
print("=" * 60)

s, b = get("/zh/christian")
chk("Christian | HTTP 200",               s == 200,                           f"HTTP {s}")
chk("Christian | \u57fa\u7763\u5f92\u4e92\u52a9\u5e73\u53f0 heading",   "\u57fa\u7763\u5f92\u4e92\u52a9\u5e73\u53f0" in b)
chk("Christian | \u4e8b\u5de5\u670d\u52a1 section",       "\u4e8b\u5de5\u670d\u52a1" in b)
chk("Christian | \u67e5\u7ecf\u5b66\u4e60 chip",           "\u67e5\u7ecf\u5b66\u4e60" in b)
chk("Christian | \u7977\u544a\u5c0f\u7ec4 chip",           "\u7977\u544a\u5c0f\u7ec4" in b)
chk("Christian | \u7267\u5e08\u63a2\u8bbf chip",           "\u7267\u5e08\u63a2\u8bbf" in b)
chk("Christian | \u5b8c\u5168\u514d\u8d39 free badge",     "\u5b8c\u5168\u514d\u8d39" in b)
chk("Christian | \u6ce8\u518c\u57fa\u7763\u5f92\u4f1a\u5458 CTA",       "\u6ce8\u518c\u57fa\u7763\u5f92\u4f1a\u5458" in b)
chk("Christian | \u8fd4\u56de\u9996\u9875 back link",       "\u8fd4\u56de\u9996\u9875" in b)
chk("Christian | no registerHint leak",  "registerHint" not in b)

# ======================================================================
# MODULE 4 — Auth pages (login crash fix)
# ======================================================================
print("\n" + "=" * 60)
print("  MODULE 4 — Auth (login crash fix)")
print("=" * 60)

s, b = get("/en/auth/login")
chk("Login | HTTP 200",                   s == 200,                           f"HTTP {s}")
chk("Login | email input",               'type="email"' in b or 'name="email"' in b)
chk("Login | password input",            'type="password"' in b)
chk("Login | submit button",             re.search(r'<button[^>]*type=["\']submit', b) is not None)
chk("Login | no crash on load",          "Something went wrong" not in b)

s, b = get("/en/auth/register")
chk("Register | HTTP 200",               s == 200,                           f"HTTP {s}")
chk("Register | 3+ inputs",              b.count('<input') >= 3)

# ======================================================================
# MODULE 5 — All 7 locales
# ======================================================================
print("\n" + "=" * 60)
print("  MODULE 5 — All 7 locales")
print("=" * 60)

for loc in ["en", "zh", "zh_tw", "th", "ko", "ja", "vi"]:
    s, b = get("/" + loc)
    chk(f"/{loc} | HTTP 200",             s == 200,                           f"HTTP {s}")
    chk(f"/{loc} | lang=\"{loc}\" attr",  f'lang="{loc}"' in b,              f'found' if f'lang="{loc}"' in b else 'MISSING')
    chk(f"/{loc} | brand visible",        "SilverConnect" in b or "\u4e5d\u9f0e\u9280\u8054" in b)

# ======================================================================
# Summary
# ======================================================================
passed = sum(1 for r in RESULTS if r[0] == "\u2705")
failed = len(FAILS)
total  = len(RESULTS)

print("\n" + "=" * 60)
print(f"  TOTAL {total}  |  \u2705 PASSED {passed}  |  \u274c FAILED {failed}")
if FAILS:
    print("  \nFailed checks:")
    for f in FAILS:
        print(f"    \u2022 {f}")
print("=" * 60)

sys.exit(1 if FAILS else 0)
