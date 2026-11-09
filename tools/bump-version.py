#!/usr/bin/env python3
"""Give the app a new version number everywhere at once (app code, page, version.json).
Use: python tools/bump-version.py            -> today's date + next number, e.g. 2026-11-10.1
     python tools/bump-version.py 2026-11-10.3"""
import re, sys, json, datetime, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "public"
app, page, ver = root / "js/app.js", root / "index.html", root / "version.json"
old = re.search(r'const BUILD="([^"]+)"', app.read_text(encoding="utf-8")).group(1)
if len(sys.argv) > 1:
    new = sys.argv[1]
else:
    today = datetime.date.today().isoformat()
    n = int(old.split(".")[1]) + 1 if old.startswith(today + ".") else 1
    new = f"{today}.{n}"
assert re.fullmatch(r"\d{4}-\d{2}-\d{2}\.\d+", new), new
a = app.read_text(encoding="utf-8").replace(f'const BUILD="{old}"', f'const BUILD="{new}"', 1)
p = page.read_text(encoding="utf-8").replace(f"?v={old}", f"?v={new}").replace(f'<b id="buildNo">{old}</b>', f'<b id="buildNo">{new}</b>')
app.write_text(a, encoding="utf-8"); page.write_text(p, encoding="utf-8")
ver.write_text(json.dumps({"v": new}), encoding="utf-8")
print(old, "->", new)
