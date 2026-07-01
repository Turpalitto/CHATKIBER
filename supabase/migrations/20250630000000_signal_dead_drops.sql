create table if not exists signal_dead_drops (
  id uuid primary key default gen_random_uuid(),
  date_key text not null,
  frequency_number bigint not null,
  body text not null check (char_length(body) <= 140),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '24 hours'
);

create index if not exists signal_dead_drops_lookup_idx
  on signal_dead_drops (date_key, frequency_number, expires_at desc);

comment on table signal_dead_drops is 'Ephemeral notes left on daily frequency for the next stranger.';
