alter table signal_queue enable row level security;
alter table signal_sessions enable row level security;
alter table signal_participants enable row level security;
alter table signal_flags enable row level security;
alter table signal_recent_pairs enable row level security;
alter table signal_events enable row level security;
alter table signal_voice_qos_samples enable row level security;
alter table signal_voice_qos_shares enable row level security;

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
revoke all on signal_voice_qos_shares from anon, authenticated;

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