# Runbook de Operacion - Sushi Go! Online

## 1. Objetivo
Este runbook cubre ejecucion local, migraciones, despliegue y respuesta a incidentes frecuentes para Next.js + Supabase.

## 2. Requisitos previos
- Node.js 20+
- npm 10+
- Supabase CLI instalada y autenticada (`supabase login`)
- Variables de entorno de cliente y servidor configuradas

## 3. Arranque local
1. Iniciar stack Supabase local:
```bash
supabase start
```
2. Aplicar esquema y semillas:
```bash
supabase db reset
```
3. Levantar frontend:
```bash
npm run dev
```

## 4. Migraciones
- Ver estado local/remoto:
```bash
supabase migration list
```
- Aplicar en local:
```bash
supabase migration up
```
- Aplicar en remoto (proyecto linkeado):
```bash
supabase db push
```
- Reparar historial si hay drift:
```bash
supabase migration repair <version> --status applied
```

## 5. Pruebas y QA
- Lint:
```bash
npm run lint
```
- Integracion realtime:
```bash
npm run test:integration
```
- E2E criticos:
```bash
npm run test:e2e
```
- Pipeline local sugerido:
```bash
npm run qa
```

## 6. Despliegue
### Frontend (Vercel)
1. Conectar repositorio en Vercel.
2. Configurar env vars de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Ejecutar build en preview y validar pantallas clave.
4. Promover a production.

### Supabase
1. Confirmar proyecto remoto linkeado:
```bash
supabase link --project-ref <project-ref>
```
2. Aplicar migraciones pendientes:
```bash
supabase db push
```
3. Desplegar Edge Functions:
```bash
supabase functions deploy room-command
supabase functions deploy turn-resolver
```

## 7. Checklist de salida a produccion
- [ ] `npm run build` exitoso
- [ ] `npm run qa` exitoso
- [ ] `supabase migration list` sin drift
- [ ] RLS validada para crear/unir sala, lobby, juego, scoreboard e historial
- [ ] Funciones Edge desplegadas en version actual
- [ ] Monitoreo/logs activos

## 8. Incidentes comunes
### Error RLS al crear/unir sala
- Verificar policies de `room_players`.
- Confirmar sesion anonima habilitada en Supabase.
- Revisar error exacto en logs de API.

### Drift de migraciones
- Ejecutar `supabase migration list`.
- Resolver con `supabase migration repair`.
- Volver a ejecutar `supabase db push`.

### Cliente no recibe realtime
- Confirmar Realtime habilitado en proyecto.
- Validar canales `room:<id>` y permisos RLS.
- Revisar reconexion y presencia de jugadores.
