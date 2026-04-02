create extension if not exists pgcrypto;

create type public.room_status as enum (
  'LOBBY',
  'ROUND_1',
  'ROUND_2',
  'ROUND_3',
  'WAITING_SCOREBOARD',
  'FINAL_PODIUM'
);

create type public.game_status as enum (
  'IN_PROGRESS',
  'FINISHED',
  'ABORTED'
);

create type public.player_presence as enum (
  'online',
  'offline',
  'bot'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users(id) on delete cascade,
  max_players smallint not null check (max_players between 2 and 5),
  password_hash text,
  status public.room_status not null default 'LOBBY',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_players (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  is_host boolean not null default false,
  seat_index smallint not null check (seat_index >= 0),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  presence public.player_presence not null default 'online',
  disconnected_at timestamptz,
  primary key (room_id, user_id),
  unique (room_id, seat_index)
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete set null,
  status public.game_status not null default 'IN_PROGRESS',
  current_round smallint not null default 1 check (current_round between 1 and 3),
  current_turn smallint not null default 1 check (current_turn >= 1),
  deck_seed text,
  analytics jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_play_time_ms integer check (total_play_time_ms is null or total_play_time_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_players (
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  final_score integer not null default 0,
  puddings integer not null default 0,
  score_by_round integer[] not null default '{0,0,0}'::integer[],
  is_bot boolean not null default false,
  turn_metrics jsonb not null default '{"turns": []}'::jsonb,
  primary key (game_id, user_id),
  constraint score_by_round_len check (array_length(score_by_round, 1) = 3)
);

create table public.turn_actions (
  id bigserial primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  round smallint not null check (round between 1 and 3),
  turn smallint not null check (turn >= 1),
  user_id uuid references auth.users(id) on delete set null,
  selected_card_id text not null,
  selected_card_type text not null,
  use_chopsticks boolean not null default false,
  submitted_at timestamptz not null default now(),
  is_bot boolean not null default false,
  unique (game_id, round, turn, user_id)
);

create table public.round_summaries (
  id bigserial primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  round smallint not null check (round between 1 and 3),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (game_id, round)
);

create table public.match_history (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null unique references public.games(id) on delete cascade,
  winner_user_id uuid references auth.users(id) on delete set null,
  total_duration_ms integer not null default 0 check (total_duration_ms >= 0),
  card_play_count jsonb not null default '{}'::jsonb,
  total_points_by_card jsonb not null default '{}'::jsonb,
  highlights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();
