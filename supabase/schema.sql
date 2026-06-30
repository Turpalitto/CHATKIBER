-- SIGNAL ephemeral secure relay schema
-- Privacy-first by design:
-- - no permanent message storage
-- - no stored voice recordings
-- - short-lived matching metadata only
-- - short-lived relay events used for secure delivery and WebRTC signaling

create extension if not exists pgcrypto;

create type signal_frequency_kind as enum ('daily', 'random');
create type signal_session_status as enum ('queued', 'matched', 'active', 'ended', 'expired', 'flagged');
create type signal_mode as enum ('listen', 'talk', 'both');
create type signal_tone as enum ('calm', 'deep', 'funny', 'debate', 'random');

create table if not exists signal_queue (
  id uuid primary key default gen_random_uuid(),
  anon_token_hash text not null unique,
  mode signal_mode not null,
  tone signal_tone not null,
  frequency_kind signal_frequency_kind not null,
  frequency_number bigint not null,
  frequency_prompt text not null,
  status signal_session_status not null default 'queued',
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '15 minutes'
);

create index if not exists signal_queue_lookup_idx
  on signal_queue (frequency_kind, frequency_number, status, created_at);

create table if not exists signal_sessions (
  id uuid primary key default gen_random_uuid(),
  frequency_kind signal_frequency_kind not null,
  frequency_number bigint not null,
  frequency_prompt text not null,
  status signal_session_status not null default 'matched',
  channel_key text not null unique default encode(gen_random_bytes(16), 'hex'),
  matched_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz not null default timezone('utc', now()) + interval '6 hours'
);

create table if not exists signal_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references signal_sessions(id) on delete cascade,
  anon_token_hash text not null,
  mode signal_mode not null,
  tone signal_tone not null,
  joined_at timestamptz not null default timezone('utc', now()),
  left_at timestamptz,
  unique (session_id, anon_token_hash)
);

create index if not exists signal_participants_session_idx
  on signal_participants (session_id);

create table if not exists signal_flags (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references signal_sessions(id) on delete cascade,
  anon_token_hash text not null,
  category text not null,
  severity int not null default 1 check (severity between 1 and 5),
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists signal_recent_pairs (
  pair_hash text primary key,
  first_token_hash text not null,
  second_token_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days'
);

create table if not exists signal_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references signal_sessions(id) on delete cascade,
  sender_token_hash text not null,
  recipient_token_hash text not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '10 minutes'
);

create table if not exists signal_voice_qos_samples (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references signal_sessions(id) on delete cascade,
  anon_token_hash text not null,
  sample jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '12 hours'
);

create index if not exists signal_recent_pairs_expiry_idx
  on signal_recent_pairs (expires_at);

create index if not exists signal_events_recipient_idx
  on signal_events (session_id, recipient_token_hash, created_at);

create index if not exists signal_voice_qos_session_idx
  on signal_voice_qos_samples (session_id, anon_token_hash, created_at);

create index if not exists signal_voice_qos_shares_expiry_idx
  on signal_voice_qos_shares (expires_at);

create or replace function signal_pair_hash(a text, b text)
returns text
language sql
immutable
as $$
  select md5(case when a < b then a || ':' || b else b || ':' || a end);
$$;

create or replace function mode_compatible(a signal_mode, b signal_mode)
returns boolean
language sql
immutable
as $$
  select
    (a = 'both' and b = 'both')
    or (a = 'listen' and b in ('talk', 'both'))
    or (a = 'talk' and b in ('listen', 'both'))
    or (a = 'both' and b in ('listen', 'talk', 'both'))
    or (b = 'both' and a in ('listen', 'talk', 'both'));
$$;

create or replace function tone_compatible(a signal_tone, b signal_tone)
returns boolean
language sql
immutable
as $$
  select a = b or a = 'random' or b = 'random';
$$;

