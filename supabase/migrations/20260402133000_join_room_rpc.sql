create or replace function public.join_room_by_code(
  p_code text,
  p_display_name text,
  p_password text default null
)
returns table (
  room_id uuid,
  room_code text,
  seat_index integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_existing_seat integer;
  v_taken integer;
  v_seat integer := 0;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(trim(p_display_name), '') = '' then
    raise exception 'DISPLAY_NAME_REQUIRED';
  end if;

  select *
  into v_room
  from public.rooms
  where code = upper(trim(p_code))
  limit 1;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_room.status <> 'LOBBY' then
    raise exception 'ROOM_NOT_JOINABLE';
  end if;

  if v_room.password_hash is not null and v_room.password_hash <> coalesce(trim(p_password), '') then
    raise exception 'INVALID_PASSWORD';
  end if;

  select rp.seat_index
  into v_existing_seat
  from public.room_players rp
  where rp.room_id = v_room.id
    and rp.user_id = auth.uid()
  limit 1;

  if found then
    return query
    select v_room.id, v_room.code, v_existing_seat;
    return;
  end if;

  select count(*)
  into v_taken
  from public.room_players rp
  where rp.room_id = v_room.id;

  if v_taken >= v_room.max_players then
    raise exception 'ROOM_FULL';
  end if;

  while exists (
    select 1
    from public.room_players rp
    where rp.room_id = v_room.id
      and rp.seat_index = v_seat
  ) loop
    v_seat := v_seat + 1;
  end loop;

  insert into public.room_players (
    room_id,
    user_id,
    display_name,
    is_host,
    seat_index,
    presence
  ) values (
    v_room.id,
    auth.uid(),
    trim(p_display_name),
    false,
    v_seat,
    'online'
  );

  return query
  select v_room.id, v_room.code, v_seat;
end;
$$;

grant execute on function public.join_room_by_code(text, text, text) to authenticated;
