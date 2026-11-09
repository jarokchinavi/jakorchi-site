#!/usr/bin/env python3
"""Jakorchi: makes the restaurant files from an OpenStreetMap file (.osm.pbf).

Needs once:  pip install osmium   (version 4 or newer). make-restaurants.bat does this for you.
Use:         python build_places.py kanto.osm.pbf Japan 3634 3641 1608 1615   (only these map squares: Tokyo)
             python build_places.py south-korea.osm.pbf Korea                   (the whole file)
Output:      straight into the website folder ../jakorchi-site/places when it exists (else a 'places' folder here):
             files like 3638_1612.json (zoom-12 map squares) + _done.json (list of finished squares).
             Squares that already exist are merged, so Seoul and Tokyo can live side by side.
Data: (c) OpenStreetMap contributors (ODbL). Big countries need a lot of memory (China: 8 GB or more).
Buildings (ways) get their first point as location (approximate).
Columns per place: [id, name (Latin if OSM has it), local name, kind, cuisine, lat, lng, halal, vegan, hours,
address, website, (empty, area is no longer used), country, vegetarian, phone, names in other languages, shop/amenity]; diet: 0 = not listed, 1 = yes, 2 = limited."""
import sys, os, json, math
import osmium

Z = 12
AMEN = {"restaurant", "cafe", "fast_food", "bar", "pub", "ice_cream", "food_court", "biergarten"}
SHOP = {"bakery", "pastry", "confectionery", "ice_cream", "tea", "coffee"}


LAT_KEYS = ["name:en", "name_en", "name:ko-Latn", "name:ko_rm", "name:ja-Latn", "name:ja_rm",
            "name:zh-Latn-pinyin", "name:zh_pinyin", "name:zh-Latn", "int_name"]
ADDR_KEYS = ["addr:province", "addr:state", "addr:city", "addr:district", "addr:subdistrict", "addr:suburb",
             "addr:neighbourhood", "addr:quarter", "addr:city_district", "addr:street", "addr:block_number",
             "addr:housenumber"]

def dv(v):
    return 1 if v in ("yes", "only") else 2 if v == "limited" else 0

def osm_addr(t):
    a = t.get("addr:full")
    if not a:
        seen = []
        for k in ADDR_KEYS:
            v = t.get(k)
            if v and v not in seen:
                seen.append(v)
        a = " ".join(seen)
    extra = " ".join(x for x in (t.get("addr:unit"), ("F" + t["addr:floor"]) if t.get("addr:floor") else "") if x)
    pc = "(" + t["addr:postcode"] + ")" if t.get("addr:postcode") else ""
    return " ".join(x for x in (a, extra, pc) if x)

def diet_of(t):
    """geeft (halal, vegan, vegetarisch, cuisine): 0 = niet vermeld, 1 = ja/only, 2 = beperkt"""
    cs = [x.strip() for x in (t.get("cuisine") or "").split(";") if x.strip()]
    h = dv(t.get("diet:halal")) or (1 if "halal" in cs or "muslim" in cs else 0)
    v = dv(t.get("diet:vegan")) or (1 if "vegan" in cs else 0)
    g = dv(t.get("diet:vegetarian")) or (1 if "vegetarian" in cs else 0)
    c = next((x for x in cs if x not in ("halal", "muslim", "vegan", "vegetarian")), cs[0] if cs else "")
    return h, v, g, c.replace("_", " ")

def nm_of(t):
    o = {l: t["name:" + l] for l in ("nl", "de", "fr", "es", "ja", "ko", "ar", "ru", "th", "vi", "id", "ms", "tr", "hi", "fa", "pt", "it") if t.get("name:" + l)}
    z = t.get("name:zh") or t.get("name:zh-Hans") or t.get("name:zh-CN")
    if z:
        o["zh"] = z
    return o or 0

def cat_of(t):
    a, s = t.get("amenity"), t.get("shop")
    if a == "cafe" or s in ("tea", "coffee"): return "coffee"
    if a == "ice_cream" or s in ("ice_cream", "bakery", "pastry", "confectionery") or "dessert" in (t.get("cuisine") or ""): return "dessert"
    if a in ("bar", "pub", "biergarten"): return "drinks"
    if a in ("fast_food", "food_court"): return "fast"
    return "restaurant"

def tile(lat, lng):
    n = 2 ** Z
    return int((lng + 180) / 360 * n), int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)

def main(pbf, country, rng=None):
    here = os.path.dirname(os.path.abspath(__file__))
    site = os.path.join(here, "..", "jakorchi-site", "places")
    out = os.path.normpath(site) if os.path.isdir(site) else os.path.join(here, "places")
    tiles = {}
    fp = osmium.FileProcessor(pbf).with_locations().with_filter(osmium.filter.KeyFilter("amenity", "shop"))
    for o in fp:
        if not (o.is_node() or o.is_way()): continue
        t = o.tags
        name = t.get("name")
        if not name or (t.get("amenity") not in AMEN and t.get("shop") not in SHOP): continue
        try:
            loc = o.location if o.is_node() else o.nodes[0].location
            if not loc.valid(): continue
            lat, lng = loc.lat, loc.lon
        except Exception:
            continue
        tl = tile(lat, lng)
        if rng and not (rng[0] <= tl[0] <= rng[1] and rng[2] <= tl[1] <= rng[3]): continue
        en = next((t[k] for k in LAT_KEYS if t.get(k)), "")
        d = diet_of(t)
        row = [("osm_n" if o.is_node() else "osm_w") + str(o.id), en or name, name if en and en != name else "",
               cat_of(t), d[3], round(lat, 5), round(lng, 5), d[0], d[1],
               t.get("opening_hours") or "", osm_addr(t),
               t.get("website") or t.get("contact:website") or "",
               "", country,
               d[2], t.get("phone") or t.get("contact:phone") or "", nm_of(t),
               t.get("shop") or t.get("amenity") or ""]
        tiles.setdefault(tl, []).append(row)
    os.makedirs(out, exist_ok=True)
    total = 0
    for (x, y), rows in tiles.items():
        path = os.path.join(out, f"{x}_{y}.json")
        if os.path.exists(path):  # square that already exists: merge
            with open(path, encoding="utf8") as f:
                old = json.load(f)["p"]
            seen = {r[0] for r in rows}
            rows = rows + [r for r in old if r[0] not in seen]
        with open(path, "w", encoding="utf8") as f:
            json.dump({"p": rows}, f, ensure_ascii=False, separators=(",", ":"))
        total += len(rows)
    # _done.json: the list of finished squares (empty squares too). The app uses it to load new files right away.
    dpath = os.path.join(out, "_done.json")
    done = []
    if os.path.exists(dpath):
        try:
            with open(dpath, encoding="utf8") as f:
                done = json.load(f).get("done", [])
        except Exception:
            done = []
    new = [f"{x}_{y}" for x in range(rng[0], rng[1] + 1) for y in range(rng[2], rng[3] + 1)] if rng else [f"{x}_{y}" for (x, y) in tiles]
    done += [k for k in new if k not in done]
    with open(dpath, "w", encoding="utf8") as f:
        json.dump({"done": done}, f, separators=(",", ":"))
    print(f"Done: {total} places in {len(tiles)} files, saved in: {out}")

if __name__ == "__main__":
    if len(sys.argv) not in (3, 7):
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], [int(v) for v in sys.argv[3:7]] if len(sys.argv) == 7 else None)
