create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_players rp
    where rp.room_id = target_room_id
      and rp.user_id = auth.uid()
  );
$$;

create or replace function public.is_game_member(target_game_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_players gp
    where gp.game_id = target_game_id
      and gp.user_id = auth.uid()
  );
$$;

grant execute on function public.is_room_member(uuid) to authenticated, anon;
grant execute on function public.is_game_member(uuid) to authenticated, anon;

drop policy if exists "rooms_select_members" on public.rooms;
create policy "rooms_select_members"
on public.rooms
for select
using (public.is_room_member(rooms.id));

drop policy if exists "room_players_select_same_room" on public.room_players;
create policy "room_players_select_same_room"
on public.room_players
for select
using (public.is_room_member(room_players.room_id));

drop policy if exists "games_select_room_members" on public.games;
create policy "games_select_room_members"
on public.games
for select
using (public.is_room_member(games.room_id));

drop policy if exists "game_players_select_game_members" on public.game_players;
create policy "game_players_select_game_members"
on public.game_players
for select
using (
  public.is_game_member(game_players.game_id)
  or exists (
    select 1
    from public.games g
    where g.id = game_players.game_id
      and public.is_room_member(g.room_id)
  )
);

drop policy if exists "turn_actions_select_game_members" on public.turn_actions;
create policy "turn_actions_select_game_members"
on public.turn_actions
for select
using (
  exists (
    select 1
    from public.games g
    where g.id = turn_actions.game_id
      and public.is_room_member(g.room_id)
  )
);

drop policy if exists "round_summaries_select_game_members" on public.round_summaries;
create policy "round_summaries_select_game_members"
on public.round_summaries
for select
using (
  exists (
    select 1
    from public.games g
    where g.id = round_summaries.game_id
      and public.is_room_member(g.room_id)
  )
);

drop policy if exists "match_history_select_game_members" on public.match_history;
create policy "match_history_select_game_members"
on public.match_history
for select
using (public.is_game_member(match_history.game_id));
