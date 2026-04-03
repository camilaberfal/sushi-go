-- Permite al host de la sala actualizar highlights en match_history
-- para corregir/normalizar métricas forenses tras finalizar una partida.

create policy "match_history_update_room_host"
on public.match_history
for update
using (
  exists (
    select 1
    from public.games g
    join public.rooms r
      on r.id = g.room_id
    where g.id = match_history.game_id
      and r.host_id = auth.uid()
  )
)
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
