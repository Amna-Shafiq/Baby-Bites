create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  baby_age_months integer not null check (baby_age_months >= 0),
  baby_date_of_birth date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "users_can_select_own_profile" on public.profiles;
create policy "users_can_select_own_profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_can_insert_own_profile" on public.profiles;
create policy "users_can_insert_own_profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users_can_update_own_profile" on public.profiles;

create policy "users_can_update_own_profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Auto-create profile on signup from auth metadata.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, baby_age_months, baby_date_of_birth)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'baby_age_months')::int, 0),
    coalesce((new.raw_user_meta_data ->> 'baby_date_of_birth')::date, current_date)
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    baby_age_months = excluded.baby_age_months,
    baby_date_of_birth = excluded.baby_date_of_birth,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

-- Favorites table (if not already created)
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, meal_id)
);

alter table public.favorites enable row level security;

drop policy if exists "users_can_manage_own_favorites_select" on public.favorites;

create policy "users_can_manage_own_favorites_select"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users_can_manage_own_favorites_insert" on public.favorites;

create policy "users_can_manage_own_favorites_insert"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_can_manage_own_favorites_delete" on public.favorites;

create policy "users_can_manage_own_favorites_delete"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

-- Common household foods per user (used to bias suggestions).
create table if not exists public.household_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.household_foods enable row level security;

drop policy if exists "users_can_select_own_household_foods" on public.household_foods;

create policy "users_can_select_own_household_foods"
on public.household_foods
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users_can_insert_own_household_foods" on public.household_foods;
create policy "users_can_insert_own_household_foods"
on public.household_foods
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_can_delete_own_household_foods"on public.household_foods;
create policy "users_can_delete_own_household_foods"
on public.household_foods
for delete
to authenticated
using (auth.uid() = user_id);

-- User-created meals that should appear in All Foods / suggestions.
create table if not exists public.custom_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  min_age_months integer not null check (min_age_months >= 0),
  max_age_months integer not null check (max_age_months >= min_age_months),
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner')),
  ingredients text[] not null default '{}',
  steps text not null default '',
  nutrition_highlight text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.custom_meals enable row level security;

drop policy if exists "users_can_select_own_custom_meals"
on public.custom_meals;
create policy "users_can_select_own_custom_meals"
on public.custom_meals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users_can_insert_own_custom_meals"
on public.custom_meals;
create policy "users_can_insert_own_custom_meals"
on public.custom_meals
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_can_update_own_custom_meals"
on public.custom_meals;
create policy "users_can_update_own_custom_meals"
on public.custom_meals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_can_delete_own_custom_meals"
on public.custom_meals;
create policy "users_can_delete_own_custom_meals"
on public.custom_meals
for delete
to authenticated
using (auth.uid() = user_id);

-- Daily meal logs; used to avoid repeats in next-day recommendations.
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null default current_date,
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner')),
  meal_source text not null check (meal_source in ('built_in', 'custom')),
  built_in_meal_id integer,
  custom_meal_id uuid references public.custom_meals(id) on delete set null,
  meal_title text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_logs_user_date on public.meal_logs(user_id, meal_date);

alter table public.meal_logs enable row level security;

drop policy if exists "users_can_select_own_meal_logs"
on public.meal_logs;
create policy "users_can_select_own_meal_logs"
on public.meal_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users_can_insert_own_meal_logs"
on public.meal_logs;
create policy "users_can_insert_own_meal_logs"
on public.meal_logs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_can_delete_own_meal_logs"
on public.meal_logs;
create policy "users_can_delete_own_meal_logs"
on public.meal_logs
for delete
to authenticated
using (auth.uid() = user_id);

-- Foods catalog (ingredients-level, not meals).
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  safe_from_months integer not null check (safe_from_months >= 0),
  is_iron_rich boolean not null default false,
  food_group text not null check (food_group in ('grain', 'veggie', 'fruit', 'protein')),
  allergen_notes text,
  texture_tips text,
  created_at timestamptz not null default now()
);

alter table public.foods enable row level security;

drop policy if exists "foods_are_readable_by_all_users" on public.foods;
create policy "foods_are_readable_by_all_users"
on public.foods
for select
to authenticated, anon
using (true);

-- Meals table (recipes/combinations).
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  min_age_months integer not null check (min_age_months >= 0),
  max_age_months integer not null check (max_age_months >= min_age_months),
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner')),
  steps text not null default '',
  nutrition_highlight text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meals enable row level security;

drop policy if exists "users_can_read_public_or_own_meals" on public.meals;
create policy "users_can_read_public_or_own_meals"
on public.meals
for select
to authenticated
using (is_public = true or auth.uid() = user_id);

drop policy if exists "users_can_insert_own_meals" on public.meals;
create policy "users_can_insert_own_meals"
on public.meals
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_can_update_own_meals" on public.meals;
create policy "users_can_update_own_meals"
on public.meals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_can_delete_own_meals" on public.meals;
create policy "users_can_delete_own_meals"
on public.meals
for delete
to authenticated
using (auth.uid() = user_id);

-- Join table: one meal can have many foods, one food can belong to many meals.
create table if not exists public.meal_foods (
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete cascade,
  amount_text text,
  primary key (meal_id, food_id)
);

alter table public.meal_foods enable row level security;

drop policy if exists "users_can_read_meal_foods_for_visible_meals" on public.meal_foods;
create policy "users_can_read_meal_foods_for_visible_meals"
on public.meal_foods
for select
to authenticated
using (
  exists (
    select 1
    from public.meals m
    where m.id = meal_foods.meal_id
      and (m.is_public = true or m.user_id = auth.uid())
  )
);

