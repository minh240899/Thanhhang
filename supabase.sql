-- Our Little World v2: optional public multi-user backend (Supabase/Postgres).
-- Safe to run after v1 for ADD COLUMN/new tables; policies are re-created.
-- Before enabling anonymous uploads on the public Internet, add Turnstile,
-- rate limits, cleanup of orphan uploads and anti-abuse via Edge Functions.
create extension if not exists pgcrypto;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  author text not null check(char_length(trim(author)) between 1 and 40),
  title text not null check(char_length(trim(title)) between 1 and 90),
  body text not null check(char_length(trim(body)) between 1 and 1200),
  category text not null check(category in ('Du lịch','Hẹn hò','Đời thường','Bạn bè','Bạn bè & đồng nghiệp','Gia đình')),
  image_url text check(image_url is null or char_length(image_url) between 10 and 2048),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.memories add column if not exists image_urls text[] not null default '{}';
alter table public.memories alter column image_url drop not null;
alter table public.memories add column if not exists media_items jsonb not null default '[]'::jsonb;
-- Legacy v1 schemas may have memories_category_check limited to 'Bạn bè'.
alter table public.memories drop constraint if exists memories_category_check;
alter table public.memories add constraint memories_category_check check (category in ('Du lịch','Hẹn hò','Đời thường','Bạn bè','Bạn bè & đồng nghiệp','Gia đình'));
create index if not exists memories_public_idx on public.memories (approved, created_at desc);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(trim(title)) between 1 and 100),
  description text not null default '',
  label text not null default 'MỘT CHUYẾN ĐI',
  image_url text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  author text not null check(char_length(trim(author)) between 1 and 40),
  message text not null check(char_length(trim(message)) between 1 and 1200),
  image_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.wishes add column if not exists image_urls text[] not null default '{}';
