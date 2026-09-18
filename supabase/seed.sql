-- Campus Wide seed: the Illinois Tech pilot tenant and its verified email domains.
-- Runs on `supabase db reset` (local/CI). Production seeding uses the same statements via the admin script.

insert into public.universities (id, slug, name, short_name, country, timezone, status, feature_flags, safe_exchange_locations, accent_hue)
values (
  '11111111-1111-4111-8111-111111111111',
  'illinois-tech',
  'Illinois Institute of Technology',
  'Illinois Tech',
  'US',
  'America/Chicago',
  'active',
  '{"meals": false, "market": true, "rides": true, "lost_found": true, "events": true, "questions": true, "study": true, "roommates": true, "polls": true}'::jsonb,
  '[
    {"name": "McCormick Tribune Campus Center, Welcome Desk", "note": "Staffed public lobby on Mies Campus", "campus": "Mies Campus"},
    {"name": "Tech Central lobby (Public Safety, Suite 115)", "note": "3424 S. State St.; Public Safety headquarters", "campus": "Mies Campus"},
    {"name": "Paul V. Galvin Library entrance", "note": "Public, staffed, daytime", "campus": "Mies Campus"}
  ]'::jsonb,
  '355'
)
on conflict (slug) do update set name = excluded.name, short_name = excluded.short_name, status = excluded.status;

-- Dining locations (dineoncampus.com/iit, 2026-09-17). Only The Commons accepts guest meals.
update public.universities set dining_locations = '[
  {"slug": "commons", "name": "The Commons", "building": "McCormick Tribune Campus Center", "kind": "residential", "guest_meals": true,
   "periods": [{"name": "Breakfast", "start": "07:30", "end": "09:30", "days": "Mon-Fri"}, {"name": "Lunch", "start": "11:00", "end": "13:45", "days": "Mon-Fri"}, {"name": "Dinner", "start": "16:30", "end": "20:30", "days": "Mon-Fri"}, {"name": "Weekend", "start": "08:30", "end": "20:30", "days": "Sat-Sun"}]},
  {"slug": "center-court", "name": "Center Court", "building": "McCormick Tribune Campus Center", "kind": "retail", "guest_meals": false},
  {"slug": "global-grounds", "name": "Global Grounds", "building": "McCormick Tribune Campus Center", "kind": "cafe", "guest_meals": false},
  {"slug": "anderson-cafe", "name": "John + Pat Anderson''s Café", "building": "Kaplan Institute", "kind": "cafe", "guest_meals": false},
  {"slug": "the-bog", "name": "The Bog", "building": "Hermann Hall", "kind": "retail", "guest_meals": false},
  {"slug": "tech-yeah", "name": "Tech Yeah Market", "building": "McCormick Tribune Campus Center", "kind": "mobile-order", "guest_meals": false}
]'::jsonb,
policy_text = jsonb_build_object(
  'meals', 'Guest meals belong to All Access plans (10 per semester) and can only be used at The Commons with the plan holder present at the register. The HawkCard is non-transferable: never lend it, share a PIN, or accept anything in return. Offers here are gifts between students; nothing is bought, sold, or traded.',
  'meals_contract', '2026-27 License Agreement, Section F: the dining card is property of Illinois Tech, non-transferable; unauthorized use may cost housing privileges. Signature clause: the Dining program is for the student''s own use and no portion may be used by any other person. Guest meal swipes are sold by the plan to treat a friend or family member. Dining periods: 9 Aug–12 Dec 2026 and 7 Jan–8 May 2027; no service 13 Dec–6 Jan.',
  'meals_authorization', 'pending: written confirmation from the Office of Residential Life (housing@illinoistech.edu) that guest meal swipes may be used for a fellow student met on the board, holder present.'
)
where slug = 'illinois-tech';

insert into public.university_domains (university_id, domain, hosted_domain, role, verified, source) values
  ('11111111-1111-4111-8111-111111111111', 'hawk.illinoistech.edu', 'illinoistech.edu', 'student', true, 'seed'),
  ('11111111-1111-4111-8111-111111111111', 'hawk.iit.edu',          'illinoistech.edu', 'student', true, 'seed'),
  ('11111111-1111-4111-8111-111111111111', 'illinoistech.edu',      'illinoistech.edu', 'staff',   true, 'seed'),
  ('11111111-1111-4111-8111-111111111111', 'iit.edu',               'illinoistech.edu', 'staff',   true, 'seed')
on conflict (domain) do update set role = excluded.role, verified = excluded.verified;

-- Platform policy versions are inserted by the policy sync script in Phase 7; the safety rules
-- acknowledgement is required from Phase 2 onwards.
insert into public.policy_versions (slug, version, title, summary, content_path, content_hash, required)
values ('safety-rules', '2026-09-17', 'House rules and safety', 'What you agree to before your first post.', 'content/policies/safety-rules.mdx', 'pending', true)
on conflict do nothing;

-- Default spaces for the pilot campus (open groups; members follow them to filter the feed).
insert into public.spaces (university_id, slug, name, description, kind, is_default) values
  ('11111111-1111-4111-8111-111111111111', 'campus', 'Whole campus', 'Everything that does not belong to a smaller group.', 'general', true),
  ('11111111-1111-4111-8111-111111111111', 'residence-halls', 'Residence halls', 'Kacek, Carman, Cunningham, Gunsaulus, McCormick Student Village, Rowe Village.', 'residence', true),
  ('11111111-1111-4111-8111-111111111111', 'commuters', 'Commuters', 'Parking, trains, the 35th Street station, rides.', 'interest', true),
  ('11111111-1111-4111-8111-111111111111', 'international', 'International students', 'Visas, arrivals, phone plans, where to find food from home.', 'interest', true),
  ('11111111-1111-4111-8111-111111111111', 'first-years', 'First-years', 'Everything you were too shy to ask at orientation.', 'interest', true)
on conflict (university_id, slug) do nothing;

-- Meal-sharing terms shown before every meal offer (campus-specific; the text lives in policy_text.meals).
insert into public.policy_versions (university_id, slug, version, title, summary, content_path, content_hash, required)
values ('11111111-1111-4111-8111-111111111111', 'meal-sharing', '2026-09-17', 'Meal treats at The Commons', 'Guest meals only, holder present, nothing sold.', 'content/policies/meal-sharing.mdx', 'pending', true)
on conflict do nothing;
