# Oculus Masters — Landing (Grand Slam Offer)

Página web de marketing para **Oculus Masters**: servicio de configuración e instalación
de un catálogo de juegos VR para Meta Quest en Colombia (pago único).

La estructura de la oferta sigue la metodología de **Alex Hormozi (`$100M Offers`)**:
ecuación de valor, *value stacking*, bonos apilados, anclaje de precio, reversión de
riesgo (garantía) y urgencia.

## 🚀 Cómo ejecutarla

```bash
npm install      # instala Vite
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # genera la versión de producción en /dist
npm run preview  # previsualiza el build de producción
```

No requiere base de datos ni backend: es un sitio estático que se puede desplegar en
Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc. (sube la carpeta `dist/`).

## 📁 Estructura

```
oculus-masters-web/
├── index.html              # Landing principal
├── terminos.html           # Términos y Condiciones
├── privacidad.html         # Política de Privacidad (Habeas Data)
├── vite.config.js          # Config multipágina (MPA)
├── package.json
├── public/
│   ├── assets/logo.png      # Logo / favicon
│   └── data/catalog.json    # Catálogo real (categorías, top juegos, totales)
└── src/
    ├── styles/              # CSS modular
    │   ├── base.css         # Tokens, reset, tipografía, fondo
    │   ├── components.css   # Glass panels, botones, value-stack, catálogo
    │   ├── layout.css       # Nav, hero, footer, responsive
    │   └── main.css         # Entrada (importa todo)
    ├── js/
    │   ├── main.js          # Punto de entrada
    │   ├── catalog.js       # Render del catálogo + marquee desde el JSON
    │   ├── counter.js       # Animación count-up de cifras
    │   ├── nav.js           # Menú móvil / hamburguesa
    │   └── reveal.js        # Animaciones de entrada al hacer scroll
    └── data/
        └── offer.js         # Datos de la oferta (value stack, bonos, ecuación)
```

## 🎨 Diseño

Construido desde cero con la skill **`high-end-visual-design`**:
- **Vibe:** *Editorial Luxury* — papel crema cálido `#FAF6EF`, tonos espresso/salvia/terracota,
  textura de grano de película, washes ambientales sutiles.
- **Layout:** *Editorial Split* — tipografía serif enorme a un lado, índice/contenido al otro.
- **Tipografía:** Zodiak (serif display de alto contraste) + General Sans (texto).
- **Componentes:** paneles anidados (*Double-Bezel*) en tonos cálidos, ledger de oferta tipo
  "recibo de lujo", catálogo como índice editorial numerado, sello de garantía dorado.
- **Motion:** revelados con `IntersectionObserver`, curvas cubic-bezier personalizadas,
  ticker editorial y físicas de hover en botones.

> Nota: este diseño es un rediseño completo y deliberadamente distinto del sitio anterior
> (que usaba un tema oscuro "Ethereal Glass"). Solo se reutilizó la **información**
> (nombre, juegos, precio, proceso, textos legales), no el CSS ni la estructura.

## 💰 Estimación de costos (de dónde sale el "$48.343 USD")

La cifra de anclaje de valor proviene del **catálogo real del programa
[Rookie Sideloader](https://github.com/VRPirates/rookie)** (carpeta `rookie-3.1`), cruzado
con el `data.js` del sitio anterior, que contiene precio estimado por juego.

| Métrica | Valor |
|---|---|
| Juegos totales | **2.722** |
| Categorías | **12** |
| **Valor sumando el precio de cada juego** | **≈ $48.343 USD** |
| Peso total del catálogo | ≈ 3.993 GB |

Top categorías por cantidad: *Casual y Otros* (1.612), *Acción y Disparos* (204),
*RPG y Aventura* (150), *Simulación* (129), *Puzles* (117)…

> El cálculo es la suma de `estimated_price_usd` de los 2.722 títulos del catálogo.
> Es una estimación de referencia para comunicar el valor frente al precio de venta
> ($200.000 COP), no un precio oficial de Meta.

## ⚠️ Notas legales

Las páginas legales son plantillas base. Antes de publicar, completa razón social, NIT,
domicilio y correo de contacto. El sitio incluye el descargo de no afiliación con Meta.