alter table public.wishes add column if not exists media_items jsonb not null default '[]'::jsonb;
alter table public.wishes add column if not exists group_type text not null default 'Bạn bè & đồng nghiệp';
alter table public.wishes drop constraint if exists wishes_group_type_check;
alter table public.wishes add constraint wishes_group_type_check check (group_type in ('Gia đình','Bạn bè & đồng nghiệp','Người thương'));
create index if not exists wishes_public_idx on public.wishes (approved, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  author text not null check(char_length(trim(author)) between 1 and 40),
  message text not null check(char_length(trim(message)) between 1 and 600),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_public_idx on public.comments (memory_id, approved, created_at);

create table if not exists public.wish_comments (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  author text not null check(char_length(trim(author)) between 1 and 40),
  message text not null check(char_length(trim(message)) between 1 and 600),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists wish_comments_public_idx on public.wish_comments (wish_id, approved, created_at);

create table if not exists public.likes (
  memory_id uuid not null references public.memories(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (memory_id, visitor_id)
);
create table if not exists public.wish_likes (
  wish_id uuid not null references public.wishes(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (wish_id, visitor_id)
);

alter table public.memories enable row level security;
alter table public.trips enable row level security;
alter table public.wishes enable row level security;
alter table public.comments enable row level security;
alter table public.wish_comments enable row level security;
alter table public.likes enable row level security;
alter table public.wish_likes enable row level security;

-- Only approved content is readable by visitors.
drop policy if exists "Read approved memories" on public.memories;
create policy "Read approved memories" on public.memories for select to anon, authenticated using (approved = true);
drop policy if exists "Read published trips" on public.trips;
create policy "Read published trips" on public.trips for select to anon, authenticated using (published = true);
drop policy if exists "Read approved wishes" on public.wishes;
create policy "Read approved wishes" on public.wishes for select to anon, authenticated using (approved = true);
drop policy if exists "Read approved comments" on public.comments;
create policy "Read approved comments" on public.comments for select to anon, authenticated using (approved = true);
drop policy if exists "Read approved wish comments" on public.wish_comments;
create policy "Read approved wish comments" on public.wish_comments for select to anon, authenticated using (approved = true);

-- Validate all photo URLs in guest uploads. Owner may add custom assets in Dashboard.
create or replace function public.valid_guest_images(urls text[], max_files integer)
returns boolean language sql immutable set search_path = '' as $$
  select cardinality(coalesce(urls, '{}'::text[])) <= max_files
    and not exists (
      select 1 from unnest(coalesce(urls, '{}'::text[])) as img(url)
      where img.url is null
        or img.url not like 'https://%/storage/v1/object/public/birthday-photos/guest/%'
    );
$$;
revoke all on function public.valid_guest_images(text[],integer) from public;
grant execute on function public.valid_guest_images(text[],integer) to anon, authenticated;

-- Check guest media manifest; names are not a proof of MIME or ownership.
-- No client-supplied HTML is ever interpreted as trusted markup.
create or replace function public.valid_guest_media(items jsonb, max_files integer, max_videos integer)
returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(items)='array' and jsonb_array_length(items) <= max_files
    and (select count(*) from jsonb_array_elements(items) j where j->>'type'='video') <= max_videos
    and not exists (
      select 1 from jsonb_array_elements(items) j
      where jsonb_typeof(j)<>'object' or (j->>'type') not in ('image','video')
        or (j->>'url') is null or char_length(j->>'url') > 2048
        or not (
          ((j->>'type')='image' and (j->>'url') like 'https://%/storage/v1/object/public/birthday-photos/guest/%')
          or ((j->>'type')='video' and (j->>'url') like 'https://%/storage/v1/object/public/birthday-videos/guest/%')
        )
    );
$$;
revoke all on function public.valid_guest_media(jsonb,integer,integer) from public;
grant execute on function public.valid_guest_media(jsonb,integer,integer) to anon,authenticated;

drop policy if exists "Submit pending memories" on public.memories;
create policy "Submit pending memories" on public.memories for insert to anon
  with check (
    approved = false and jsonb_array_length(media_items) between 1 and 10
    and public.valid_guest_media(media_items,10,2)
    and public.valid_guest_images(image_urls, 10)
    and cardinality(image_urls) = (select count(*) from jsonb_array_elements(media_items) j where j->>'type'='image')
    and (image_url = image_urls[1] or (image_url is null and cardinality(image_urls)=0))
  );
drop policy if exists "Submit pending wishes" on public.wishes;
create policy "Submit pending wishes" on public.wishes for insert to anon
  with check (
    approved = false and public.valid_guest_images(image_urls,5)
    and public.valid_guest_media(media_items,5,1)
    and cardinality(image_urls) = (select count(*) from jsonb_array_elements(media_items) j where j->>'type'='image')
    and ((image_url is null and cardinality(image_urls)=0) or image_url=image_urls[1])
  );
drop policy if exists "Submit pending comments" on public.comments;
create policy "Submit pending comments" on public.comments for insert to anon
  with check (approved = false and exists(select 1 from public.memories m where m.id=memory_id and m.approved=true));
drop policy if exists "Submit pending wish comments" on public.wish_comments;
create policy "Submit pending wish comments" on public.wish_comments for insert to anon
  with check (approved = false and exists(select 1 from public.wishes w where w.id=wish_id and w.approved=true));
drop policy if exists "One like per visitor ID" on public.likes;
create policy "One like per visitor ID" on public.likes for insert to anon
  with check (exists(select 1 from public.memories m where m.id=memory_id and m.approved=true));
drop policy if exists "One wish like per visitor ID" on public.wish_likes;
create policy "One wish like per visitor ID" on public.wish_likes for insert to anon
  with check (exists(select 1 from public.wishes w where w.id=wish_id and w.approved=true));

-- Return counts, never visitor identifiers.
create or replace function public.like_counts()
returns table(memory_id uuid, like_count bigint)
language sql stable security definer set search_path = '' as $$
  select l.memory_id,count(*)::bigint from public.likes l
  join public.memories m on l.memory_id=m.id where m.approved = true group by l.memory_id;
$$;
create or replace function public.wish_like_counts()
returns table(wish_id uuid, like_count bigint)
language sql stable security definer set search_path = '' as $$
  select l.wish_id,count(*)::bigint from public.wish_likes l
  join public.wishes w on l.wish_id=w.id where w.approved = true group by l.wish_id;
$$;
revoke all on function public.like_counts() from public;
revoke all on function public.wish_like_counts() from public;
grant execute on function public.like_counts() to anon, authenticated;
grant execute on function public.wish_like_counts() to anon, authenticated;

grant select,insert on public.memories to anon;
grant select on public.trips to anon;
grant select,insert on public.wishes to anon;
grant select,insert on public.comments to anon;
grant select,insert on public.wish_comments to anon;
grant insert on public.likes to anon;
grant insert on public.wish_likes to anon;

-- WARNING: guest uploads go into PUBLIC bucket; pending objects aren't confidential!
-- For real privacy, move them into private staging bucket and approve via signed URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('birthday-photos','birthday-photos',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Guests may upload image to guest folder" on storage.objects;
create policy "Guests may upload image to guest folder" on storage.objects for insert to anon
  with check (bucket_id='birthday-photos' and (storage.foldername(name))[1]='guest');

-- Videos are public Storage objects; moderation on DB rows does NOT keep video files private.
-- Before production: private staging + server moderation, anti-bot and orphan cleanup.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('birthday-videos','birthday-videos',true,31457280,array['video/mp4','video/webm'])
on conflict(id) do update set public=true,file_size_limit=31457280,allowed_mime_types=array['video/mp4','video/webm'];
drop policy if exists "Guests may upload videos to guest folder" on storage.objects;
create policy "Guests may upload videos to guest folder" on storage.objects for insert to anon
  with check (bucket_id='birthday-videos' and (storage.foldername(name))[1]='guest');
