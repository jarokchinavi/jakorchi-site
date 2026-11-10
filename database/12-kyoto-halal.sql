-- 12: five halal places in Kyoto (names and coordinates from the owner; halal status from halal directories).
-- Team places = verified, shown at once. Safe to run twice (skips a place that is already there).
insert into public.new_places (name, lat, lng, cat, cuisine, halal, device, verified)
select v.name, v.lat, v.lng, 'restaurant', v.cuisine, true, 'jakorchi-editor', true
from (values
  ('GYUMON Gion',                       35.0037, 135.7772, ''),
  ('GYUMON Shimogyo',                   34.9968, 135.7628, ''),
  ('GYUMON Nakagyo',                    35.0052, 135.7663, ''),
  ('HALRA',                             35.0058, 135.7705, ''),
  ('HALAL WAGYU RAMEN WAGYUZA KYOTO',   35.0089, 135.7698, 'ramen')
) as v(name, lat, lng, cuisine)
where not exists (select 1 from public.new_places p where p.name = v.name and abs(p.lat - v.lat) < 0.001);
