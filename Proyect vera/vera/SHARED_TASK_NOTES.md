# vera-loop · Barrido de pulido visual del template (ronda 2)

**Tarea:** arreglar bugs visuales del template base y barrer "miles de detalles"
de calidad, en ambos verticales dental (990001) y estética (990002), hasta que
quede impecable. Solo cambios en `templates/base/index.html` (+ generator si hace
falta). Verificar con tsc + tests + preview (desktop y móvil).

## Gate de esta ronda
- [ ] Contraste de texto SIEMPRE legible (independiente de la imagen detrás)
- [ ] Ninguna sección 100vh corta contenido en alturas reales de laptop
- [ ] Botones consistentes (hover, foco, tamaño táctil, contraste)
- [ ] Sin overflow horizontal
- [ ] tsc 0 + 24/24 tests verdes
- [ ] Verificado en preview (1440×900 y 390×844) ambos verticales

## Issues detectados y RESUELTOS
1. [HECHO] `.gserv.off` = texto blanco sobre glass blanco .2 → invisible sobre
   imagen clara ("Coronas Dentales"). Fix: glass ahumado `rgba(15,15,17,.34)` +
   text-shadow + borde del número translúcido. Contraste garantizado sin importar
   la imagen. Verificado desktop (1440) y móvil (390), dental + estética.
2. [HECHO] **Mismo bug** en `.s3-ov .ovc.g` ("Cuidado de los Implantes" sobre la
   imagen clara de la modelo). Mismo fix (glass ahumado). Verificado.
3. [HECHO] Secciones `height:100vh; overflow:hidden` (gallery + s3) recortaban
   contenido en laptops bajas. Fix: desktop usa `min-height:100vh` → la sección
   crece y nunca corta. Verificado a 650px (s3 crece a 997px sin clip) y 768px.
4. [HECHO] **A11y**: no existía ningún `:focus-visible` (solo hover). Añadido
   anillo de foco monocromo global (negro + halo blanco) visible sobre cualquier
   fondo; solo afecta a navegación por teclado.
5. [VERIFICADO OK] Barrido: sin overflow horizontal (1425=scrollW); servicios,
   planes/medios de pago, FAQ, contacto y footer revisados visualmente — limpios.
   Consola sin warnings/errores.

## Verificación final ronda 2 (gate verde)
- tsc 0 · 24/24 tests · demos 200 · sin overflow horizontal
- Contraste OK en glass cards (gallery + s3) desktop y móvil, ambos verticales
- min-height: 100vh sin clipping a 650/768/900
- Sin slop (3 fixes de glass comparten el mismo valor; foco = 1 regla global)

---

# vera-loop · Mejoras del SISTEMA (track Conversión, proceso superpowers)

Se clonó `obra/superpowers` en `tests/superpowers` (metodología: spec→plan→TDD→
verificar; no es un kit de features). Se adopta el PROCESO. Track elegido por el
usuario: **Conversión**, proceso **completo** (spec+plan+TDD por mejora).

## Mejora #1 — Scraper captura presencia web (HECHO, gate verde)
**Por qué:** atacar primero a los negocios SIN web (es el pitch). Antes `sitio_web`
se llenaba a mano; la señal se perdía en el scrape.
- `normalizeWebsite(raw)` en `lib/scraper.ts` (pura, TDD: 7 tests). Limpia a
  `https://host[/path]`; devuelve null si vacío/no-URL/**Google**/**redes**
  (facebook, instagram, linktr.ee, wa.me…) → null = "no tiene web propia".
- `extractFromPanel` lee `a[data-item-id="authority"]` y lo normaliza →
  `ScrapedBusiness.sitio_web`.
- `NewLead.sitio_web` + `insertLead` lo persiste (verificado por integración con
  DB temporal: insert + filtro).
- `listLeads({ sinWeb })` filtra `sitio_web IS NULL OR trim()=''`.
- UI (`Kanban.tsx`): badge **◆ sin web** (clay, candidato ideal) vs **tiene web**
  (tenue) + toggle **"Solo sin web"**. Verificado en Next dev: 12 sin web / 2 con
  web, filtro 14→12 ocultando los 2 con web.
- Gate: tsc 0 · **31/31 tests** (24+7) · `npm run dev` 200 sin errores · de-sloppify.

## Mejora #2 — Tracking de apertura de demo → lead caliente (HECHO, gate verde)
**Por qué:** abrir la demo es la señal de intención más fuerte; saber quién la
abrió te dice a quién llamar YA.
- `lib/track.ts`: `TRANSPARENT_GIF` (1×1) + `marcarDemoAbierta(leadId)` →
  incrementa `aperturas`, set `demo_abierta_en`, `temperatura='caliente'`;
  devuelve `firstOpen` para avisar una sola vez.
- `trackPixelUrl(leadId, base?)` en `demo-generator.ts` (pura, TDD 4 tests). Usa
  `VERA_PUBLIC_URL`; '' si no hay base o id inválido.
- Generador inyecta `{{TRACK_PIXEL}}` (img 1×1 oculta) SOLO si hay
  `VERA_PUBLIC_URL` (2 tests: con/sin). **Bug arreglado:** `</body></html>`
  estaba DUPLICADO en la plantilla.
- `GET /api/track?lead=ID` (`app/api/track/route.ts`): registra apertura, avisa
  en la 1ª (`notificarAperturaDemo` en notify.ts) y SIEMPRE responde el GIF.
- DB: columnas `aperturas`, `demo_abierta_en` (migrate idempotente) + en `Lead`.
- UI: badge **👀 abrió ×N** (clay) en `Kanban.tsx` + tarjeta de alta intención en
  `LeadDetail.tsx`.
