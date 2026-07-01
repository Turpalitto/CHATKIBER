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

create table if not exists signal_voice_qos_shares (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  session_id uuid not null references signal_sessions(id) on delete cascade,
  anon_token_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '24 hours'
);

create index if not exists signal_voice_qos_shares_expiry_idx
  on signal_voice_qos_shares (expires_at);