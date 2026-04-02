alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.turn_actions enable row level security;
alter table public.round_summaries enable row level security;
alter table public.match_history enable row level security;

create policy "rooms_select_members"
on public.rooms
for select
using (
  exists (
    select 1
    from public.room_players rp
    where rp.room_id = rooms.id
      and rp.user_id = auth.uid()
  )
);

create policy "rooms_insert_host"
on public.rooms
for insert
with check (host_id = auth.uid());

create policy "rooms_update_host"
on public.rooms
for update
using (host_id = auth.uid())
with check (host_id = auth.uid());

create policy "rooms_delete_host"
on public.rooms
for delete
using (host_id = auth.uid());

create policy "room_players_select_same_room"
on public.room_players
for select
using (
  exists (
    select 1
    from public.room_players rp
    where rp.room_id = room_players.room_id
      and rp.user_id = auth.uid()
  )
);

create policy "room_players_insert_self_or_host"
on public.room_players
for insert
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and r.host_id = auth.uid()
  )
);

create policy "room_players_update_self_or_host"
on public.room_players
for update
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and r.host_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and r.host_id = auth.uid()
  )
);

create policy "room_players_delete_self_or_host"
on public.room_players
for delete
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and r.host_id = auth.uid()
  )
);

create policy "games_select_room_members"
on public.games
for select
using (
  exists (
    select 1
    from public.room_players rp
    where rp.room_id = games.room_id
      and rp.user_id = auth.uid()
  )
);

create policy "games_insert_room_host"
on public.games
for insert
with check (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and r.host_id = auth.uid()
  )
);

create policy "games_update_room_host"
on public.games
for update
using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and r.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and r.host_id = auth.uid()
  )
);

create policy "game_players_select_game_members"
on public.game_players
for select
using (
  exists (
    select 1
    from public.game_players gp
    where gp.game_id = game_players.game_id
      and gp.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.games g
    join public.room_players rp
      on rp.room_id = g.room_id
    where g.id = game_players.game_id
      and rp.user_id = auth.uid()
  )
);

create policy "game_players_insert_room_host"
on public.game_players
for insert
with check (
  exists (
    select 1
    from public.games g
    join public.rooms r
      on r.id = g.room_id
    where g.id = game_id
      and r.host_id = auth.uid()
  )
);

create policy "game_players_update_room_host"
on public.game_players
for update
using (
  exists (
    select 1
    from public.games g
    join public.rooms r
      on r.id = g.room_id
    where g.id = game_id
      and r.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.games g
    join public.rooms r
      on r.id = g.room_id
    where g.id = game_id
      and r.host_id = auth.uid()
  )
);

create policy "turn_actions_select_game_members"
on public.turn_actions
for select
using (
  exists (
    select 1
    from public.games g
    join public.room_players rp
      on rp.room_id = g.room_id
    where g.id = turn_actions.game_id
      and rp.user_id = auth.uid()
  )
);

create policy "turn_actions_insert_self_or_host"
on public.turn_actions
for insert
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.games g
    join public.rooms r
      on r.id = g.room_id
    where g.id = game_id
      and r.host_id = auth.uid()
  )
);

create policy "round_summaries_select_game_members"
on public.round_summaries
for select
using (
  exists (
    select 1
    from public.games g
    join public.room_players rp
      on rp.room_id = g.room_id
    where g.id = round_summaries.game_id
      and rp.user_id = auth.uid()
  )
);

create policy "round_summaries_manage_room_host"
on public.round_summaries
for all
using (
  exists (
    select 1
    from public.games g
    join public.rooms r
      on r.id = g.room_id
    where g.id = round_summaries.game_id
      and r.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.games g
    join public.rooms r
      on r.id = g.room_id
    where g.id = round_summaries.game_id
      and r.host_id = auth.uid()
  )
);

create policy "match_history_select_game_members"
on public.match_history
for select
using (
  exists (
    select 1
    from public.game_players gp
    where gp.game_id = match_history.game_id
      and gp.user_id = auth.uid()
  )
);

create policy "match_history_insert_room_host"
on public.match_history
for insert
with check (
  exists (
    select 1
    from public.games g
    join public.rooms r
      on r.id = g.room_id
    where g.id = match_history.game_id
      and r.host_id = auth.uid()
  )
);
