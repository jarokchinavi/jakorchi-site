#!/usr/bin/env python3
"""Pack the restaurant rows into FEW, SMALL files (adaptive map tiles), so a whole country stays far below the 20,000-file limit of Cloudflare's free plan.

Layout in public/places/:
  t/<z>/<x>_<y>.json   one leaf tile: {"p": [rows]} (same rows as before). A tile that holds more than MAXN places is cut into 4 smaller tiles
                       (down to zoom ZMAX), so a village shares one file with its whole region and Shinjuku gets its own small files.
  _index.json          {"v": "<changes when the data changes>", "l": [[z, x, y, count], ...]} = every leaf tile (the app reads this first)

Input = what is already in the output folder (packed leaves + old flat zoom-12 squares <x>_<y>.json) plus new flat squares from build_places.py.
New rows win over old rows with the same id. --replace Japan first drops every OLD Japan row (a full rebuild of the country: closed places disappear).

Use:  python tools/pack_places.py --in <folder with new flat squares> --replace Japan      (cloud workflow)
      python tools/pack_places.py                                                           (only repack what is already in public/places)
Names are tidied here too (tools/clean_names.py: hidden characters, spaces, Title Case of all-lowercase Latin names)."""
import argparse, glob, hashlib, json, math, os, pathlib, re, shutil, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from clean_names import tidy

ROOT, ZMAX, MAXN = 7, 15, 1500          # first tile level, deepest level, most places per tile before it is cut in 4
MAX_FILES = 15000                       # stop long before Cloudflare's 20,000 limit

def tile_xy(lat, lng, z=ZMAX):
    n = 2 ** z
    r = math.radians(lat)
    x = int((lng + 180) / 360 * n)
    y = int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)
    return min(max(x, 0), n - 1), min(max(y, 0), n - 1)

def read_rows(files):
    for f in files:
        try:
            for r in json.load(open(f, encoding="utf-8"))["p"]:
                if isinstance(r, list) and len(r) >= 14 and isinstance(r[5], (int, float)) and isinstance(r[6], (int, float)) and -85 < r[5] < 85:
                    yield r
        except Exception as e:
            sys.exit(f"cannot read {f}: {e}")

HALAL_NAME = re.compile(r"(?<![a-z])halal(?![a-z])|ハラル(?!ド)|ハラール|ﾊﾗﾙ|할랄|清真|حلال", re.I)

def halal_by_name(rows):
    """A place that calls itself halal in its own name (Halal Kebab, 清真兰州牛肉面, ハラールカレー, 할랄킹, ...) but has no halal tag in OpenStreetMap
    gets diet value 2 = "Some halal options" (not 1: nobody has checked it). Names in other languages count too. Returns how many were set."""
    n = 0
    for r in rows.values():
        if r[7] == 0:
            names = [r[1] or "", r[2] or ""] + (list(r[16].values()) if isinstance(r[16], dict) else [])
            if any(HALAL_NAME.search(x) for x in names if isinstance(x, str)):
                r[7] = 2; n += 1
    return n

