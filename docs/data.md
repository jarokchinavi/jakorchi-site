# Restaurant data (public/places/)
- `<x>_<y>.json` = one zoom-12 map square · `_done.json` = finished squares (the app uses the count as cache version) · empty square = no file = 404 (ok)
- 🇰🇷 Seoul: x3488–3495 y1584–1591 · 62 files · ~59,500 places
- 🇯🇵 Tokyo: bat 4 · Geofabrik kanto · x3634–3641 y1608–1615
- 🇯🇵 Kyoto: bat 5 · Geofabrik kansai · x3590–3595 y1620–1625 · 36 files · 10,817 places
- bat 1 Korea / 2 Japan / 3 China = whole country (big; China needs 8 GB memory)
- build_places.py args: `<pbf> <Country> [x0 x1 y0 y1]` · writes into Desktop jakorchi-site\places and merges `_done.json`
- check new files before pushing: valid JSON · every place inside its own square · area column empty
- 8% of places have a real English name · ~55% have a known food type