create or replace function join_signal_queue(
  p_anon_token_hash text,
  p_mode signal_mode,
  p_tone signal_tone,
  p_frequency_kind signal_frequency_kind,
  p_frequency_number bigint,
  p_frequency_prompt text
)
returns table (
  matched boolean,
  session_id uuid,
  channel_key text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  waiting_row signal_queue;
  peer_row signal_queue;
  created_session signal_sessions;
  pair_key text;
begin
  delete from signal_queue where expires_at < timezone('utc', now());
  delete from signal_recent_pairs where expires_at < timezone('utc', now());
  delete from signal_events where expires_at < timezone('utc', now());
  delete from signal_voice_qos_samples where expires_at < timezone('utc', now());

  insert into signal_queue (
    anon_token_hash,
    mode,
    tone,
    frequency_kind,
    frequency_number,
    frequency_prompt,
    status,
    expires_at
  )
  values (
    p_anon_token_hash,
    p_mode,
    p_tone,
    p_frequency_kind,
    p_frequency_number,
    p_frequency_prompt,
    'queued',
    timezone('utc', now()) + interval '15 minutes'
  )
  on conflict (anon_token_hash)
  do update set
    mode = excluded.mode,
    tone = excluded.tone,
    frequency_kind = excluded.frequency_kind,
    frequency_number = excluded.frequency_number,
    frequency_prompt = excluded.frequency_prompt,
    status = 'queued',
    created_at = timezone('utc', now()),
    expires_at = timezone('utc', now()) + interval '15 minutes'
  returning * into waiting_row;

  select q.*
  into peer_row
  from signal_queue q
  where q.anon_token_hash <> p_anon_token_hash
    and q.status = 'queued'
    and q.frequency_kind = p_frequency_kind
    and q.frequency_number = p_frequency_number
    and q.expires_at > timezone('utc', now())
    and mode_compatible(p_mode, q.mode)
    and tone_compatible(p_tone, q.tone)
    and not exists (
      select 1
      from signal_recent_pairs rp
      where rp.pair_hash = signal_pair_hash(p_anon_token_hash, q.anon_token_hash)
        and rp.expires_at > timezone('utc', now())
    )
  order by q.created_at asc
  for update skip locked
  limit 1;

  if peer_row.id is null then
    return query select false, null::uuid, null::text;
    return;
  end if;

  insert into signal_sessions (
    frequency_kind,
    frequency_number,
    frequency_prompt,
    status,
    started_at,
    expires_at
  )
  values (
    p_frequency_kind,
    p_frequency_number,
    p_frequency_prompt,
    'active',
    timezone('utc', now()),
    timezone('utc', now()) + interval '6 hours'
  )
  returning * into created_session;

  insert into signal_participants (session_id, anon_token_hash, mode, tone)
  values
    (created_session.id, p_anon_token_hash, p_mode, p_tone),
    (created_session.id, peer_row.anon_token_hash, peer_row.mode, peer_row.tone);

  pair_key := signal_pair_hash(p_anon_token_hash, peer_row.anon_token_hash);

  insert into signal_recent_pairs (pair_hash, first_token_hash, second_token_hash)
  values (pair_key, p_anon_token_hash, peer_row.anon_token_hash)
  on conflict (pair_hash) do nothing;

  delete from signal_queue where id in (waiting_row.id, peer_row.id);

  return query select true, created_session.id, created_session.channel_key;
end;
$$;

create or replace function await_signal_match(p_anon_token_hash text)
returns table (
  matched boolean,
  session_id uuid,
  channel_key text
)
language sql
security definer
set search_path = public
as $$
  select true, s.id, s.channel_key
  from signal_sessions s
  join signal_participants sp on sp.session_id = s.id
  where sp.anon_token_hash = p_anon_token_hash
    and s.status in ('matched', 'active')
    and s.ended_at is null
    and s.expires_at > timezone('utc', now())
  order by coalesce(s.started_at, s.matched_at) desc
  limit 1;
$$;

create or replace function leave_signal_queue(p_anon_token_hash text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from signal_queue where anon_token_hash = p_anon_token_hash;
$$;

create or replace function leave_signal_session(p_session_id uuid, p_anon_token_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update signal_participants
  set left_at = timezone('utc', now())
  where session_id = p_session_id
    and anon_token_hash = p_anon_token_hash
    and left_at is null;

  update signal_sessions
  set status = 'ended',
      ended_at = coalesce(ended_at, timezone('utc', now()))
  where id = p_session_id
    and status in ('matched', 'active');

  delete from signal_events
  where session_id = p_session_id
    and recipient_token_hash = p_anon_token_hash;
end;
$$;

create or replace function end_signal_session(p_session_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update signal_sessions
  set status = 'ended',
      ended_at = timezone('utc', now())
  where id = p_session_id;
$$;

create or replace function cleanup_expired_signal_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from signal_queue where expires_at < timezone('utc', now());
  delete from signal_recent_pairs where expires_at < timezone('utc', now());
  delete from signal_events where expires_at < timezone('utc', now());
  delete from signal_voice_qos_samples where expires_at < timezone('utc', now());
  delete from signal_flags where created_at < timezone('utc', now()) - interval '14 days';
  delete from signal_participants
    where left_at is not null and left_at < timezone('utc', now()) - interval '2 days';
  update signal_sessions
    set status = 'expired', ended_at = coalesce(ended_at, timezone('utc', now()))
    where expires_at < timezone('utc', now()) and status in ('matched', 'active');
end;
$$;

alter table signal_queue enable row level security;
alter table signal_sessions enable row level security;
alter table signal_participants enable row level security;
alter table signal_flags enable row level security;
alter table signal_recent_pairs enable row level security;
alter table signal_events enable row level security;
alter table signal_voice_qos_samples enable row level security;

drop policy if exists signal_queue_no_direct_access on signal_queue;
drop policy if exists signal_sessions_no_direct_access on signal_sessions;
drop policy if exists signal_participants_no_direct_access on signal_participants;
drop policy if exists signal_flags_no_direct_access on signal_flags;
drop policy if exists signal_recent_pairs_no_direct_access on signal_recent_pairs;
drop policy if exists signal_events_no_direct_access on signal_events;
drop policy if exists signal_voice_qos_no_direct_access on signal_voice_qos_samples;

create policy signal_queue_no_direct_access on signal_queue for all using (false) with check (false);
create policy signal_sessions_no_direct_access on signal_sessions for all using (false) with check (false);
create policy signal_participants_no_direct_access on signal_participants for all using (false) with check (false);
create policy signal_flags_no_direct_access on signal_flags for all using (false) with check (false);
create policy signal_recent_pairs_no_direct_access on signal_recent_pairs for all using (false) with check (false);
create policy signal_events_no_direct_access on signal_events for all using (false) with check (false);
create policy signal_voice_qos_no_direct_access on signal_voice_qos_samples for all using (false) with check (false);
create policy signal_voice_qos_shares_no_direct_access on signal_voice_qos_shares for all using (false) with check (false);

revoke all on signal_queue from anon, authenticated;
revoke all on signal_sessions from anon, authenticated;
revoke all on signal_participants from anon, authenticated;
revoke all on signal_flags from anon, authenticated;
revoke all on signal_recent_pairs from anon, authenticated;
revoke all on signal_events from anon, authenticated;
revoke all on signal_voice_qos_samples from anon, authenticated;

grant execute on function join_signal_queue(text, signal_mode, signal_tone, signal_frequency_kind, bigint, text) to anon, authenticated;
grant execute on function await_signal_match(text) to anon, authenticated;
grant execute on function leave_signal_queue(text) to anon, authenticated;
grant execute on function leave_signal_session(uuid, text) to anon, authenticated;
grant execute on function end_signal_session(uuid) to anon, authenticated;

comment on table signal_queue is 'Ephemeral waiting room for anonymous participants.';
comment on table signal_sessions is 'Short-lived session metadata. No permanent transcript storage.';
comment on table signal_recent_pairs is 'Short-lived pair memory to prevent intentional or accidental rematching.';
comment on table signal_events is 'Short-lived secure relay queue for text, disconnect, and WebRTC signaling events.';
comment on table signal_voice_qos_samples is 'Short-lived session-scoped voice transport diagnostics history.';
