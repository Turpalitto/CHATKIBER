create table if not exists signal_receipts (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  date_key text not null,
  frequency_number bigint not null,
  frequency_kind text not null check (frequency_kind in ('daily', 'random')),
  duration_seconds integer not null check (duration_seconds >= 0),
  silence_ratio real not null check (silence_ratio >= 0 and silence_ratio <= 1),
  tone_alignment real not null check (tone_alignment >= 0 and tone_alignment <= 1),
  protocol_breach boolean not null default false,
  summary_line text not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days'
);

create index if not exists signal_receipts_lookup_idx
  on signal_receipts (date_key, frequency_number, created_at desc);

create index if not exists signal_receipts_expires_idx
  on signal_receipts (expires_at);

comment on table signal_receipts is 'Ephemeral session receipts for frequency analytics. No message content stored.';

alter table signal_dead_drops enable row level security;
alter table signal_receipts enable row level security;

drop policy if exists signal_dead_drops_no_direct_access on signal_dead_drops;
drop policy if exists signal_receipts_no_direct_access on signal_receipts;

create policy signal_dead_drops_no_direct_access on signal_dead_drops for all using (false) with check (false);
create policy signal_receipts_no_direct_access on signal_receipts for all using (false) with check (false);

revoke all on signal_dead_drops from anon, authenticated;
revoke all on signal_receipts from anon, authenticated;
