create index rooms_host_status_idx on public.rooms (host_id, status);
create index rooms_code_idx on public.rooms (code);

create index room_players_room_presence_idx on public.room_players (room_id, presence);
create index room_players_user_idx on public.room_players (user_id);

create index games_room_status_idx on public.games (room_id, status);
create index games_started_at_idx on public.games (started_at desc);

create index game_players_game_score_idx on public.game_players (game_id, final_score desc);
create index game_players_user_idx on public.game_players (user_id);

create index turn_actions_game_round_turn_idx on public.turn_actions (game_id, round, turn);
create index turn_actions_room_time_idx on public.turn_actions (room_id, submitted_at desc);

create index round_summaries_game_idx on public.round_summaries (game_id);
create index match_history_created_idx on public.match_history (created_at desc);

alter table public.rooms replica identity full;
alter table public.room_players replica identity full;
alter table public.games replica identity full;
alter table public.game_players replica identity full;
alter table public.turn_actions replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.room_players;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.games;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.game_players;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.turn_actions;
exception
  when duplicate_object then null;
end $$;
