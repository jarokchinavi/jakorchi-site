#!/usr/bin/env python3
"""Cut the biggest restaurant files into 16 smaller squares each, so a zoomed-in phone downloads only what is on screen.

public/places/<x>_<y>.json          = one zoom-12 square (made by build_places.py; stays the source and the fallback)
public/places/14/<x>_<y>.json       = its 16 zoom-14 squares (made here, also when empty, so the app never gets a 404)
public/places/_split.json           = {"split": ["<x>_<y>", ...], "v": "<changes when the data changes>"}

Run after new restaurant files were copied in:  python tools/split_places.py
The app (loadView in js/app.js): zoom 15 or closer -> only the small squares in view; zoomed out -> the whole file, as before."""
import json, math, os, glob, hashlib, shutil, pathlib

MIN_BYTES = 300_000          # only files bigger than this are split
places = pathlib.Path(__file__).resolve().parent.parent / "public" / "places"
out = places / "14"

def tile14(lat, lng):
    n = 2 ** 14
    r = math.radians(lat)
    return int((lng + 180) / 360 * n), int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)

shutil.rmtree(out, ignore_errors=True)
out.mkdir()
split, digest, files, biggest = [], hashlib.sha1(), 0, 0
for f in sorted(glob.glob(str(places / "[0-9]*_[0-9]*.json"))):
    if os.path.getsize(f) < MIN_BYTES:
        continue
    key = os.path.basename(f)[:-5]
    x, y = map(int, key.split("_"))
    rows = json.load(open(f, encoding="utf-8"))["p"]
    parts = {(a, b): [] for a in range(x * 4, x * 4 + 4) for b in range(y * 4, y * 4 + 4)}
    for row in rows:
        t = tile14(row[5], row[6])
        if t not in parts:                       # a place on the edge: keep it in the nearest square of this file
            t = (min(max(t[0], x * 4), x * 4 + 3), min(max(t[1], y * 4), y * 4 + 3))
        parts[t].append(row)
    assert sum(map(len, parts.values())) == len(rows)
    for (a, b), part in parts.items():
        text = json.dumps({"p": part}, ensure_ascii=False, separators=(",", ":"))
        (out / f"{a}_{b}.json").write_text(text, encoding="utf-8")
        files += 1
        biggest = max(biggest, len(text.encode()))
    split.append(key)
    digest.update(key.encode() + str(len(rows)).encode() + str(os.path.getsize(f)).encode())
(places / "_split.json").write_text(json.dumps({"split": split, "v": digest.hexdigest()[:8]}), encoding="utf-8")
print(f"{len(split)} big files -> {files} small files (biggest {biggest / 1024:.0f} KB)")
