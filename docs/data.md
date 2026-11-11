# Restaurant data (public/places/)
- `<x>_<y>.json` = one zoom-12 map square · `_done.json` = finished squares (the app uses the count as cache version) · empty square = no file = 404 (ok)
- 🇰🇷 Seoul: x3488–3495 y1584–1591 · 62 files · ~59,500 places
- 🇯🇵 Tokyo: bat 4 · Geofabrik kanto · x3634–3641 y1608–1615
- 🇯🇵 Kyoto: bat 5 · Geofabrik kansai · x3590–3595 y1620–1625 · 36 files · 10,817 places
- bat 1 Korea / 2 Japan / 3 China = whole country (big; China needs 8 GB memory)
- build_places.py args: `<pbf> <Country> [x0 x1 y0 y1]` · writes into Desktop jakorchi-site\places and merges `_done.json`
- big squares (> 300 KB, now 13) also exist as 16 small squares each: `places/14/<x>_<y>.json` + `places/_split.json`, made by `tools/split_places.py` (run it after every data change). App: zoom ≥ 15 loads only the small squares on screen (Gangnam: 0.45 MB instead of 5.5 MB), zoomed out the whole file. The Desktop backup does not hold `places/14` (it is rebuilt by the tool).
- check new files before pushing: valid JSON · every place inside its own square · area column empty
- 8% of places have a real English name · ~55% have a known food type

## Tidy names (2026-11-10)
`python tools/clean_names.py` (before `split_places.py`): removes hidden characters and odd spaces, trims, Title Case for all-lowercase Latin names. It never changes spelling (a shop name is the shop's own). Run it after every new restaurant import.
## Halal data and duplicates (2026-11-10)
- Halal comes from OSM tags `diet:halal` (yes/only = 1, limited = 2), also `halal`, `diet:muslim`, cuisine halal/muslim. Only ~44 places in Kanto/Kansai/Seoul data have it.
- `make-restaurants.bat` reuses a country file younger than 7 days, downloads a fresh one when older, and writes date + SHA-256 to `downloads-log.txt`.
- Navigate links use exact coordinates (no place_id). OSM `note`/`comment` tags are mapper notes, not reviews: not shown.
- KTO Muslim-friendly list (Halal Certified / Self-Certified / Muslim Friendly / Pork Free) is not published as open data (only on visitkorea.or.kr): not copied.
