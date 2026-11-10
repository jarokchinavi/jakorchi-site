#!/usr/bin/env python3
"""Tidy the place names in public/places/<x>_<y>.json (name + local name). Safe to run again: a clean file stays the same.

What it does:   removes hidden/zero-width characters, turns tabs and wide spaces into one normal space,
                trims the ends (also a stray "-" or ","), and writes an all-lowercase Latin name as Title Case (okinawabar -> Okinawabar).
What it does NOT do: change spellings. A shop name is what the shop calls itself, so "Tonkotsu" or "Raamen" stay as they are.
                Typos are handled by the search instead (js/app.js, fold + fuzzy).

Run:  python tools/clean_names.py   then   python tools/split_places.py   then push."""
import json, glob, re, pathlib

places = pathlib.Path(__file__).resolve().parent.parent / "public" / "places"
HIDDEN = re.compile(r"[​-‏‪-‮⁠﻿\x00-\x08\x0b-\x1f\x7f]")
LOWER = re.compile(r"^[a-z][a-z0-9' &.\-]*$")
SMALL = {"and", "of", "the", "at", "in", "no", "de", "la", "le"}

def tidy(s):
    if not isinstance(s, str):
        return s
    t = HIDDEN.sub("", s)
    t = re.sub(r"[\t  - 　]+", " ", t)
    t = re.sub(r" {2,}", " ", t).strip(" -–,;|")
    if LOWER.match(t):
        t = " ".join(w if (i and w in SMALL) else w[:1].upper() + w[1:] for i, w in enumerate(t.split(" ")))
    return t

changed = files = 0
for f in sorted(glob.glob(str(places / "[0-9]*_[0-9]*.json"))):
    data = json.load(open(f, encoding="utf-8"))
    n = 0
    for row in data["p"]:
        for i in (1, 2):
            new = tidy(row[i])
            if new != row[i]:
                row[i] = new
                n += 1
    if n:
        pathlib.Path(f).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        files += 1
        changed += n
print(f"{changed} names tidied in {files} files")
