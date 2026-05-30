create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_group boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  attachment_url text,
  attachment_name text,
  attachment_type text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text,
  add column if not exists read_at timestamptz;

insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

create index if not exists conversation_members_user_id_idx
  on public.conversation_members(user_id);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages(conversation_id, created_at);

do $$
begin
  alter publication supabase_realtime add table public.conversation_members;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end;
$$;

create or replace function public.touch_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_conversation_member(conversation_id_to_check uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = conversation_id_to_check
      and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can create conversations" on public.conversations;
create policy "Users can create conversations"
on public.conversations for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Members can read conversations" on public.conversations;
create policy "Members can read conversations"
on public.conversations for select
to authenticated
using (created_by = auth.uid() or public.is_conversation_member(id));

drop policy if exists "Creators can update conversations" on public.conversations;
create policy "Creators can update conversations"
on public.conversations for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Members can read memberships" on public.conversation_members;
create policy "Members can read memberships"
on public.conversation_members for select
to authenticated
using (public.is_conversation_member(conversation_id));

drop policy if exists "Conversation creators can add members" on public.conversation_members;
create policy "Conversation creators can add members"
on public.conversation_members for insert
to authenticated
with check (
  exists (
    select 1
    from public.conversations
    where conversations.id = conversation_id
      and conversations.created_by = auth.uid()
  )
);

drop policy if exists "Members can read messages" on public.messages;
create policy "Members can read messages"
on public.messages for select
to authenticated
using (public.is_conversation_member(conversation_id));

drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send messages"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_member(conversation_id)
);

drop policy if exists "Members can mark received messages read" on public.messages;
create policy "Members can mark received messages read"
on public.messages for update
to authenticated
using (
  sender_id <> auth.uid()
  and public.is_conversation_member(conversation_id)
)
with check (
  sender_id <> auth.uid()
  and public.is_conversation_member(conversation_id)
);

drop policy if exists "Authenticated users can upload chat attachments" on storage.objects;
create policy "Authenticated users can upload chat attachments"
on storage.objects for insert
to authenticated
with check (bucket_id = 'chat-attachments');

drop policy if exists "Authenticated users can read chat attachments" on storage.objects;
create policy "Authenticated users can read chat attachments"
on storage.objects for select
to authenticated
using (bucket_id = 'chat-attachments');

drop policy if exists "Users can upload profile photos" on storage.objects;
create policy "Users can upload profile photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-photos' and owner = auth.uid());

drop policy if exists "Users can update profile photos" on storage.objects;
create policy "Users can update profile photos"
on storage.objects for update
to authenticated
using (bucket_id = 'profile-photos' and owner = auth.uid())
with check (bucket_id = 'profile-photos' and owner = auth.uid());

drop policy if exists "Authenticated users can read profile photos" on storage.objects;
create policy "Authenticated users can read profile photos"
on storage.objects for select
to authenticated
using (bucket_id = 'profile-photos');
