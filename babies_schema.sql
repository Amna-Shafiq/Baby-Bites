-- Run this in your Supabase SQL Editor

create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  date_of_birth date not null,
  gender text default 'prefer_not_to_say' check (gender in ('boy', 'girl', 'other', 'prefer_not_to_say')),
  avatar text default '🐣',
  feeding_style text default 'solids only',
  is_dairy_free boolean default false,
  is_gluten_free boolean default false,
  is_nut_free boolean default false,
  is_egg_free boolean default false,
  is_soy_free boolean default false,
  is_fish_free boolean default false,
  is_vegetarian boolean default false,
  is_vegan boolean default false,
  allergy_notes text default '',
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row level security
alter table babies enable row level security;

create policy "babies_select" on babies for select using (auth.uid() = user_id);
create policy "babies_insert" on babies for insert with check (auth.uid() = user_id);
create policy "babies_update" on babies for update using (auth.uid() = user_id);
create policy "babies_delete" on babies for delete using (auth.uid() = user_id);

-- Auto-activate the first baby a user adds
create or replace function auto_activate_first_baby()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from babies where user_id = new.user_id and id != new.id) then
    new.is_active := true;
  end if;
  return new;
end;
$$;

create trigger trg_auto_activate_first_baby
  before insert on babies
  for each row execute function auto_activate_first_baby();

-- Switch active baby (deactivates all others for this user)
create or replace function switch_active_baby(baby_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update babies set is_active = false where user_id = auth.uid();
  update babies set is_active = true  where id = baby_id and user_id = auth.uid();
end;
$$;