def drop_copies(rows):
    """The same restaurant mapped twice in OpenStreetMap (two nodes, or a node and a building) = one row.
    Same normalised name + same kind inside the same ~35 m cell. Keeper = the row with most filled columns (then the lowest id);
    it gets the best diet value of the group and fills its empty columns (hours, address, website, phone, other-language names)."""
    def norm(s): return re.sub(r"[\W_]+", "", (s or "").lower())
    def info(r): return sum(1 for i in (2, 4, 9, 10, 11, 15, 16) if r[i]) + (r[7] > 0) + (r[8] > 0) + (r[14] > 0)
    def best(vals):
        return 1 if 1 in vals else 2 if 2 in vals else 0
    groups = {}
    for r in rows.values():
        n = norm(r[1])
        if n:
            groups.setdefault((n, r[3], round(r[5] * 3000), round(r[6] * 3000)), []).append(r)
    out, dups = dict(rows), 0
    for g in groups.values():
        if len(g) < 2: continue
        g.sort(key=lambda r: (-info(r), r[0]))
        keep = g[0]
        for other in g[1:]:
            for i in (2, 4, 9, 10, 11, 15, 16, 17):
                if not keep[i] and other[i]: keep[i] = other[i]
            del out[other[0]]; dups += 1
        for i in (7, 8, 14):
            keep[i] = best([r[i] for r in g])
    return out, dups

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="ins", action="append", default=[], help="folder with new flat squares <x>_<y>.json")
    ap.add_argument("--replace", action="append", default=[], help="country whose old rows are dropped first (Japan, Korea, China)")
    ap.add_argument("--out", default=str(HERE.parent / "public" / "places"))
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    rows = {}
    old = glob_old = list(glob.glob(str(out / "t" / "*" / "*.json"))) + glob.glob(str(out / "[0-9]*_[0-9]*.json"))
    for r in read_rows(old):
        if r[13] not in a.replace:
            rows[r[0]] = r
    kept = len(rows)
    new = 0
    for d in a.ins:
        for r in read_rows(glob.glob(str(pathlib.Path(d) / "[0-9]*_[0-9]*.json"))):
            rows[r[0]] = r
            new += 1
    for r in rows.values():
        r[1], r[2] = tidy(r[1]), tidy(r[2])
    print(f"rows: {kept} kept from the old data, {new} new, {len(rows)} in total")
    rows, dups = drop_copies(rows)
    print(f"copies removed: {dups} (same name + kind within ~35 m; the fullest row stays, diet info and empty fields are merged in)")
    print(f"halal word in the name -> 'Some halal options': {halal_by_name(rows)} places newly marked")

    leaves = []
    def cut(z, x, y, items):
        if len(items) <= MAXN or z == ZMAX:
            leaves.append((z, x, y, items)); return
        sh = ZMAX - (z + 1); kids = {}
        for it in items:
            kids.setdefault((it[0] >> sh, it[1] >> sh), []).append(it)
        for (cx, cy), its in kids.items():
            cut(z + 1, cx, cy, its)
    roots = {}
    for r in rows.values():
        x, y = tile_xy(r[5], r[6])
        roots.setdefault((x >> (ZMAX - ROOT), y >> (ZMAX - ROOT)), []).append((x, y, r))
    for (x, y), its in roots.items():
        cut(ROOT, x, y, its)
    if len(leaves) > MAX_FILES:
        sys.exit(f"STOP: {len(leaves)} files is too many (limit {MAX_FILES}); raise MAXN")

    tmp = out / "_t_new"
    shutil.rmtree(tmp, ignore_errors=True)
    dig = hashlib.sha1(); index = []; total = biggest = 0; per_z = {}
    for z, x, y, its in sorted(leaves, key=lambda l: (l[0], l[1], l[2])):
        its.sort(key=lambda t: t[2][0])
        text = json.dumps({"p": [t[2] for t in its]}, ensure_ascii=False, separators=(",", ":"))
        (tmp / str(z)).mkdir(parents=True, exist_ok=True)
        (tmp / str(z) / f"{x}_{y}.json").write_text(text, encoding="utf-8")
        b = len(text.encode("utf-8")); total += b; biggest = max(biggest, b)
        dig.update(f"{z}/{x}/{y}/{len(its)}/{b}/".encode() + hashlib.sha1(text.encode("utf-8")).digest()); index.append([z, x, y, len(its)])  # content hash: any change in a tile changes the index version
        per_z[z] = per_z.get(z, 0) + 1
    assert sum(i[3] for i in index) == len(rows), "rows lost while packing"
    # swap in the new tiles, remove the old layout (flat squares, 14/, _done.json, _split.json)
    shutil.rmtree(out / "t", ignore_errors=True)
    tmp.rename(out / "t")
    for f in glob.glob(str(out / "[0-9]*_[0-9]*.json")): os.remove(f)
    shutil.rmtree(out / "14", ignore_errors=True)
    for f in ("_done.json", "_split.json"):
        if (out / f).exists(): os.remove(out / f)
    (out / "_index.json").write_text(json.dumps({"v": dig.hexdigest()[:10], "l": index}, separators=(",", ":")), encoding="utf-8")
    print(f"{len(rows)} places in {len(index)} files · {total / 1e6:.1f} MB · biggest {biggest / 1024:.0f} KB · average {total / max(1, len(index)) / 1024:.0f} KB")
    print("files per zoom level:", dict(sorted(per_z.items())))

if __name__ == "__main__":
    main()
