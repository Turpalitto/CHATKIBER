-- Thematic channel matching: enum value + channel_id on queue/sessions + stricter peer lookup

do $$
begin
  alter type signal_frequency_kind add value 'channel';
exception
  when duplicate_object then null;
end $$;

alter table signal_queue
  add column if not exists channel_id text;

alter table signal_sessions
  add column if not exists channel_id text;

create index if not exists signal_queue_channel_lookup_idx
  on signal_queue (channel_id, status, created_at)
  where channel_id is not null;

drop function if exists join_signal_queue(text, signal_mode, signal_tone, signal_frequency_kind, bigint, text);

create or replace function join_signal_queue(
  p_anon_token_hash text,
  p_mode signal_mode,
  p_tone signal_tone,
  p_frequency_kind signal_frequency_kind,
  p_frequency_number bigint,
  p_frequency_prompt text,
  p_channel_id text default null
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
    channel_id,
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
    p_channel_id,
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
    channel_id = excluded.channel_id,
    status = 'queued',
    created_at = timezone('utc', now()),
    expires_at = timezone('utc', now()) + interval '15 minutes'
  returning * into waiting_row;

  select q.*
  into peer_row
  from signal_queue q
  where q.anon_token_hash <> p_anon_token_hash
    and q.status = 'queued'
    and q.expires_at > timezone('utc', now())
    and mode_compatible(p_mode, q.mode)
    and tone_compatible(p_tone, q.tone)
    and (
      case
        when p_frequency_kind = 'channel' then
          q.frequency_kind = 'channel'
          and p_channel_id is not null
          and q.channel_id = p_channel_id
        else
          q.frequency_kind = p_frequency_kind
          and q.frequency_number = p_frequency_number
      end
    )
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
    channel_id,
    status,
    started_at,
    expires_at
  )
  values (
    p_frequency_kind,
    p_frequency_number,
    p_frequency_prompt,
    p_channel_id,
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

grant execute on function join_signal_queue(text, signal_mode, signal_tone, signal_frequency_kind, bigint, text, text) to anon, authenticated;
