# Database (Supabase project `jsegdbtefxsforphluyc`)

These files were all applied already, in this order. They are kept so the setup can be rebuilt or checked.
The live database is the real state; change it with a new numbered file, never by editing an old one.

Rules in short: visitors can only **add** reviews, reports, photos and new places (with daily and hourly limits).
They can never change or delete anything. The app only reads the `*_public` views and `place_ratings` / `place_flag_counts`.
The editor code is set by the owner in the SQL Editor and is never stored in these files.
