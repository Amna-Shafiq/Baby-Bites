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