drop policy if exists "users_can_insert_meal_foods_for_own_meals" on public.meal_foods;
create policy "users_can_insert_meal_foods_for_own_meals"
on public.meal_foods
for insert
to authenticated
with check (
  exists (
    select 1
    from public.meals m
    where m.id = meal_foods.meal_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "users_can_delete_meal_foods_for_own_meals" on public.meal_foods;
create policy "users_can_delete_meal_foods_for_own_meals"
on public.meal_foods
for delete
to authenticated
using (
  exists (
    select 1
    from public.meals m
    where m.id = meal_foods.meal_id
      and m.user_id = auth.uid()
  )
);

-- Optional starter food rows.
insert into public.foods (name, safe_from_months, is_iron_rich, food_group, allergen_notes, texture_tips)
values
  ('Rice', 6, false, 'grain', null, 'Serve soft and well-cooked.'),
  ('Carrot', 6, false, 'veggie', null, 'Steam/boil and mash for early stages.'),
  ('Lentil', 6, true, 'protein', null, 'Cook until very soft and mash well.'),
  ('Banana', 6, false, 'fruit', null, 'Mash until lump-free for beginners.')
on conflict (name) do nothing;

-- ============================================================
-- Baby Bites — enrich_foods.sql
-- Fills in texture_tips and allergen_notes for all 80 foods
-- Safe to run multiple times — only updates matching names
-- Paste into Supabase SQL editor and run
-- ============================================================

-- ── GRAINS ──────────────────────────────────────────────────
UPDATE public.foods SET
  texture_tips = 'Cook until very soft, blend smooth for 4-6m. Leave slightly lumpy at 8m+.',
  allergen_notes = null
WHERE name = 'Oatmeal';

UPDATE public.foods SET
  texture_tips = 'Cook rice until very soft and watery. Blend smooth for early stages, thicken gradually.',
  allergen_notes = null
WHERE name = 'Rice Porridge';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft. Blend smooth for 6m, leave slightly textured at 8m+.',
  allergen_notes = null
WHERE name = 'Barley Porridge';

UPDATE public.foods SET
  texture_tips = 'Cook into a smooth porridge. Thin with breast milk or formula for younger babies.',
  allergen_notes = null
WHERE name = 'Millet Porridge';

UPDATE public.foods SET
  texture_tips = 'Cook well and mash or blend. Mix with veggies or fruit for flavor at 8m+.',
  allergen_notes = null
WHERE name = 'Quinoa';

UPDATE public.foods SET
  texture_tips = 'Remove crusts, cut into small soft pieces. Only offer once baby can handle soft lumps.',
  allergen_notes = 'Contains gluten — introduce carefully and watch for reactions.'
WHERE name = 'Soft White Bread';

UPDATE public.foods SET
  texture_tips = 'Cook into a thick porridge. Blend smooth for 8m, leave some texture at 10m+.',
  allergen_notes = 'Contains gluten — introduce gradually.'
WHERE name = 'Whole Wheat Porridge';

UPDATE public.foods SET
  texture_tips = 'Mix with warm water or milk to a lump-free paste. Thicken as baby grows.',
  allergen_notes = 'Contains gluten — monitor for sensitivity.'
WHERE name = 'Semolina Porridge';

UPDATE public.foods SET
  texture_tips = 'Cook into a smooth porridge. Naturally sweet — no added sugar needed.',
  allergen_notes = null
WHERE name = 'Cornmeal Porridge';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft and mashable. Cut into tiny pieces at 10m+ for self-feeding.',
  allergen_notes = 'Contains gluten — introduce after other grains are tolerated.'
WHERE name = 'Soft Pasta';

UPDATE public.foods SET
  texture_tips = 'Mix with warm water or breast milk into a smooth porridge. Great iron-rich first food.',
  allergen_notes = null
WHERE name = 'Ragi (Finger Millet)';

UPDATE public.foods SET
  texture_tips = 'Ensure very soft texture — dissolves easily. Avoid hard or puffed varieties early on.',
  allergen_notes = null
WHERE name = 'Soft Rice Cake';

UPDATE public.foods SET
  texture_tips = 'Cook into a smooth porridge. Naturally nutty flavor — pairs well with apple or pear puree.',
  allergen_notes = null
WHERE name = 'Buckwheat Porridge';

UPDATE public.foods SET
  texture_tips = 'Tear into very small soft pieces. Only offer once baby handles soft lumps confidently.',
  allergen_notes = 'Contains gluten — introduce after simpler grains first.'
WHERE name = 'Soft Chapati';

UPDATE public.foods SET
  texture_tips = 'Only offer at 10m+ when baby has good pincer grasp. Ensure pieces dissolve easily.',
  allergen_notes = null
WHERE name = 'Puffed Rice';

-- ── VEGETABLES ──────────────────────────────────────────────
UPDATE public.foods SET
  texture_tips = 'Steam and blend smooth for 4-6m. Mash with a fork at 8m. Soft cubes at 10m+.',
  allergen_notes = null
WHERE name = 'Sweet Potato';

UPDATE public.foods SET
  texture_tips = 'Steam or boil until very soft. Blend smooth for early stages, mash at 8m+.',
  allergen_notes = null
WHERE name = 'Carrot';

UPDATE public.foods SET
  texture_tips = 'Roast or steam and blend smooth. Naturally sweet — great first vegetable.',
  allergen_notes = null
WHERE name = 'Butternut Squash';

UPDATE public.foods SET
  texture_tips = 'Steam and puree smooth. Thin with water or breast milk for younger babies.',
  allergen_notes = null
WHERE name = 'Pumpkin';

UPDATE public.foods SET
  texture_tips = 'Blend thoroughly — pea skins can be a texture issue. Press through a sieve for 6m.',
  allergen_notes = null
WHERE name = 'Peas';

UPDATE public.foods SET
  texture_tips = 'Steam and blend smooth. Always blend well — strings can be a choking hazard.',
  allergen_notes = null
WHERE name = 'Spinach';

UPDATE public.foods SET
  texture_tips = 'Steam florets until very soft. Blend smooth for 6m, mash or cut small at 9m+.',
  allergen_notes = null
WHERE name = 'Broccoli';

UPDATE public.foods SET
  texture_tips = 'Steam until very soft and blend smooth. Mild flavor pairs well with sweet potato.',
  allergen_notes = null
WHERE name = 'Cauliflower';

UPDATE public.foods SET
  texture_tips = 'Steam or sauté until very soft. Blend for 6m or mash — naturally mild and easy to digest.',
  allergen_notes = null
WHERE name = 'Zucchini';

UPDATE public.foods SET
  texture_tips = 'Steam until very soft. Blend or mash well — remove any tough skins or strings.',
  allergen_notes = null
WHERE name = 'Green Beans';

UPDATE public.foods SET
  texture_tips = 'Boil until very soft and mash or blend. Plain with no salt — skins removed for early stages.',
  allergen_notes = null
WHERE name = 'Potato';

UPDATE public.foods SET
  texture_tips = 'Peel, steam until very soft and blend smooth. Slightly sweet, great for mixing.',
  allergen_notes = null
WHERE name = 'Parsnip';

UPDATE public.foods SET
  texture_tips = 'Roast or steam and blend smooth. Introduce after 8m — high nitrate content.',
  allergen_notes = null
WHERE name = 'Beetroot';

UPDATE public.foods SET
  texture_tips = 'Steam and blend smooth. Strong flavor — mix with sweet potato or apple to soften.',
  allergen_notes = null
WHERE name = 'Kale';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft and scrape kernels off the cob. Blend smooth — never serve whole kernels.',
  allergen_notes = null
WHERE name = 'Corn';

UPDATE public.foods SET
  texture_tips = 'Steam until very soft and blend smooth. Mild flavor, easy to mix with other veggies.',
  allergen_notes = null
WHERE name = 'Cabbage';

UPDATE public.foods SET
  texture_tips = 'Peel and remove seeds. Serve grated or in thin soft strips at 8m+. Never hard chunks.',
  allergen_notes = null
WHERE name = 'Cucumber';

UPDATE public.foods SET
  texture_tips = 'Peel, remove seeds, and blend or mash. Cook briefly to soften for early stages.',
  allergen_notes = null
WHERE name = 'Tomato';

UPDATE public.foods SET
  texture_tips = 'Roast or steam until very soft. Blend or cut into tiny pieces — remove skin.',
  allergen_notes = null
WHERE name = 'Bell Pepper';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft and blend smooth. Remove skin and seeds before pureeing.',
  allergen_notes = null
WHERE name = 'Eggplant';

-- ── FRUITS ──────────────────────────────────────────────────
UPDATE public.foods SET
  texture_tips = 'Mash with a fork until smooth for 4-6m. Soft mashed pieces fine at 8m+.',
  allergen_notes = null
WHERE name = 'Banana';

UPDATE public.foods SET
  texture_tips = 'Peel, core, steam and blend smooth for 4m. Grated raw apple fine at 10m+.',
  allergen_notes = null
WHERE name = 'Apple';

UPDATE public.foods SET
  texture_tips = 'Peel, core, steam if firm. Very ripe pears can be mashed raw. Blend smooth for 4m.',
  allergen_notes = null
WHERE name = 'Pear';

UPDATE public.foods SET
  texture_tips = 'Mash with a fork — ripe avocado needs no cooking. Serve immediately to avoid browning.',
  allergen_notes = null
WHERE name = 'Avocado';

UPDATE public.foods SET
  texture_tips = 'Peel, remove seed, and blend smooth. Very ripe mango can be mashed directly.',
  allergen_notes = null
WHERE name = 'Mango';

UPDATE public.foods SET
  texture_tips = 'Remove seeds and blend smooth. Naturally soft — easy first fruit for 6m.',
  allergen_notes = null
WHERE name = 'Papaya';

UPDATE public.foods SET
  texture_tips = 'Peel and remove pit. Blend smooth for 6m. Very ripe peaches can be mashed.',
  allergen_notes = null
WHERE name = 'Peach';

UPDATE public.foods SET
  texture_tips = 'Peel, remove pit and blend smooth. Naturally helps with digestion.',
  allergen_notes = null
WHERE name = 'Plum';

UPDATE public.foods SET
  texture_tips = 'Peel, remove pit and blend smooth. Choose very ripe for easiest pureeing.',
  allergen_notes = null
WHERE name = 'Apricot';

UPDATE public.foods SET
  texture_tips = 'Mash or blend at 8m. At 10m+ halve or quarter — whole berries are a choking hazard.',
  allergen_notes = null
WHERE name = 'Blueberry';

UPDATE public.foods SET
  texture_tips = 'Mash or blend smooth. Remove hulls. Quarter at 10m+ for finger food.',
  allergen_notes = 'Mild allergen in some babies — introduce slowly and watch for rash or hives.'
WHERE name = 'Strawberry';

UPDATE public.foods SET
  texture_tips = 'Remove rind and seeds. Blend or mash — very soft and hydrating. Cut small at 10m+.',
  allergen_notes = null
WHERE name = 'Watermelon';

UPDATE public.foods SET
  texture_tips = 'Peel and blend or mash well. Tart flavor — mix with banana to balance.',
  allergen_notes = 'Can cause oral allergy or skin reaction in some babies — introduce carefully.'
WHERE name = 'Kiwi';

UPDATE public.foods SET
  texture_tips = 'Remove rind and seeds. Blend or mash smooth. Very soft and easy for early eaters.',
  allergen_notes = null
WHERE name = 'Melon';

UPDATE public.foods SET
  texture_tips = 'Peel and remove seeds. Blend smooth — high in fiber and vitamin C.',
  allergen_notes = null
WHERE name = 'Guava';

UPDATE public.foods SET
  texture_tips = 'Blend smooth or serve as puree. Great for constipation — naturally laxative.',
  allergen_notes = null
WHERE name = 'Prune';

UPDATE public.foods SET
  texture_tips = 'Remove skin and seeds, steam if firm, then blend smooth. Very sweet — use sparingly.',
  allergen_notes = null
WHERE name = 'Fig';

UPDATE public.foods SET
  texture_tips = 'Use fresh coconut flesh blended smooth or coconut cream thinned with water.',
  allergen_notes = 'Classified as a tree nut by FDA — introduce carefully if nut allergies are a concern.'
WHERE name = 'Coconut';

UPDATE public.foods SET
  texture_tips = 'Only introduce at 10m+ — acidity can irritate younger babies. Offer as juice diluted 1:1.',
  allergen_notes = null
WHERE name = 'Orange';

UPDATE public.foods SET
  texture_tips = 'Peel, remove seeds and halve or quarter at 10m+. Whole grapes are a serious choking hazard.',
  allergen_notes = null
WHERE name = 'Grape';

-- ── PROTEINS ────────────────────────────────────────────────
UPDATE public.foods SET
  texture_tips = 'Cook until very soft and blend smooth. Thin with water or breast milk for 6m.',
  allergen_notes = null
WHERE name = 'Lentils';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft, remove skins, and blend smooth. Mash at 10m+.',
  allergen_notes = null
WHERE name = 'Chickpeas';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft, blend smooth. Skins should be removed or blended thoroughly.',
  allergen_notes = null
WHERE name = 'Black Beans';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft, remove skins and blend smooth. Mash at 10m+.',
  allergen_notes = null
WHERE name = 'Kidney Beans';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft and blend into a smooth dal. Easy to digest and great first protein.',
  allergen_notes = null
WHERE name = 'Mung Beans';

UPDATE public.foods SET
  texture_tips = 'Use soft silken tofu — mash directly. Firm tofu should be cut into soft small cubes at 10m+.',
  allergen_notes = 'Contains soy — a top-8 allergen. Introduce slowly and watch for reactions.'
WHERE name = 'Tofu';

UPDATE public.foods SET
  texture_tips = 'Blend cooked chicken with broth until completely smooth. No chunks for under 9m.',
  allergen_notes = null
WHERE name = 'Pureed Chicken';

UPDATE public.foods SET
  texture_tips = 'Blend cooked turkey with a little broth until very smooth. Mild flavor babies enjoy.',
  allergen_notes = null
WHERE name = 'Pureed Turkey';

UPDATE public.foods SET
  texture_tips = 'Blend cooked lean beef with broth until smooth. Great iron source — worth the effort.',
  allergen_notes = null
WHERE name = 'Pureed Beef';

UPDATE public.foods SET
  texture_tips = 'Blend cooked lamb with broth until smooth. Rich flavor — mix with sweet potato or pea.',
  allergen_notes = null
WHERE name = 'Pureed Lamb';

UPDATE public.foods SET
  texture_tips = 'Steam and blend with a little water until smooth. Remove all bones and skin first.',
  allergen_notes = 'Fish allergen — introduce carefully and watch for reaction.'
WHERE name = 'Pureed Salmon';

UPDATE public.foods SET
  texture_tips = 'Blend with water until smooth. Limit to once a week due to mercury content.',
  allergen_notes = 'Fish allergen — introduce carefully. Limit frequency due to mercury levels.'
WHERE name = 'Pureed Tuna';

UPDATE public.foods SET
  texture_tips = 'Cook until soft and moist — never dry or rubbery. Scramble with no salt or butter.',
  allergen_notes = 'Egg is a top-8 allergen — introduce a small amount and wait 3 days before more.'
WHERE name = 'Scrambled Egg';

UPDATE public.foods SET
  texture_tips = 'Serve full-fat plain variety. Start with a small spoonful — no sweetened or flavored kinds.',
  allergen_notes = 'Contains dairy — a top-8 allergen. Introduce slowly and watch for reactions.'
WHERE name = 'Greek Yogurt';

UPDATE public.foods SET
  texture_tips = 'Serve as-is or mash into other foods. Full-fat variety only for babies.',
  allergen_notes = 'Contains dairy — introduce after other dairy products are tolerated.'
WHERE name = 'Cottage Cheese';

UPDATE public.foods SET
  texture_tips = 'Thin with warm water or breast milk to a very loose, runny consistency. Never serve thick.',
  allergen_notes = 'Peanut is a top-8 allergen — early introduction (6m) is now recommended by AAP to reduce allergy risk.'
WHERE name = 'Peanut Butter Puree';

UPDATE public.foods SET
  texture_tips = 'Thin with warm water to a runny paste — same consistency as peanut butter puree.',
  allergen_notes = null
WHERE name = 'Sunflower Seed Butter';

UPDATE public.foods SET
  texture_tips = 'Cut into very small soft cubes or crumble. Full-fat only — never low-fat for babies.',
  allergen_notes = 'Contains dairy — introduce after other dairy is tolerated.'
WHERE name = 'Soft Paneer';

UPDATE public.foods SET
  texture_tips = 'Cook until very soft and blend smooth. Thin with water for younger babies.',
  allergen_notes = null
WHERE name = 'Split Pea Puree';

UPDATE public.foods SET
  texture_tips = 'Blend shelled edamame until completely smooth — skins must be fully blended or removed.',
  allergen_notes = 'Contains soy — a top-8 allergen. Introduce slowly and watch for reactions.'
WHERE name = 'Edamame Puree';

-- ── YOUR ORIGINAL 4 ROWS (added manually earlier) ───────────
UPDATE public.foods SET
  texture_tips = 'Cook until very soft and blend smooth or mash well. Thin with water for 6m.',
  allergen_notes = null
WHERE name = 'Rice' AND texture_tips IS NULL;

UPDATE public.foods SET
  texture_tips = 'Steam or boil until fork-tender. Blend smooth for 6m, soft sticks at 9m+ for BLW.',
  allergen_notes = null
WHERE name = 'Carrot' AND texture_tips IS NULL;

UPDATE public.foods SET
  texture_tips = 'Cook until very soft and mash or blend smooth. Thin with water or breast milk.',
  allergen_notes = null
WHERE name = 'Lentil' AND texture_tips IS NULL;

UPDATE public.foods SET
  texture_tips = 'Mash ripe banana with a fork until completely smooth. No cooking needed.',
  allergen_notes = null
WHERE name = 'Banana' AND texture_tips IS NULL;

-- Add image_url column if you haven't already
ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ── GRAINS ──────────────────────────────────────────────────
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/rolled-oats.jpg' WHERE name = 'Oatmeal';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Rice Porridge';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Rice';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1555078604-b2379f0e964a?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Barley Porridge';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/millet-dry.jpg' WHERE name = 'Millet Porridge';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/quinoa.jpg' WHERE name = 'Quinoa';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/white-bread.jpg' WHERE name = 'Soft White Bread';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/flour.jpg' WHERE name = 'Whole Wheat Porridge';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/flour.jpg' WHERE name = 'Semolina Porridge';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/cornmeal.jpg' WHERE name = 'Cornmeal Porridge';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/spaghetti.jpg' WHERE name = 'Soft Pasta';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/flour.jpg' WHERE name = 'Ragi (Finger Millet)';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/rice-cakes.jpg' WHERE name = 'Soft Rice Cake';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1589899476489-2b5e3e2b323f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Buckwheat Porridge';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/pita-bread.jpg' WHERE name = 'Soft Chapati';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/rice-cakes.jpg' WHERE name = 'Puffed Rice';

-- ── VEGETABLES ──────────────────────────────────────────────
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/sweet-potato.jpg' WHERE name = 'Sweet Potato';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/carrots.jpg' WHERE name = 'Carrot';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/butternut-squash.jpg' WHERE name = 'Butternut Squash';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/pumpkin.jpg' WHERE name = 'Pumpkin';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/peas.jpg' WHERE name = 'Peas';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/spinach.jpg' WHERE name = 'Spinach';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1685504445355-0e7bdf90d415?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Broccoli';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/cauliflower.jpg' WHERE name = 'Cauliflower';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/zucchini.jpg' WHERE name = 'Zucchini';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1574963835594-61eede2070dc?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Green Beans';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/potatoes-yukon-gold.jpg' WHERE name = 'Potato';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1648291913186-951f2ef36c85?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Parsnip';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/beets.jpg' WHERE name = 'Beetroot';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/kale.jpg' WHERE name = 'Kale';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/corn-on-the-cob.jpg' WHERE name = 'Corn';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/cabbage.jpg' WHERE name = 'Cabbage';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/cucumber.jpg' WHERE name = 'Cucumber';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/tomato.jpg' WHERE name = 'Tomato';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Bell Pepper';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/eggplant.jpg' WHERE name = 'Eggplant';

-- ── FRUITS ──────────────────────────────────────────────────
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/bananas.jpg' WHERE name = 'Banana';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/apple.jpg' WHERE name = 'Apple';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/pear.jpg' WHERE name = 'Pear';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/avocado.jpg' WHERE name = 'Avocado';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/mango.jpg' WHERE name = 'Mango';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/papaya.jpg' WHERE name = 'Papaya';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1629828874514-c1e5103f2150?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Peach';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1564750497011-ead0ce4b9448?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Plum';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/apricot.jpg' WHERE name = 'Apricot';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/blueberries.jpg' WHERE name = 'Blueberry';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/strawberries.jpg' WHERE name = 'Strawberry';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/watermelon.jpg' WHERE name = 'Watermelon';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/kiwi.jpg' WHERE name = 'Kiwi';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/cantaloupe.jpg' WHERE name = 'Melon';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/guava.jpg' WHERE name = 'Guava';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/prunes.jpg' WHERE name = 'Prune';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1601379760591-1d89ae6ee1b7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Fig';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/coconut.jpg' WHERE name = 'Coconut';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/orange.jpg' WHERE name = 'Orange';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1596363505729-4190a9506133?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Grape';

-- ── PROTEINS ────────────────────────────────────────────────
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1612869538502-b5baa439abd7?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Lentils';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1612869538502-b5baa439abd7?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Lentil';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/chickpeas.jpg' WHERE name = 'Chickpeas';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/black-beans.jpg' WHERE name = 'Black Beans';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/kidney-beans.jpg' WHERE name = 'Kidney Beans';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/mung-beans.jpg' WHERE name = 'Mung Beans';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/tofu.jpg' WHERE name = 'Tofu';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/rotisserie-chicken.jpg' WHERE name = 'Pureed Chicken';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1606728035253-49e8a23146de?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Pureed Turkey';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/beef-cubes-raw.jpg' WHERE name = 'Pureed Beef';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/lamb-chops.jpg' WHERE name = 'Pureed Lamb';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/salmon.jpg' WHERE name = 'Pureed Salmon';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1674063765936-d032795f4e1e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Pureed Tuna';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/egg.jpg' WHERE name = 'Scrambled Egg';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/plain-yogurt.jpg' WHERE name = 'Greek Yogurt';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/cottage-cheese.jpg' WHERE name = 'Cottage Cheese';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/peanut-butter.jpg' WHERE name = 'Peanut Butter Puree';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/sunflower-seeds.jpg' WHERE name = 'Sunflower Seed Butter';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Soft Paneer';
UPDATE public.foods SET image_url = 'https://images.unsplash.com/photo-1696306702543-e3db6d775297?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Split Pea Puree';
UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/edamame.jpg' WHERE name = 'Edamame Puree';


UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/kiwi.png' WHERE name = 'Kiwi';

UPDATE public.foods SET image_url = 'https://spoonacular.com/cdn/ingredients_100x100/millet.jpg' WHERE name = 'Millet Porridge';

DROP TABLE IF EXISTS public.meal_foods CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;

-- ── 2. CREATE NEW MEALS TABLE ───────────────────────────────
CREATE TABLE public.meals (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
 
  title               TEXT        NOT NULL,
  description         TEXT        NOT NULL DEFAULT '',
 
  -- Age range
  min_age_months      INTEGER     NOT NULL CHECK (min_age_months >= 0),
  max_age_months      INTEGER     NOT NULL CHECK (max_age_months >= min_age_months),
 
  -- When to serve (expanded)
  meal_slot           TEXT        NOT NULL CHECK (meal_slot IN (
                                    'breakfast', 'lunch', 'dinner', 'snack'
                                  )),
 
  -- Quick vs Fancy
  meal_type           TEXT        NOT NULL CHECK (meal_type IN (
                                    'quick', 'fancy'
                                  )),
 
  -- Prep info
  prep_time_minutes   INTEGER     NOT NULL DEFAULT 10,
  steps               TEXT        NOT NULL DEFAULT '',
  nutrition_highlight TEXT        NOT NULL DEFAULT '',
 
  -- Visibility
  is_public           BOOLEAN     NOT NULL DEFAULT TRUE,
 
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
 
-- ── 3. CREATE MEAL_FOODS JOIN TABLE ─────────────────────────
-- Links meals to your existing foods table
-- This powers ingredient-based filtering
CREATE TABLE public.meal_foods (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id   UUID    NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id   UUID    NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  quantity  TEXT    NOT NULL DEFAULT '',   -- e.g. "1 cup", "2 tbsp", "half"
  UNIQUE (meal_id, food_id)
);
 
 
-- ── 4. INDEXES ───────────────────────────────────────────────
CREATE INDEX idx_meals_meal_slot     ON public.meals(meal_slot);
CREATE INDEX idx_meals_meal_type     ON public.meals(meal_type);
CREATE INDEX idx_meals_min_age       ON public.meals(min_age_months);
CREATE INDEX idx_meals_is_public     ON public.meals(is_public);
CREATE INDEX idx_meal_foods_meal_id  ON public.meal_foods(meal_id);
CREATE INDEX idx_meal_foods_food_id  ON public.meal_foods(food_id);
 
 
-- ── 5. RLS ───────────────────────────────────────────────────
ALTER TABLE public.meals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_foods ENABLE ROW LEVEL SECURITY;
 
-- Anyone can read public meals
CREATE POLICY "Public meals are readable by everyone"
  ON public.meals FOR SELECT USING (is_public = true);
 
-- Anyone can read meal_foods for public meals
CREATE POLICY "Public meal_foods readable"
  ON public.meal_foods FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE meals.id = meal_foods.meal_id AND meals.is_public = true
    )
  );
 INSERT INTO public.meals
  (title, description, min_age_months, max_age_months, meal_slot, meal_type, prep_time_minutes, steps, nutrition_highlight, is_public)
VALUES
 
-- ── BREAKFAST / QUICK ───────────────────────────────────────
('Banana Oatmeal Mash',
 'Creamy oatmeal mashed with ripe banana — a perfect iron-rich first breakfast.',
 4, 8, 'breakfast', 'quick', 5,
 '1. Cook oats with water until very soft.\n2. Mash ripe banana separately.\n3. Mix together and thin with breast milk if needed.',
 'Iron from oats, potassium from banana', true),
 
('Sweet Potato Porridge',
 'Smooth sweet potato blended into warm rice porridge.',
 4, 8, 'breakfast', 'quick', 10,
 '1. Steam sweet potato until soft.\n2. Cook rice porridge until thick.\n3. Blend both together until smooth.',
 'Vitamin A, fiber, slow-release energy', true),
 
('Mango Yogurt Bowl',
 'Full-fat yogurt swirled with fresh mango puree.',
 8, 18, 'breakfast', 'quick', 5,
 '1. Puree ripe mango.\n2. Spoon yogurt into bowl.\n3. Swirl mango puree on top.',
 'Calcium, probiotics, vitamin C', true),
 
('Avocado Banana Smash',
 'Two superfoods mashed together for a creamy, nutrient-dense breakfast.',
 6, 12, 'breakfast', 'quick', 3,
 '1. Mash ripe avocado with a fork.\n2. Mash banana separately.\n3. Combine and serve immediately.',
 'Healthy fats, potassium, natural energy', true),
 
('Scrambled Egg with Soft Toast',
 'Soft scrambled egg served with small pieces of soft bread.',
 8, 18, 'breakfast', 'quick', 7,
 '1. Whisk egg with a splash of milk.\n2. Cook on low heat stirring constantly until soft.\n3. Serve with small torn pieces of soft bread.',
 'Protein, choline, iron', true),
 
('Pear and Oatmeal Puree',
 'Smooth oatmeal sweetened naturally with ripe pear.',
 4, 8, 'breakfast', 'quick', 8,
 '1. Cook oats until very soft.\n2. Peel and steam pear until tender.\n3. Blend together until smooth.',
 'Iron, fiber, vitamin C', true),
 
('Apple Cinnamon Porridge',
 'Warm oatmeal with stewed apple and a tiny pinch of cinnamon.',
 6, 14, 'breakfast', 'quick', 10,
 '1. Peel and dice apple, cook in a little water until soft.\n2. Cook oatmeal until thick.\n3. Mix together with a tiny pinch of cinnamon.',
 'Iron, fiber, antioxidants', true),
 
('Millet Banana Porridge',
 'Smooth millet porridge blended with ripe banana.',
 6, 12, 'breakfast', 'quick', 10,
 '1. Cook millet with water until soft.\n2. Mash banana into the warm porridge.\n3. Thin with breast milk if needed.',
 'Iron, B vitamins, potassium', true),
 
-- ── BREAKFAST / FANCY ───────────────────────────────────────
('Mini Banana Pancakes',
 'Soft two-ingredient pancakes made from banana and egg.',
 8, 18, 'breakfast', 'fancy', 15,
 '1. Mash one ripe banana thoroughly.\n2. Mix in one beaten egg.\n3. Cook small spoonfuls in a non-stick pan on low heat.\n4. Flip when bubbles form, cook 1 more minute.',
 'Protein, potassium, natural sweetness', true),
 
('Blueberry Oat Bake',
 'Soft baked oatmeal squares packed with blueberries.',
 8, 18, 'breakfast', 'fancy', 25,
 '1. Mix oats, mashed banana, and blueberries.\n2. Press into a greased baking dish.\n3. Bake at 180°C for 20 minutes until set.\n4. Cool and cut into small squares.',
 'Iron, antioxidants, fiber', true),
 
('Veggie Egg Muffins',
 'Mini baked egg cups with soft vegetables hidden inside.',
 10, 18, 'breakfast', 'fancy', 20,
 '1. Dice and steam carrot and peas until soft.\n2. Whisk 2 eggs and mix in vegetables.\n3. Pour into greased mini muffin tin.\n4. Bake at 180°C for 12 minutes.',
 'Protein, iron, vitamin A', true),
 
('Quinoa Fruit Porridge',
 'Creamy cooked quinoa served with pureed peach and pear.',
 8, 18, 'breakfast', 'fancy', 20,
 '1. Cook quinoa with extra water until very soft.\n2. Steam peach and pear until tender.\n3. Blend fruit and stir into quinoa.\n4. Serve warm.',
 'Complete protein, iron, vitamin C', true),
 
-- ── LUNCH / QUICK ────────────────────────────────────────────
('Lentil and Carrot Puree',
 'Classic iron-rich lentil puree with sweet carrot.',
 6, 10, 'lunch', 'quick', 15,
 '1. Boil red lentils until very soft.\n2. Steam carrot until tender.\n3. Blend together with a little cooking water.',
 'Iron, protein, vitamin A', true),
 
('Pea and Potato Mash',
 'Creamy mashed potato mixed with blended peas.',
 6, 12, 'lunch', 'quick', 12,
 '1. Boil potato until soft.\n2. Steam peas.\n3. Mash potato and blend peas separately.\n4. Mix together.',
 'Protein, fiber, vitamin C', true),
 
('Avocado and Banana Rice',
 'Soft cooked rice mixed with mashed avocado and banana.',
 6, 10, 'lunch', 'quick', 10,
 '1. Cook rice until very soft.\n2. Mash avocado and banana together.\n3. Stir into warm rice.',
 'Healthy fats, potassium, energy', true),
 
('Butternut Squash Soup',
 'Silky smooth roasted butternut squash blended to a thick soup.',
 4, 10, 'lunch', 'quick', 15,
 '1. Steam butternut squash until very soft.\n2. Blend until completely smooth.\n3. Thin with water or breast milk to desired consistency.',
 'Vitamin A, fiber, antioxidants', true),
 
('Chicken and Sweet Potato Puree',
 'Iron-rich pureed chicken blended with sweet potato.',
 6, 10, 'lunch', 'quick', 15,
 '1. Steam chicken breast until cooked through.\n2. Steam sweet potato separately.\n3. Blend both together with a little water.',
 'Iron, protein, vitamin A', true),
 
('Spinach and Lentil Dal',
 'Simple iron-packed dal with blended spinach.',
 6, 12, 'lunch', 'quick', 15,
 '1. Cook red lentils until very soft.\n2. Steam spinach and blend smooth.\n3. Mix spinach puree into lentils.',
 'Iron, folate, protein', true),
 
('Tofu and Pumpkin Mash',
 'Silken tofu blended with smooth pumpkin puree.',
 8, 14, 'lunch', 'quick', 10,
 '1. Steam pumpkin until soft and blend.\n2. Mash silken tofu.\n3. Mix together until smooth.',
 'Protein, calcium, vitamin A', true),
 
('Salmon and Potato Puree',
 'Omega-rich salmon blended with creamy mashed potato.',
 6, 12, 'lunch', 'quick', 15,
 '1. Steam salmon fillet until cooked.\n2. Boil potato until soft.\n3. Blend salmon and mash potato, combine.',
 'Omega-3, protein, iron', true),
 
-- ── LUNCH / FANCY ────────────────────────────────────────────
('Mini Lentil Patties',
 'Soft baked lentil patties — great for baby-led weaning.',
 10, 18, 'lunch', 'fancy', 25,
 '1. Mash cooked lentils with cooked carrot.\n2. Form into small flat patties.\n3. Bake at 180°C for 15 minutes, flipping halfway.',
 'Iron, protein, fiber', true),
 
('Baby Chicken Stew',
 'Tender slow-cooked chicken with soft vegetables in a light broth.',
 8, 18, 'lunch', 'fancy', 30,
 '1. Dice chicken and soft vegetables small.\n2. Simmer in water or low-sodium stock for 20 minutes.\n3. Blend partially or serve as soft chunks at 10m+.',
 'Iron, zinc, protein', true),
 
('Soft Veggie Pasta',
 'Overcooked pasta tossed with blended spinach and carrot sauce.',
 10, 18, 'lunch', 'fancy', 20,
 '1. Cook pasta until very soft.\n2. Steam spinach and carrot, blend with a little pasta water.\n3. Toss pasta in the sauce.',
 'Iron, vitamin A, carbohydrates', true),
 
('Egg and Vegetable Frittata',
 'Soft baked frittata with hidden peas and sweet potato.',
 10, 18, 'lunch', 'fancy', 25,
 '1. Steam peas and diced sweet potato until soft.\n2. Whisk 2 eggs and add vegetables.\n3. Cook in an oven-safe pan at 180°C for 15 minutes.',
 'Protein, iron, vitamin A', true),
 
('Beef and Vegetable Puree',
 'Iron-rich pureed beef with carrot, pea, and potato.',
 6, 12, 'lunch', 'fancy', 25,
 '1. Cook lean beef until well done.\n2. Steam carrot, pea, and potato.\n3. Blend all together with cooking liquid.',
 'Iron, zinc, protein, vitamin A', true),
 
('Chickpea and Spinach Stew',
 'Soft chickpeas simmered with spinach in a mild tomato base.',
 10, 18, 'lunch', 'fancy', 20,
 '1. Cook chickpeas until very soft.\n2. Blend spinach with a little water.\n3. Simmer all together with blended tomato for 10 minutes.',
 'Iron, protein, folate', true),
 
-- ── DINNER / QUICK ───────────────────────────────────────────
('Rice and Pea Mash',
 'Simple soft rice mixed with blended peas.',
 6, 12, 'dinner', 'quick', 10,
 '1. Cook rice until very soft.\n2. Steam peas and blend smooth.\n3. Mix together.',
 'Iron, protein, carbohydrates', true),
 
('Pumpkin and Lentil Puree',
 'Warming evening puree of pumpkin and red lentils.',
 6, 12, 'dinner', 'quick', 15,
 '1. Steam pumpkin until soft.\n2. Cook lentils until mushy.\n3. Blend together until smooth.',
 'Iron, vitamin A, fiber', true),
 
('Soft Chicken and Rice',
 'Finely shredded chicken mixed into soft rice.',
 8, 18, 'dinner', 'quick', 15,
 '1. Cook rice until very soft.\n2. Shred cooked chicken very finely.\n3. Mix into rice with a little warm water.',
 'Protein, iron, energy', true),
 
('Turkey and Sweet Potato Mash',
 'Pureed turkey blended with smooth sweet potato.',
 6, 12, 'dinner', 'quick', 15,
 '1. Cook turkey until well done.\n2. Steam sweet potato.\n3. Blend both until smooth.',
 'Protein, iron, vitamin A', true),
 
('Broccoli and Potato Mash',
 'Creamy mashed potato with smooth broccoli mixed in.',
 6, 12, 'dinner', 'quick', 12,
 '1. Boil potato until soft.\n2. Steam broccoli until tender.\n3. Mash potato, blend broccoli, combine.',
 'Vitamin C, calcium, fiber', true),
 
('Zucchini and Carrot Puree',
 'Light evening puree of zucchini and carrot.',
 4, 10, 'dinner', 'quick', 10,
 '1. Steam zucchini and carrot together.\n2. Blend until smooth.\n3. Thin with water if needed.',
 'Vitamin A, vitamin C, hydration', true),
 
('Lamb and Vegetable Blend',
 'Iron-rich lamb pureed with peas and carrot.',
 6, 12, 'dinner', 'quick', 15,
 '1. Cook lamb until well done.\n2. Steam peas and carrot.\n3. Blend all together with water.',
 'Iron, zinc, protein', true),
 
('Salmon with Pea Mash',
 'Omega-rich salmon with blended pea mash.',
 6, 12, 'dinner', 'quick', 12,
 '1. Steam salmon until cooked.\n2. Steam peas and mash or blend.\n3. Flake salmon finely and mix in.',
 'Omega-3, iron, protein', true),
 
('Baby Shepherds Pie',
 'Soft minced beef with vegetables topped with creamy mashed potato.',
 10, 18, 'dinner', 'fancy', 35,
 '1. Cook minced beef with diced carrot and peas.
2. Place in baking dish.
3. Top with mashed potato.
4. Bake at 180°C for 15 minutes.',
 'Iron, zinc, protein, vitamin A', true),

('Vegetable Khichdi',
 'Soft rice and lentil one-pot dish with hidden vegetables.',
 6, 14, 'dinner', 'fancy', 25,
 '1. Rinse rice and lentils together.
2. Cook with diced carrot and peas in plenty of water.
3. Simmer until very soft and porridge-like.',
 'Iron, protein, complete amino acids', true),

('Baby Fish Pie',
 'Flaked salmon in a creamy potato sauce.',
 8, 18, 'dinner', 'fancy', 30,
 '1. Steam salmon and flake finely.
2. Make a simple white sauce with milk.
3. Mix salmon in sauce, top with mashed potato, bake 15 minutes.',
 'Omega-3, calcium, protein', true),

('Soft Beef and Vegetable Stew',
 'Tender slow-cooked beef with potato, carrot, and peas.',
 10, 18, 'dinner', 'fancy', 40,
 '1. Dice beef very small and brown lightly.
2. Add diced potato, carrot, peas and water.
3. Simmer for 30 minutes until everything is very soft.',
 'Iron, zinc, protein, fiber', true),

('Paneer and Spinach',
 'Mild creamy spinach sauce with soft paneer pieces.',
 10, 18, 'dinner', 'fancy', 20,
 '1. Steam spinach and blend smooth.
2. Cut paneer into very small soft cubes.
3. Simmer paneer in spinach sauce for 5 minutes.',
 'Calcium, iron, protein', true),

('Chicken and Lentil Soup',
 'Hearty soup of shredded chicken and soft red lentils.',
 8, 18, 'dinner', 'fancy', 30,
 '1. Simmer chicken with red lentils in water for 20 minutes.
2. Remove chicken and shred very finely.
3. Blend soup partially, return chicken.',
 'Iron, protein, folate', true),

-- ── SNACK / QUICK ────────────────────────────────────────────
('Mashed Avocado on Soft Bread',
 'Creamy avocado spread on a small piece of soft bread.',
 8, 18, 'snack', 'quick', 3,
 '1. Mash ripe avocado.
2. Spread on soft bread cut into small pieces.',
 'Healthy fats, vitamin E', true),

('Banana Slices',
 'Ripe banana cut into age-appropriate pieces.',
 6, 18, 'snack', 'quick', 2,
 '1. Peel ripe banana.
2. Mash for under 8m, slice into rounds for 8m+, cut into sticks for 10m+.',
 'Potassium, natural energy', true),

('Greek Yogurt with Fruit Puree',
 'Full-fat yogurt swirled with pureed fruit.',
 8, 18, 'snack', 'quick', 3,
 '1. Spoon yogurt into bowl.
2. Add a spoonful of any fruit puree on top.',
 'Calcium, probiotics, vitamin C', true),

('Soft Steamed Carrot Sticks',
 'Well-steamed carrot sticks for little hands to hold.',
 8, 18, 'snack', 'quick', 8,
 '1. Peel and cut carrot into finger-sized sticks.
2. Steam until very soft but still holding shape.',
 'Vitamin A, beta-carotene', true),

('Peanut Butter Rice Cake',
 'Thinly spread peanut butter on a soft rice cake.',
 8, 18, 'snack', 'quick', 2,
 '1. Spread a very thin layer of peanut butter on rice cake.
2. Break into small pieces for younger babies.',
 'Protein, healthy fats', true),

('Blueberry Mash',
 'Fresh blueberries mashed into a smooth compote.',
 8, 18, 'snack', 'quick', 3,
 '1. Wash blueberries.
2. Mash thoroughly with a fork.
3. Serve as a puree or thick sauce.',
 'Antioxidants, vitamin C', true),

('Cottage Cheese with Mango',
 'Creamy cottage cheese mixed with mango puree.',
 8, 18, 'snack', 'quick', 4,
 '1. Puree ripe mango.
2. Mix with full-fat cottage cheese.',
 'Calcium, protein, vitamin C', true),

('Soft Cucumber Sticks',
 'Peeled and deseeded cucumber sticks — cool and refreshing.',
 8, 18, 'snack', 'quick', 3,
 '1. Peel cucumber and remove seeds.
2. Cut into finger-length sticks.',
 'Hydration, vitamin K', true),

-- ── SNACK / FANCY ────────────────────────────────────────────
('Banana Oat Cookies',
 'Two-ingredient soft baked cookies — naturally sweet.',
 10, 18, 'snack', 'fancy', 20,
 '1. Mash 2 ripe bananas with 1 cup oats.
2. Form into small rounds on baking tray.
3. Bake at 180°C for 12 minutes until golden.',
 'Iron, potassium, fiber', true),

('Sweet Potato Puffs',
 'Soft baked sweet potato and oat bites.',
 10, 18, 'snack', 'fancy', 25,
 '1. Mash cooked sweet potato with oats and a little cinnamon.
2. Roll into small balls.
3. Bake at 180°C for 15 minutes.',
 'Vitamin A, iron, fiber', true),

('Mini Fruit Muffins',
 'Soft whole wheat muffins with blueberry and banana.',
 10, 18, 'snack', 'fancy', 25,
 '1. Mix mashed banana, egg, and whole wheat flour.
2. Fold in blueberries.
3. Bake in mini muffin tin at 180°C for 15 minutes.',
 'Iron, antioxidants, protein', true),

('Avocado Toast Fingers',
 'Soft toast fingers topped with mashed avocado and egg.',
 10, 18, 'snack', 'fancy', 10,
 '1. Toast bread lightly and cut into fingers.
2. Mash avocado and spread.
3. Top with small pieces of soft scrambled egg.',
 'Healthy fats, protein, iron', true),

('Blueberry Yogurt Bark',
 'Frozen yogurt bark with blueberries — great for teething.',
 10, 18, 'snack', 'fancy', 120,
 '1. Spread full-fat yogurt on a lined tray.
2. Press blueberries into yogurt.
3. Freeze for 2 hours.
4. Break into small pieces to serve.',
 'Calcium, probiotics, antioxidants', true),

('Oat and Banana Energy Balls',
 'No-bake oat and banana balls rolled in coconut.',
 12, 18, 'snack', 'fancy', 15,
 '1. Mash banana with oats until combined.
2. Add a little peanut butter.
3. Roll into small balls.
4. Optional: roll in desiccated coconut.',
 'Iron, protein, healthy fats', true);



-- Fix meal_logs to work with new meals table
ALTER TABLE public.meal_logs
  DROP CONSTRAINT meal_logs_meal_slot_check;

ALTER TABLE public.meal_logs
  ADD CONSTRAINT meal_logs_meal_slot_check CHECK (
    meal_slot = ANY (ARRAY['breakfast','lunch','dinner','snack'])
  );

-- Fix built_in_meal_id type from integer to uuid
ALTER TABLE public.meal_logs
  ALTER COLUMN built_in_meal_id TYPE UUID USING NULL;

-- Add proper foreign key to meals table
ALTER TABLE public.meal_logs
  ADD CONSTRAINT meal_logs_built_in_meal_id_fkey
  FOREIGN KEY (built_in_meal_id)
  REFERENCES public.meals(id)
  ON DELETE SET NULL;

-- SELECT id, name FROM public.foods ORDER BY name;
-- SELECT id, title FROM public.meals ORDER BY title;
ALTER TABLE household_foods ADD COLUMN food_id UUID REFERENCES foods(id) ON DELETE SET NULL;


drop table if exists public.favorites;

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meal_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select" on public.favorites for select to authenticated using (auth.uid() = user_id);
create policy "favorites_insert" on public.favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "favorites_delete" on public.favorites for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- Baby Bites — South Asian / Pakistani foods
-- Step 1: Add search_aliases column to foods table
-- Step 2: Insert 47 new South Asian foods (3 duplicates removed)
-- Step 3: Update existing foods with aliases
-- Paste into Supabase SQL editor and run
-- ============================================================


-- ── 1. ADD search_aliases COLUMN ────────────────────────────
ALTER TABLE public.foods
ADD COLUMN IF NOT EXISTS search_aliases TEXT;


-- ── 2. INSERT NEW SOUTH ASIAN FOODS ─────────────────────────

INSERT INTO public.foods (name, safe_from_months, is_iron_rich, food_group, allergen_notes, texture_tips, search_aliases)
VALUES

-- ── GRAINS (12) ──────────────────────────────────────────────
('Suji Porridge',
 4, true, 'grain',
 'Contains gluten',
 'Also known as Rava or Cream of Wheat. Cook with water or milk until thick and smooth. A classic Pakistani first food — thin with breast milk for 4m.',
 'semolina, rava, sooji, cream of wheat, suji, semolina pudding'),

('Daliya',
 6, true, 'grain',
 'Contains gluten',
 'Also known as Cracked Wheat or Broken Wheat Porridge. Cook until very soft and mushy. Highly nutritious — blend smooth for 6m, leave slightly textured at 9m+.',
 'broken wheat, cracked wheat, farina, wheat porridge, dalia'),

('Khichdi',
 6, true, 'grain',
 null,
 'Also known as Khichri. Cook rice and moong dal together until very soft and porridge-like. The ultimate South Asian baby food — easy to digest and iron-rich.',
 'khichri, rice lentil porridge, rice dal, kitchdi'),

('Chawal Ka Maada',
 4, false, 'grain',
 null,
 'Also known as Rice Congee or Kanji. The starchy water from boiling rice. Thin and easy to digest — great first food at 4m before moving to full rice porridge.',
 'rice water, kanji, congee, rice soup, maada'),

('Bajra Porridge',
 6, true, 'grain',
 null,
 'Also known as Pearl Millet or Bajri. Cook finely ground bajra flour with water until smooth. Rich in iron and zinc — very popular in Pakistan and India.',
 'pearl millet, bajri, kambu, millet porridge, bajra'),

('Jowar Porridge',
 6, true, 'grain',
 null,
 'Also known as Sorghum or White Millet. Cook ground jowar flour into a smooth porridge. Gluten-free grain common in Pakistani households.',
 'sorghum, jawar, white millet, jowar, great millet'),

('Makai Ki Roti',
 10, false, 'grain',
 null,
 'Also known as Cornbread or Makki di Roti. Only at 10m+ when baby handles soft lumps. Tear into tiny soft pieces — a Punjab staple.',
 'cornbread, makki roti, corn bread, maize bread, makki di roti'),

('Sattu',
 8, true, 'grain',
 'Contains chickpea flour — introduce carefully',
 'Also known as Roasted Gram Flour or Bengal Gram Flour. Mix with water or milk into a smooth paste. High protein traditional weaning food.',
 'roasted gram flour, chatu, sattu flour, bengal gram powder'),

('Besan Porridge',
 8, true, 'grain',
 'Contains chickpea — introduce carefully',
 'Also known as Gram Flour or Chickpea Flour Porridge. Cook with water into a thin porridge. Protein-rich — watch for reaction as chickpea is a legume allergen.',
 'gram flour, chickpea flour, chana atta, besan, gramflour porridge'),

('Sevian',
 8, false, 'grain',
 'Contains gluten',
 'Also known as Vermicelli or Seviyan. Cook until very soft in milk or water. Break into tiny pieces for 8m — a beloved Pakistani baby food often made with milk.',
 'vermicelli, seviyan, angel hair pasta, semiyan, seviya'),

('Phirni',
 8, false, 'grain',
 'Contains dairy if made with milk',
 'Also known as Rice Flour Pudding or Firni. Cook ground rice flour with milk until thick and smooth. Creamy and easily digestible — a classic Pakistani baby food.',
 'rice pudding, firni, rice flour pudding, pherni, ground rice pudding'),

('Atta Porridge',
 6, true, 'grain',
 'Contains gluten',
 'Also known as Whole Wheat Porridge or Gehun Ka Dalia. Cook whole wheat flour with water or milk into a smooth porridge. A staple Pakistani weaning food.',
 'whole wheat porridge, gehun dalia, wheat porridge, atta daliya, wholemeal porridge'),

-- ── VEGETABLES (15) ──────────────────────────────────────────
('Lauki',
 4, false, 'veggie',
 null,
 'Also known as Bottle Gourd, Doodhi or Ghiya. Peel, deseed and steam until very soft. One of the most recommended first vegetables in Pakistan — very mild and cooling.',
 'bottle gourd, doodhi, ghiya, dudhi, calabash, white gourd'),

('Tinda',
 6, false, 'veggie',
 null,
 'Also known as Indian Round Gourd or Apple Gourd. Peel, remove seeds and steam until very soft. Bland and easy to digest — perfect first vegetable.',
 'round gourd, apple gourd, indian baby pumpkin, tinde, indian round gourd'),

('Turai',
 6, false, 'veggie',
 null,
 'Also known as Ridge Gourd, Torai or Chinese Okra. Peel and steam until very soft. Extremely mild flavor — blend smooth for 6m, mash at 9m+.',
 'ridge gourd, torai, luffa, chinese okra, dodka, turiya'),

('Karela',
 12, false, 'veggie',
 null,
 'Also known as Bitter Gourd or Bitter Melon. Only introduce after 12m. Remove seeds, cook well and blend with sweeter veg to balance the bitterness.',
 'bitter gourd, bitter melon, pare, momordica, karella'),

('Arbi',
 8, false, 'veggie',
 null,
 'Also known as Taro Root or Colocasia. Always cook thoroughly — never serve raw. Boil until very soft and mash smooth — naturally creamy texture.',
 'taro, colocasia, taro root, arvi, ghuiya, dasheen'),

('Methi Leaves',
 8, true, 'veggie',
 null,
 'Also known as Fenugreek Leaves. Steam fresh leaves and blend into dal or khichdi. Very nutritious — slightly bitter, always mix with other foods.',
 'fenugreek, fenugreek leaves, kasuri methi, methi saag, trigonella'),

('Sarson Saag',
 10, true, 'veggie',
 null,
 'Also known as Mustard Greens or Mustard Saag. Cook until very soft and blend smooth. Strong flavor — mix with potato or lauki to mellow. A Punjab winter staple.',
 'mustard greens, mustard saag, sarson, mustard leaves, saag'),

('Kaddu',
 4, false, 'veggie',
 null,
 'Also known as Yellow Pumpkin, Petha or Sitaphal. Steam or boil until very soft and blend. Naturally sweet — one of the best first vegetables for Pakistani babies.',
 'pumpkin, yellow pumpkin, sitaphal, petha, squash, kadoo'),

('Sem',
 8, false, 'veggie',
 null,
 'Also known as Flat Beans, Surti Papdi or Broad Beans. Remove strings, steam until very soft and blend. Rich in plant protein.',
 'flat beans, broad beans, surti papdi, field beans, valor'),

('Mooli',
 10, false, 'veggie',
 null,
 'Also known as White Radish or Daikon. Cook until very soft — never serve raw to babies. Blend with potato or carrot to mellow the strong flavor.',
 'white radish, daikon, muli, japanese radish, moullah'),

('Kohlrabi',
 8, false, 'veggie',
 null,
 'Also known as Ganth Gobhi or German Turnip. Peel, dice and steam until very soft. Blend smooth — mild cabbage-like flavor popular in Pakistani cooking.',
 'ganth gobhi, german turnip, knol khol, turnip cabbage'),

('Okra',
 8, false, 'veggie',
 null,
 'Also known as Bhindi or Lady Finger. Cook until very soft and blend smooth. Naturally thickens purees — good with tomato and lentil.',
 'bhindi, lady finger, ladies finger, bamia, gumbo, okro'),

('Plantain',
 6, false, 'veggie',
 null,
 'Also known as Kela or Cooking Banana. Use very ripe yellow plantain. Boil or bake until soft and mash — naturally sweet and starchy.',
 'cooking banana, kela, kacha kela, raw banana, green banana'),

('Haldi',
 6, false, 'veggie',
 null,
 'Also known as Turmeric. Add a tiny pinch to dals and vegetable purees only. Anti-inflammatory and widely used in Pakistani weaning foods.',
 'turmeric, curcumin, turmeric root, haldi powder, yellow spice'),

-- ── FRUITS (8) ───────────────────────────────────────────────
('Chikoo',
 8, false, 'fruit',
 null,
 'Also known as Sapodilla, Sapota or Naseberry. Remove skin and seeds, mash the soft flesh. Naturally very sweet and creamy — babies love it.',
 'sapodilla, sapota, naseberry, chiku, zapota, sapodillo'),

('Jamun',
 10, false, 'fruit',
 null,
 'Also known as Black Plum or Java Plum. Remove seed and mash or blend. Tart and astringent — mix with banana to balance. Available seasonally in Pakistan.',
 'black plum, java plum, indian blackberry, jambolan, jamun berry'),

('Falsa',
 10, false, 'fruit',
 null,
 'Also known as Grewia or Indian Sherbet Berry. Remove seeds and blend smooth — very tart, mix with banana or mango. A summer fruit in Pakistan.',
 'phalsa, grewia, indian sherbet berry, falsa berry'),

('Ber',
 10, false, 'fruit',
 null,
 'Also known as Jujube or Indian Plum. Remove seed and blend smooth when very ripe. Sweet and mildly tart — common street fruit in Pakistan.',
 'jujube, indian plum, chinese date, bor, ziziphus, ber fruit'),

('Nashpati',
 4, false, 'fruit',
 null,
 'Also known as Pakistani Pear or Desi Pear. Peel, core and steam if firm — very ripe ones can be mashed raw. A staple first fruit in Pakistani households.',
 'pear, desi pear, sand pear, pakistani pear, nashpatti'),

('Aloo Bukhara',
 6, false, 'fruit',
 null,
 'Also known as Plum or Bukhara Plum. Remove pit and blend smooth. Naturally helps with constipation — a common fruit in Pakistani markets.',
 'plum, bukhara plum, sour plum, prune plum, alu bukhara'),

('Shahtoot',
 8, false, 'fruit',
 null,
 'Also known as Mulberry or Toot. Blend or mash thoroughly. Naturally sweet and iron-rich — a spring seasonal fruit in Pakistan.',
 'mulberry, toot, white mulberry, black mulberry, shehtoot'),

('Loquat',
 8, false, 'fruit',
 null,
 'Also known as Lokat or Japanese Plum. Remove skin and seed, mash the soft flesh. Sweet and mild — a popular spring fruit in Pakistan.',
 'lokat, japanese plum, chinese plum, nispero, eriobotrya'),

-- ── PROTEINS (12) ────────────────────────────────────────────
('Moong Dal',
 4, true, 'protein',
 null,
 'Also known as Yellow Lentil or Split Mung Bean. The most recommended first dal in Pakistan — cook until mushy and blend smooth. Easiest legume to digest.',
 'yellow lentil, split mung bean, mung dal, moong daal, green gram dal'),

('Masoor Dal',
 6, true, 'protein',
 null,
 'Also known as Red Lentil or Pink Lentil. Cook until very soft and blend smooth. Iron-rich and quick-cooking — a Pakistani kitchen staple perfect for babies.',
 'red lentil, pink lentil, masoor daal, red dal, orange lentil'),

('Chana Dal',
 8, true, 'protein',
 'Contains chickpea — introduce carefully',
 'Also known as Split Chickpea or Bengal Gram Dal. Cook until very soft, blend smooth. Higher fiber than other dals — introduce after moong and masoor.',
 'split chickpea, bengal gram dal, channa dal, yellow split pea'),

('Urad Dal',
 8, true, 'protein',
 null,
 'Also known as White Lentil or Split Black Gram. Cook until very soft and blend — use the skinned white variety for babies. Rich in protein and calcium.',
 'white lentil, split black gram, mash dal, urad daal, black gram dal'),

('Toor Dal',
 6, true, 'protein',
 null,
 'Also known as Pigeon Pea or Arhar Dal. Cook with a little ghee until very soft. A common everyday dal in Pakistani cooking — blend smooth for babies.',
 'pigeon pea, arhar dal, tuvar dal, toor daal, yellow pigeon pea'),

('Rajma',
 10, true, 'protein',
 null,
 'Also known as Red Kidney Beans. Always soak overnight and cook very thoroughly. Mash or blend smooth — never serve undercooked. Introduce at 10m+.',
 'red kidney beans, kidney beans, rajma dal, red beans'),

('Kala Chana',
 10, true, 'protein',
 'Chickpea — introduce carefully',
 'Also known as Black Chickpea or Desi Chana. Soak overnight and cook very thoroughly. Higher iron than white chickpea — blend smooth for 10m+.',
 'black chickpea, desi chana, brown chickpea, kala channa, bengal gram'),

('Qeema',
 8, true, 'protein',
 null,
 'Also known as Minced Meat or Ground Meat. Use lean beef or chicken. Cook very thoroughly with no spices, blend with vegetable puree until smooth.',
 'minced meat, ground meat, keema, kima, mince'),

('Murgh Puree',
 6, true, 'protein',
 null,
 'Also known as Pureed Chicken or Boiled Chicken. Steam or boil boneless chicken breast with no spices. Blend with broth until completely smooth.',
 'pureed chicken, boiled chicken, chicken puree, murgh, chicken'),

('Rohu Fish',
 6, true, 'protein',
 'Fish allergen — introduce carefully',
 'Also known as Rahu or Roho Labeo. A very common freshwater fish in Pakistan. Steam and blend smooth — remove all bones carefully. Rich in protein.',
 'rahu, roho labeo, freshwater fish, pakistani fish, river fish'),

('Dahi',
 8, false, 'protein',
 'Contains dairy',
 'Also known as Plain Yogurt or Curd. Use full-fat plain dahi — never flavored or sweetened. A staple in Pakistani weaning — mix with fruit puree or dal.',
 'yogurt, curd, plain yogurt, set yogurt, lassi base, natural yogurt'),

('Ghee',
 6, false, 'protein',
 'Contains dairy',
 'Also known as Clarified Butter. Add a tiny amount to dals, khichdi and porridges. Provides healthy fats and calories essential for baby brain development.',
 'clarified butter, desi ghee, butter oil, usli ghee, pure ghee')

ON CONFLICT (name) DO NOTHING;


-- ── 3. UPDATE EXISTING FOODS WITH ALIASES ───────────────────
-- Add search aliases to your original 80 foods so English
-- and alternate names all work in search

UPDATE public.foods SET search_aliases = 'oats, porridge, oat porridge, rolled oats' WHERE name = 'Oatmeal';
UPDATE public.foods SET search_aliases = 'rice, congee, rice porridge, chawal' WHERE name = 'Rice Porridge';
UPDATE public.foods SET search_aliases = 'rice, chawal, white rice, boiled rice' WHERE name = 'Rice';
UPDATE public.foods SET search_aliases = 'millet, millet porridge, bajra, ragi' WHERE name = 'Millet Porridge';
UPDATE public.foods SET search_aliases = 'quinoa grain, white quinoa, red quinoa' WHERE name = 'Quinoa';
UPDATE public.foods SET search_aliases = 'bread, white bread, toast, double roti' WHERE name = 'Soft White Bread';
UPDATE public.foods SET search_aliases = 'whole wheat, gehun, atta, wheat porridge' WHERE name = 'Whole Wheat Porridge';
UPDATE public.foods SET search_aliases = 'semolina, suji, rava, cream of wheat' WHERE name = 'Semolina Porridge';
UPDATE public.foods SET search_aliases = 'cornmeal, maize, corn porridge, makkai' WHERE name = 'Cornmeal Porridge';
UPDATE public.foods SET search_aliases = 'pasta, noodles, macaroni, spaghetti' WHERE name = 'Soft Pasta';
UPDATE public.foods SET search_aliases = 'finger millet, ragi, nachni, mandua' WHERE name = 'Ragi (Finger Millet)';
UPDATE public.foods SET search_aliases = 'rice cake, puffed rice cake, mochi' WHERE name = 'Soft Rice Cake';
UPDATE public.foods SET search_aliases = 'buckwheat, kuttu, kasha, buckwheat grain' WHERE name = 'Buckwheat Porridge';
UPDATE public.foods SET search_aliases = 'chapati, roti, flatbread, soft roti' WHERE name = 'Soft Chapati';
UPDATE public.foods SET search_aliases = 'puffed rice, murmure, muri, kurmura' WHERE name = 'Puffed Rice';

UPDATE public.foods SET search_aliases = 'sweet potato, shakarkandi, shakar qandi, yam' WHERE name = 'Sweet Potato';
UPDATE public.foods SET search_aliases = 'carrot, gajar, gazar, orange carrot' WHERE name = 'Carrot';
UPDATE public.foods SET search_aliases = 'butternut squash, squash, kaddu, pumpkin' WHERE name = 'Butternut Squash';
UPDATE public.foods SET search_aliases = 'pumpkin, kaddu, sitaphal, squash' WHERE name = 'Pumpkin';
UPDATE public.foods SET search_aliases = 'peas, green peas, matar, hara matar' WHERE name = 'Peas';
UPDATE public.foods SET search_aliases = 'spinach, palak, saag, baby spinach' WHERE name = 'Spinach';
UPDATE public.foods SET search_aliases = 'broccoli, hari phool gobhi, green cauliflower' WHERE name = 'Broccoli';
UPDATE public.foods SET search_aliases = 'cauliflower, phool gobhi, gobhi, white cauliflower' WHERE name = 'Cauliflower';
UPDATE public.foods SET search_aliases = 'zucchini, courgette, turai, green squash' WHERE name = 'Zucchini';
UPDATE public.foods SET search_aliases = 'green beans, french beans, sem, beans' WHERE name = 'Green Beans';
UPDATE public.foods SET search_aliases = 'potato, aloo, alu, white potato' WHERE name = 'Potato';
UPDATE public.foods SET search_aliases = 'parsnip, white carrot, pastinaca' WHERE name = 'Parsnip';
UPDATE public.foods SET search_aliases = 'beetroot, beet, chukandar, red beet' WHERE name = 'Beetroot';
UPDATE public.foods SET search_aliases = 'kale, karam saag, curly kale, leaf cabbage' WHERE name = 'Kale';
UPDATE public.foods SET search_aliases = 'corn, makai, makka, sweet corn, maize' WHERE name = 'Corn';
UPDATE public.foods SET search_aliases = 'cabbage, band gobhi, patta gobhi, bund gobhi' WHERE name = 'Cabbage';
UPDATE public.foods SET search_aliases = 'cucumber, kheera, khira, kakri' WHERE name = 'Cucumber';
UPDATE public.foods SET search_aliases = 'tomato, tamatar, lal tamatar, red tomato' WHERE name = 'Tomato';
UPDATE public.foods SET search_aliases = 'bell pepper, shimla mirch, capsicum, sweet pepper' WHERE name = 'Bell Pepper';
UPDATE public.foods SET search_aliases = 'eggplant, brinjal, baingan, aubergine' WHERE name = 'Eggplant';

UPDATE public.foods SET search_aliases = 'banana, kela, kelaa, yellow banana' WHERE name = 'Banana';
UPDATE public.foods SET search_aliases = 'apple, seb, safarchand, red apple' WHERE name = 'Apple';
UPDATE public.foods SET search_aliases = 'pear, nashpati, naspati, nashpatti' WHERE name = 'Pear';
UPDATE public.foods SET search_aliases = 'avocado, butter fruit, makhanphal' WHERE name = 'Avocado';
UPDATE public.foods SET search_aliases = 'mango, aam, keri, alphonso, langra' WHERE name = 'Mango';
UPDATE public.foods SET search_aliases = 'papaya, papita, papeeta, pawpaw' WHERE name = 'Papaya';
UPDATE public.foods SET search_aliases = 'peach, aadu, aroo, shaftalu' WHERE name = 'Peach';
UPDATE public.foods SET search_aliases = 'plum, aloo bukhara, alu bukhara, prune' WHERE name = 'Plum';
UPDATE public.foods SET search_aliases = 'apricot, khubani, khurmani, zardalu' WHERE name = 'Apricot';
UPDATE public.foods SET search_aliases = 'blueberry, neel beri, blue berry' WHERE name = 'Blueberry';
UPDATE public.foods SET search_aliases = 'strawberry, strawberries, lal berry' WHERE name = 'Strawberry';
UPDATE public.foods SET search_aliases = 'watermelon, tarbuz, tarbooz' WHERE name = 'Watermelon';
UPDATE public.foods SET search_aliases = 'kiwi, kiwi fruit, chinese gooseberry' WHERE name = 'Kiwi';
UPDATE public.foods SET search_aliases = 'melon, kharbuja, kharbooza, cantaloupe' WHERE name = 'Melon';
UPDATE public.foods SET search_aliases = 'guava, amrood, amrud, peru' WHERE name = 'Guava';
UPDATE public.foods SET search_aliases = 'prune, dried plum, sukha aloo bukhara' WHERE name = 'Prune';
UPDATE public.foods SET search_aliases = 'fig, anjeer, angeer, dried fig' WHERE name = 'Fig';
UPDATE public.foods SET search_aliases = 'coconut, nariyal, naryal, naryel' WHERE name = 'Coconut';
UPDATE public.foods SET search_aliases = 'orange, narangi, santra, malta' WHERE name = 'Orange';
UPDATE public.foods SET search_aliases = 'grape, angoor, angur, grapes' WHERE name = 'Grape';

UPDATE public.foods SET search_aliases = 'lentils, masoor, dal, red lentil' WHERE name = 'Lentils';
UPDATE public.foods SET search_aliases = 'lentil, masoor, dal, red lentil' WHERE name = 'Lentil';
UPDATE public.foods SET search_aliases = 'chickpeas, chana, kabuli chana, garbanzo' WHERE name = 'Chickpeas';
UPDATE public.foods SET search_aliases = 'black beans, kali dal, black bean' WHERE name = 'Black Beans';
UPDATE public.foods SET search_aliases = 'kidney beans, rajma, lal lobia, red beans' WHERE name = 'Kidney Beans';
UPDATE public.foods SET search_aliases = 'mung beans, moong, green gram, sabut moong' WHERE name = 'Mung Beans';
UPDATE public.foods SET search_aliases = 'tofu, soy paneer, bean curd, soya tofu' WHERE name = 'Tofu';
UPDATE public.foods SET search_aliases = 'chicken, murgh, broiler, boiled chicken' WHERE name = 'Pureed Chicken';
UPDATE public.foods SET search_aliases = 'turkey, turkey mince, ground turkey' WHERE name = 'Pureed Turkey';
UPDATE public.foods SET search_aliases = 'beef, gai ka gosht, ground beef, mince' WHERE name = 'Pureed Beef';
UPDATE public.foods SET search_aliases = 'lamb, mutton, bakre ka gosht, gosht' WHERE name = 'Pureed Lamb';
UPDATE public.foods SET search_aliases = 'salmon, fish, machli, salman' WHERE name = 'Pureed Salmon';
UPDATE public.foods SET search_aliases = 'tuna, tuna fish, machli, canned tuna' WHERE name = 'Pureed Tuna';
UPDATE public.foods SET search_aliases = 'egg, anda, anday, scrambled egg' WHERE name = 'Scrambled Egg';
UPDATE public.foods SET search_aliases = 'yogurt, dahi, curd, greek dahi' WHERE name = 'Greek Yogurt';
UPDATE public.foods SET search_aliases = 'cottage cheese, paneer, chenna, fresh cheese' WHERE name = 'Cottage Cheese';
UPDATE public.foods SET search_aliases = 'peanut butter, mungphali, groundnut butter' WHERE name = 'Peanut Butter Puree';
UPDATE public.foods SET search_aliases = 'sunflower seed butter, sunflower butter, seed butter' WHERE name = 'Sunflower Seed Butter';
UPDATE public.foods SET search_aliases = 'paneer, fresh cheese, cottage cheese, chenna' WHERE name = 'Soft Paneer';
UPDATE public.foods SET search_aliases = 'split pea, matar dal, yellow split pea' WHERE name = 'Split Pea Puree';
UPDATE public.foods SET search_aliases = 'edamame, soy beans, green soy, young soy' WHERE name = 'Edamame Puree';

-- Extend food_group constraint to allow 'other'
ALTER TABLE public.foods 
DROP CONSTRAINT IF EXISTS foods_food_group_check;

ALTER TABLE public.foods 
ADD CONSTRAINT foods_food_group_check 
CHECK (food_group IN ('grain', 'veggie', 'fruit', 'protein', 'other'));

-- Fix all foods to minimum 6 months (WHO guideline)
UPDATE public.foods 
SET safe_from_months = 6 
WHERE safe_from_months < 6;

-- Add honey as a food with a serious warning
INSERT INTO public.foods (name, safe_from_months, is_iron_rich, food_group, allergen_notes, texture_tips, search_aliases)
VALUES (
  'Honey',
  12,
  false,
  'other',
  'NEVER give honey to babies under 12 months — risk of infant botulism which can be life-threatening. This includes raw honey, cooked honey, and products containing honey.',
  'Only introduce after 12 months. Can be drizzled lightly or mixed into food — never give to babies under 1 year under any circumstances.',
  'shahad, shehad, natural honey, raw honey, wild honey, bee honey'
);

UPDATE public.foods 
SET image_url = 'PASTE_YOUR_URL_HERE'
WHERE image_url IS NULL;
-- ============================================================
-- Baby Bites — Individual nuts + tea/coffee warning foods
-- Paste into Supabase SQL editor and run
-- ============================================================

INSERT INTO public.foods (name, safe_from_months, is_iron_rich, food_group, allergen_notes, texture_tips, search_aliases, is_warning)
VALUES

-- ── NUTS (introduced early to PREVENT allergy) ───────────────

('Peanut Butter',
 6, false, 'protein',
 'Peanut is a top-8 allergen. However early introduction from 6 months is now recommended by WHO and AAP to REDUCE the risk of peanut allergy. Introduce a small amount and wait 3 days before giving again. If family history of nut allergy consult doctor first.',
 'Always use smooth peanut butter — never crunchy or whole peanuts which are a choking hazard. Thin with warm water or breast milk to a very runny consistency before serving. Whole peanuts are a serious choking hazard until age 5.',
 'mungphali, groundnut butter, peanut, peanut paste, moongphali ka makhhan',
 false),

('Walnut',
 8, false, 'protein',
 'Tree nut allergen — introduce slowly and watch for reaction. Early introduction may help reduce allergy risk. Never give whole or roughly chopped walnuts to babies under 5 — serious choking hazard. Only finely ground walnut powder is safe for babies.',
 'Only use finely ground walnut powder — stir into porridge, khichdi or yogurt. Start with a tiny pinch and increase gradually. Never give whole, halved or roughly chopped walnuts before age 5.',
 'akhrot, walnut powder, ground walnut, akhrot powder',
 true),

('Almond',
 8, false, 'protein',
 'Tree nut allergen — introduce slowly. Early introduction may reduce allergy risk. Never give whole almonds to babies under 5 — serious choking hazard. Only finely ground almond powder or very thin almond butter is safe for babies.',
 'Use only finely ground almond flour or almond powder stirred into porridge or milk. Thin almond butter can be used from 10m+. Never give whole, sliced or slivered almonds before age 5.',
 'badam, almond powder, badam powder, ground almond, almond flour, badam ka atta',
 true),

('Cashew',
 10, false, 'protein',
 'Tree nut allergen — introduce after other nuts are tolerated. Never give whole cashews before age 5 — serious choking hazard. Only finely ground cashew powder or very thin cashew butter is safe.',
 'Use only finely ground cashew powder in porridge or smoothies. Introduce at 10m+ after peanut and almond have been tolerated. Never give whole, halved or broken cashews before age 5.',
 'kaju, cashew powder, kaju powder, ground cashew, cashew butter',
 true),

('Pistachio (Ground)',
 10, false, 'protein',
 'Tree nut allergen — introduce after other nuts are tolerated. Never give whole pistachios before age 5 — serious choking hazard. Only finely ground pistachio powder is safe for babies.',
 'Use only finely ground pistachio powder stirred into kheer, porridge or yogurt. Introduce at 10m+ after peanut and almond have been tolerated. Never give whole pistachios before age 5.',
 'pista, pista powder, ground pistachio, pistachio powder, piste',
 true),

('Hazelnut',
 10, false, 'protein',
 'Tree nut allergen — introduce after other nuts are tolerated. Never give whole hazelnuts before age 5. Only finely ground hazelnut powder is safe for babies.',
 'Use only finely ground hazelnut powder in porridge or yogurt. Introduce at 10m+ after other nuts are tolerated. Never give whole hazelnuts before age 5.',
 'hazel nut, hazelnut powder, ground hazelnut, filbert',
 true),

-- ── TEA / COFFEE / DRINKS ────────────────────────────────────

('Chai',
 48, false, 'other',
 'Never give chai or any tea to babies under 4 years. Caffeine in tea interferes with iron absorption, disrupts sleep, stresses the nervous system, and can cause dehydration. Tannins in tea also block iron absorption which is critical for babies. Many Pakistani families offer weak chai to babies — this should be completely avoided.',
 'No chai of any kind before 4 years — not even very weak or heavily diluted chai. Herbal teas are also not recommended unless prescribed by a doctor. Water and breast milk or formula are the only drinks babies need.',
 'tea, desi chai, milk tea, karak chai, green tea, shai, masala chai, adrak chai, qahwa',
 true),

('Coffee',
 48, false, 'other',
 'Never give coffee to babies or toddlers under 4 years. Coffee has high caffeine content which seriously disrupts baby sleep, brain development and iron absorption. Even a small sip of coffee is too much caffeine for a baby.',
 'No coffee of any kind before 4 years — including instant coffee, espresso, or coffee-flavored foods. Caffeine stays in a baby''s system much longer than in adults.',
 'coffee, instant coffee, espresso, kaffi, qahwa, decaf coffee',
 true),

('Soft Drinks',
 60, false, 'other',
 'Never give cola, fizzy drinks or soft drinks to children under 5. They contain high amounts of sugar, caffeine, artificial colors, and phosphoric acid which damage developing teeth and bones and disrupt gut health.',
 'No soft drinks, cola, or fizzy drinks before age 5 — and limit significantly after that. Even diet versions contain artificial sweeteners harmful to children. Water and diluted fruit juice are better alternatives for older toddlers.',
 'cola, pepsi, coke, sprite, fanta, fizzy drink, carbonated drink, soda, soft drink, cold drink, thanda',
 true),

('Energy Drinks(Cola)',
 60, false, 'other',
 'Never give energy drinks to children under any circumstances. They contain very high levels of caffeine, taurine, sugar and stimulants that can cause heart problems, seizures, and serious harm in children.',
 'Energy drinks are completely unsafe for children of all ages. Keep out of reach of children. Even a small amount can be dangerous.',
 'energy drink, red bull, monster, sting, power drink, stimulant drink',
 true),

-- ── PROCESSED / PACKAGED FOODS ───────────────────────────────

('Biscuits and Crackers',
 12, false, 'other',
 'Most commercial biscuits and crackers contain high amounts of salt, sugar, refined flour, and preservatives not suitable for babies under 12 months. Even products marketed as "baby biscuits" should be checked carefully for sugar and salt content.',
 'Always read labels — many baby biscuits contain more sugar than recommended. After 12 months choose plain low-sugar low-salt options. Homemade oat cookies with banana are a much healthier alternative.',
 'biscuit, cracker, baby biscuit, marie biscuit, rusk, baby rusk, teething biscuit',
 true),

('Instant Noodles',
 24, false, 'grain',
 'Never give instant noodles to babies or toddlers under 2 years. They contain extremely high levels of sodium, MSG, artificial flavors, and preservatives. A single serving of instant noodles contains more salt than a toddler should have in a whole day.',
 'No instant noodles before age 2 and limit significantly after. The flavor sachet is especially harmful — discard it even if cooking for older children. Soft homemade pasta is a much healthier alternative.',
 'maggi, indomie, ramen, instant ramen, cup noodles, 2 minute noodles, noodles',
 true),

('Packaged Chips',
 24, false, 'other',
 'Never give packaged chips or crisps to babies or toddlers under 2 years. They are extremely high in salt, saturated fat, artificial flavors and colors. They also present a choking hazard for young babies.',
 'No chips or crisps before age 2. After age 2 limit to very occasional treats only. Baked veggie sticks or homemade sweet potato chips are healthier alternatives for older toddlers.',
 'chips, crisps, lays, pringles, kuremal, nimko, crisp, potato chips, fried snack',
 true),

('Packaged Fruit Juice',
 12, false, 'fruit',
 'Packaged fruit juices are not recommended for babies under 12 months. Even 100% natural packaged juice lacks fiber, contains concentrated sugar, and can cause diarrhea and tooth decay. Most packaged juices also contain added sugar and preservatives.',
 'Avoid all packaged juice before 12 months. After 12 months offer only 100% pure juice with no added sugar, limited to 120ml per day. Always offer in a cup not a bottle. Whole fruit purees are always better than juice.',
 'juice, fruit juice, boxed juice, tetra pak juice, nestle juice, slice juice, frooto, packed juice',
 true)

ON CONFLICT (name) DO NOTHING;


-- ── VERIFY ───────────────────────────────────────────────────
SELECT name, food_group, safe_from_months, is_warning
FROM public.foods
WHERE name IN (
  'Peanut Butter (Smooth)', 'Walnut', 'Almond',
  'Cashew', 'Pistachio', 'Hazelnut',
  'Chai', 'Coffee', 'Soft Drinks (Cola)', 'Energy Drinks',
  'Biscuits and Crackers', 'Instant Noodles', 'Packaged Chips',
  'Packaged Fruit Juice'
)
ORDER BY name;
UPDATE public.foods 
SET image_url = 'https://jherhqenlzffrghadhlw.supabase.co/storage/v1/object/public/Food-bucket/healthy-food.png'
WHERE image_url IS NULL;

UPDATE public.foods
SET safe_from_months = 6,
    is_iron_rich = true,
    is_warning = false,
    allergen_notes = 'Tree nut allergen — common allergen, introduce carefully. Early introduction from 6 months is recommended to reduce allergy risk. Watch for reaction after first introduction and wait 3 days before offering again. Consult doctor first if family history of nut allergy.',
    texture_tips = 'Never give whole or chopped walnuts before age 2 — serious choking hazard. From 6m+ finely grind walnuts in a food processor until completely fine with no large pieces, then sprinkle on warm cereal, porridge or slippery fruits. Or thin smooth walnut butter with water, breast milk or applesauce and spread very thinly on food or toast strips. From 12m+ continue using ground walnuts and walnut butter in yogurt, cereals and mashed veg. Whole walnuts can be introduced with supervision from 2 years old if child has mature chewing skills — nuts remain a choking hazard until age 4.',
    search_aliases = 'akhrot, walnut powder, ground walnut, akhrot powder, walnut butter'
WHERE name = 'Walnut (Ground)';

-- ── PISTACHIO ────────────────────────────────────────────────
-- Safe from 6m as ground/butter, whole at 3 years with supervision
UPDATE public.foods
SET safe_from_months = 6,
    is_iron_rich = true,
    is_warning = false,
    allergen_notes = 'Tree nut allergen — classified as a Global Priority Allergen by WHO. Early introduction from 6 months is recommended to reduce allergy risk. Note: children allergic to pistachio are very often also allergic to cashew (95% crossover) due to similar protein structure. Consult doctor first if family history of nut allergy or if baby has severe eczema.',
    texture_tips = 'From 6m+: finely grind in a food processor until completely fine with no large pieces — sprinkle on yogurt, rice, porridge or cooked veg. Or make pistachio butter and thin with water, breast milk or applesauce until smooth with no clumps. Spread very thinly on food. From 12m+: continue ground pistachio and butter in yogurt and cereals. Whole pistachios only from 3 years old with supervision if child has mature chewing skills — shells are a serious choking hazard, always remove before serving.'
WHERE name = 'Pistachio';

-- ── CASHEW ───────────────────────────────────────────────────
-- Safe from 6m as ground/butter, whole halves at 2 years with supervision
UPDATE public.foods
SET safe_from_months = 6,
    is_iron_rich = true,
    is_warning = false,
    allergen_notes = 'Tree nut allergen — common allergen. Early introduction from 6 months is recommended to reduce allergy risk. Note: children allergic to cashew are very often also allergic to pistachio (75% crossover) due to similar protein structure. Consult doctor first if baby has severe eczema or suspected nut allergy.',
    texture_tips = 'From 6m+: finely grind cashews and sprinkle on avocado, banana or cooked veg. Or mix smooth cashew butter with applesauce, breast milk or water until smooth with no clumps — spread very thinly on food or toast strips. Can also soak cashews and blend into cashew cream to serve as a sauce on porridge or cooked foods. From 12m+: continue ground cashew and cashew butter in yogurt and cereals. Cashew halves can be introduced with supervision from 2 years old if child has mature chewing skills.'
WHERE name = 'Cashew';
-- Remove Aloo Bukhara duplicate
DELETE FROM public.foods WHERE name = 'Aloo Bukhara';

-- Add aloo bukhara to Plum's search aliases
UPDATE public.foods
SET search_aliases = COALESCE(search_aliases, '') || ', aloo bukhara, alu bukhara, bukhara plum, aloo bukhara fruit'
WHERE name = 'Plum';

-- Verify
SELECT name, search_aliases FROM public.foods WHERE name = 'Plum';