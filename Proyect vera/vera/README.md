# Vera — Captación de negocios locales (MVP 100% local)

Herramienta para captar negocios locales (odontólogos y centros de estética), generarles
un **demo de página web** automático, contactarlos por **WhatsApp** y hacerles seguimiento
en un **CRM tipo kanban**. Todo corre en tu máquina, sin servicios en la nube y con **costo $0**.

> Cuando un cliente confirma interés, la web real se construye aparte (contigo + Claude Code).
> Vera **no** construye webs reales ni usa IA para los demos: son plantilla + reemplazo de datos.

---

## 🏗️ Arquitectura (todo en una máquina)

```
┌──────────────────────────────────────────────────────────┐
│                    TU COMPUTADOR (local)                  │
│                                                            │
│  ┌────────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │   DASHBOARD    │   │   SQLite DB  │   │  DEMOS HTML │  │
│  │  Next.js 14    │◄─►│  webleads.db │   │ public/demos│  │
│  │  localhost:3000│   │  (archivo)   │   │ (estáticos) │  │
│  └───────┬────────┘   └──────────────┘   └─────────────┘  │
│          │                                                 │
│  ┌───────▼────────┐   ┌──────────────────────────────┐    │
│  │   SCRAPER      │   │   EVOLUTION API (Docker)     │    │
│  │   Playwright   │   │   localhost:8080             │    │
│  │   Google Maps  │   │   → WhatsApp (número dedic.) │    │
│  └────────────────┘   └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

- **Dashboard:** Next.js 14 (App Router) + Tailwind — tema *Editorial Luxury* (papel crema, serif).
- **DB:** SQLite (`webleads.db`) vía `better-sqlite3`. Se crea sola al primer arranque.
- **Scraper:** Playwright headless sobre Google Maps.
- **Demos:** HTML estáticos en `public/demos/{id}/`, servidos en `/demos/{id}/`.
- **WhatsApp:** Evolution API en Docker (`localhost:8080`).

---

## 🚀 Setup (≤6 pasos)

```bash
# 1. Instalar dependencias
npm install

# 2. Navegador para el scraper
npx playwright install chromium

# 3. Variables de entorno
cp .env.example .env.local      # (Windows PowerShell: Copy-Item .env.example .env.local)
#    Edita EVOLUTION_API_KEY con una clave tuya.

# 4. Levantar Evolution API (WhatsApp) — requiere Docker Desktop abierto
docker compose up -d

# 5. Conectar tu WhatsApp: abre http://localhost:8080/manager,
#    crea la instancia "webleads" y escanea el QR con un número DEDICADO.

# 6. Arrancar el dashboard
npm run dev                     # → http://localhost:3000
```

Atajos: `scripts/setup.ps1` (Windows) o `scripts/setup.sh` (macOS/Linux/Git Bash) hacen 1–4.
Para probar el dashboard sin scrapear: `npm run seed` (inserta 5 leads de ejemplo).

> **Nota:** El dashboard funciona aunque Evolution **no** esté conectado. En ese caso, el
> botón de WhatsApp abre `wa.me` para envío manual. Lo único que requiere Docker es el envío
> automático por Evolution.

---

## 🎨 Reemplazar la plantilla de demos por tu propia web

Los demos se generan desde `templates/base/index.html` con **find-and-replace** (sin IA).
Para usar tu propio diseño, edita ese archivo manteniendo los mismos `{{placeholders}}`:

| Placeholder | Qué inyecta |
|---|---|
| `{{NOMBRE}}` | Nombre del negocio |
| `{{CAT_LABEL}}` | "Clínica odontológica" / "Centro de estética" |
| `{{CIUDAD}}` | Ciudad (deducida de la dirección) |
| `{{DIRECCION}}` | Dirección |
| `{{TELEFONO}}` | Teléfono |
| `{{WA_LINK}}` | Link `wa.me` con mensaje pre-cargado |
| `{{MAPS_URL}}` | URL de Google Maps |
| `{{RATING}}` | Calificación (texto) |
| `{{RESENAS}}` / `{{RESENAS_NUM}}` | N.º de reseñas (formateado / numérico) |
| `{{ESTRELLAS}}` | Estrellas ★ según el rating |
| `{{ACENTO}}` / `{{ACENTO_DEEP}}` | Color de acento por categoría (odonto=teal, estética=rosa) |
| `{{HERO_TITULO_1}}` / `{{HERO_TITULO_2}}` | Titular del hero |
| `{{HERO_LEAD}}` / `{{HERO_LEAD_PLAIN}}` | Subtítulo (con/sin HTML) |
| `{{MANIFIESTO}}` / `{{MANIFIESTO_SUB}}` | Bloque de bienvenida |
| `{{SERVICIOS_HTML}}` | Lista de servicios (generada) |
| `{{DIFERENCIADORES_HTML}}` | Sección "Por qué elegirnos" (3 tarjetas con ícono, generada) |
| `{{TICKER_HTML}}` | Cinta de servicios (generada) |
| `{{TESTIMONIO_1..3}}` | Testimonios |
| `{{FAQ_HTML}}` | Preguntas frecuentes (generadas) |
| `{{STAT_3_V}}` / `{{STAT_3_L}}` | Tercera métrica del hero |
| `{{ANIO}}` | Año actual (footer) |

El contenido por categoría (servicios, testimonios, FAQ, colores) vive en
`lib/demo-generator.ts` → `PERFILES`. Ahí ajustas textos y colores.

---

## 🔍 Usar el scraper

**Desde el dashboard:** menú *Capturar leads* → escribe qué buscar + ciudad + cantidad →
*Iniciar búsqueda*. Los resultados aparecen en vivo; selecciona cuáles guardar.

**Desde la terminal:**
```bash
npm run scrape -- --query "estéticas" --ciudad "Cali" --cantidad 30
```

El scraper salta negocios sin teléfono y duplicados (por teléfono). Google Maps cambia su
DOM seguido: si deja de extraer, revisa los selectores en `lib/scraper.ts`.

---

## 🌐 Publicar demos online (GitHub Pages — gratis y permanente)

Para que el demo que envías tenga una URL limpia y profesional (sin IP ni código), Vera
publica los demos en **GitHub Pages**. Configúralo **una sola vez**:

1. En GitHub, crea un repositorio **público** vacío llamado `vera-demos`.
2. En ese repo: *Settings → Pages → Build and deployment → Source: **Deploy from a branch**,
   Branch: `main` / `/ (root)`* → Save. (La URL quedará `https://TU-USUARIO.github.io/vera-demos/`.)
