drop policy if exists "room_players_insert_self_or_host" on public.room_players;

create policy "room_players_insert_self"
on public.room_players
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
);