- **⚠️ Requiere URL pública** (túnel a localhost, igual que el webhook). Sin
  `VERA_PUBLIC_URL` no se inyecta el pixel (degradable, cero ruido).
- Verificación: tsc 0 · **38/38 tests** (31+7) · E2E contra dev: `/api/track`
  devuelve image/gif no-store; lead pasó tibio→caliente, aperturas 0→2,
  `demo_abierta_en` con fecha. Badge renderiza en SSR.

## Mejora #3 — Mapa de ubicación real + "Cómo llegar" (HECHO, gate verde)
**Por qué:** personalización geográfica real; el botón "Cómo llegar" rutea desde
la ubicación actual del lead a la clínica (alto valor para agendar).
- `mapaEmbedUrl(direccion, nombre?)` UNIFICADA + exportada (antes había una local
  sin exportar y un replacement MUERTO `MAPA_EMBED_URL` cuyo placeholder ya no
  existía en la plantilla monocroma → ELIMINADO). Embed clásico `output=embed`
  (sin API key), guarda '' si no hay dirección. TDD: 4 tests.
- Generador inyecta `{{MAPA_BLOCK}}`: card redondeada con iframe en **escala de
  grises** (on-theme B/N) + barra de acciones: **"Cómo llegar"** (pill negro →
  `maps/dir/?api=1&destination=` = rutea desde ubicación actual) y "Ver en Google
  Maps" (→ maps_url). Solo si hay dirección (degradable).
- Replicado del proyecto viejo `C:\Users\moshe\Documents\Proyect vera\vera`
  (read-only) que el usuario señaló: ahí ya usaban `output=embed` (→ funciona;
  el blanco en mi preview es el sandbox que bloquea iframes externos).
- Verificado: la barra de acciones renderiza on-theme (pill negro, dirección,
  link). El iframe NO se ve en el preview (sandbox) pero es framable por headers
  (`/maps/embed` 200 sin X-Frame-Options) y ya probado en demos reales del user.
- Gate: tsc 0 · **42/42 tests** (38+4) · ambos verticales generan el bloque.

## Track Conversión — COMPLETO (#1, #2, #3)

## Track "No quemar el número" — COMPLETO (gate verde)
Base + 3 protecciones, con ajustes configurables en el dashboard (lo pidió el user).
- **Settings store:** tabla `config` (k/v) + `getConfig/setConfig` en db.ts. Capa
  `lib/antiban.ts`: `getAjustes/setAjustes` (config con defaults de .env).
- **Opt-out** (`esOptOut`, pura, TDD): el webhook detecta bajas ("no me interesa",
  "no escriban", "quítenme", "stop"…) → lead `descartado` + nota + `notificarOptOut`.
  Conservador (no marca "no gracias"/"no sé"). E2E: lead→descartado.
- **Horario hábil** (`dentroDeHorario`, pura, TDD, hora de Colombia UTC-5):
  `puedeEnviarAhora()` bloquea envíos (inicial y seguimientos) fuera de ventana
  (409 / skip), salvo TEST_MODE. E2E: enHorario=false con día excluido.
- **Idempotencia webhook:** columna `mensajes.evo_id` + índice único; `addMensaje`
  con `evoId` usa INSERT OR IGNORE y devuelve si insertó. E2E: 2º hit mismo id →
  actualizados:0, sin duplicar.
- **Dashboard:** `/ajustes` (página + `AjustesForm` + `/api/ajustes` GET/POST):
  horario (desde/hasta), días activos, límite diario. Link en Sidebar. El límite
  diario se movió de env a ajustes (whatsapp + followups usan `getAjustes`).
- Gate: tsc 0 · **48/48 tests** (42+6) · e2e opt-out/idempotencia/horario verde.
  (Screenshot del preview flaky esta sesión → verificado por DOM + curl.)

Pendiente futuro (no pedido): always-on (DIFERIDO por user), reseñas/horario reales
de Maps, warm-up/ramp explícito.

## Track "Robustez" — EN CURSO
- [HECHO] **Backup de la DB** (`lib/backup.ts`): `crearRespaldo()` con `VACUUM INTO`
  (consistente con WAL) → `backups/webleads-YYYYMMDD-HHmmss.db`, rota últimos 10.
  Puras TDD (`nombreRespaldo`/`seleccionarParaBorrar`/`hayRespaldoDeHoy`).
  Auto-respaldo diario al abrir `/ajustes`. `/api/backup` (POST/GET/descargar).
  UI card "Respaldo de datos" (crear + lista + descargar). `backups/` en .gitignore.
  Gate: tsc 0 · **52/52 tests** (48+4) · e2e: DB descargada = SQLite válida con datos.
- [PEND] scraper resiliente, tests de db/webhook/followups, vista de métricas/embudo.

## Estado general de tracks (para retomar tras compactar)
- ✅ Conversión (#1 web-presence, #2 pixel [dormido], #3 mapa+"Cómo llegar")
- ✅ No quemar el número (opt-out, horario, idempotencia, ajustes en dashboard)
- ✅ Robustez → Backup DB (resto pendiente)
- ⏸️ Always-on (DIFERIDO por el user)
Comandos: `npm run verify` (tsc+tests). Preview: `next dev` por Bash (launcher MCP
no cita rutas con espacio). Reiniciar dev tras cambios de columnas/tablas DB.

> Decisiones abiertas: (a) NO auto-excluir leads con web (solo filtrar/badge);
> (b) abrir demo → caliente (elegido). El usuario puede cambiarlas.
> Nota infra: el launcher de preview no cita rutas con espacio ("Proyect vera");
> `next dev` se levanta por Bash y se verifica con curl. Reiniciar dev tras
> cambiar columnas de DB (el singleton no re-migra en caliente).