3. Crea un **token**: *GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token*. Dale acceso **solo al repo `vera-demos`** con
   permiso **Contents: Read and write**. Copia el token.
4. Completa en `.env.local`:
   ```env
   GITHUB_TOKEN=el-token
   GITHUB_REPO=TU-USUARIO/vera-demos
   DEMOS_PUBLIC_BASE=https://TU-USUARIO.github.io/vera-demos
   ```
5. Reinicia `npm run dev`. El botón **“⚡ Generar, publicar y enviar”** del detalle del lead
   crea el demo, lo sube a GitHub Pages y envía el WhatsApp con el **link en vivo**.

> Cada demo queda en `https://TU-USUARIO.github.io/vera-demos/{id}/`. La primera publicación
> puede tardar ~1 min (build inicial de Pages); Vera espera a que esté en vivo antes de enviar.
> Sin hosting configurado, el demo funciona local pero el link sería `localhost` (no apto para enviar).

---

## 🔄 Flujo completo

1. **Scrapear** odontólogos/estéticas de una ciudad → se guardan como leads (estado *Nuevo*).
2. **Generar demo** en el detalle del lead → HTML en `/demos/{id}/` (personalizado por negocio).
3. **Enviar** el demo por WhatsApp (Evolution o `wa.me`) → el lead pasa a *Contactado*.
4. **Trackear** en el kanban: arrastra entre columnas, marca temperatura 🔥/🌡️/❄️, toma notas.
5. **Cerrar:** cuando confirme interés, marca *"Confirmó interés en la web"*.
6. **Web real:** la construyes aparte con Claude Code (Vera solo capta y agenda).

---

## ⚠️ Anti-baneo (importante)

WhatsApp banea números que parecen spam. El sistema ya incluye protecciones, pero **respétalas**:

- Usa un **número dedicado** (idealmente WhatsApp Business), no el personal.
- **Envío uno a uno**, nunca masivo en bloque.
- **Límite diario** configurable (`DAILY_MESSAGE_LIMIT`, default 25). El dashboard muestra
  cuántos van hoy y avisa al acercarse al límite.
- **Semana 1: arranca con 5–8/día** (calentamiento) y sube de a poco.
- **Plantillas rotativas** (3 variantes) para no enviar texto idéntico — ver `lib/messages.ts`.
- Deja pasar tiempo entre envíos (no dispares decenas seguidas).

---

## 📁 Estructura

```
vera/
├── app/                  # Next.js App Router (dashboard + API)
│   ├── page.tsx          # Pipeline kanban
│   ├── scraper/          # Captura de leads
│   ├── leads/[id]/       # Detalle del lead
│   ├── inbox/            # Respuestas recientes
│   └── api/              # scrape · leads · demo · whatsapp
├── components/           # Sidebar, Kanban, LeadDetail
├── lib/                  # db · scraper · demo-generator · evolution · messages
├── templates/base/       # Plantilla de demo (Editorial Luxury) con {{placeholders}}
├── public/demos/         # Demos generados (uno por lead)
├── scripts/              # seed · scrape-cli · setup
├── docker-compose.yml    # Evolution API local
└── webleads.db           # SQLite (se genera solo)
```

---

## 🚫 Restricciones de diseño del MVP

Sin nube · sin cuentas de pago · sin IA para demos · sin envío masivo · todo en TypeScript.
Costo total: **$0**.
