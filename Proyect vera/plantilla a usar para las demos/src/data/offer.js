/* ============================================================
   OFFER DATA — Grand Slam Offer (metodología Alex Hormozi)
   Cifras derivadas del catálogo real del programa Rookie Sideloader
   (ver public/data/catalog.json — 2.722 juegos, valor $48.343 USD).
   ============================================================ */

export const PRICE_COP = 200000;      // pago único
export const PRICE_OLD_COP = 400000;  // ancla "antes"
export const PRICE_USD = 50;          // ≈ pago único en dólares
export const PRICE_OLD_USD = 100;     // ≈ ancla "antes" en dólares
export const USD_TO_COP = 4000;       // aprox. para conversiones de muestra

export const totals = {
  games: 2722,
  categories: 12,
  valueUsd: 48343,            // suma de estimated_price_usd de todo el catálogo
  sizeGb: 3993,
  visors: 230,
};

/* — El "Value Stack": todo lo que recibe el cliente con su valor — */
export const valueStack = [
  {
    label: 'Catálogo completo de +2.722 juegos VR',
    note: 'Comprados uno a uno costarían $48.343 USD (≈ $193.000.000 COP)',
    value: '$193.000.000',
  },
  {
    label: 'Instalación remota acompañada por un técnico',
    note: 'Lo dejamos funcionando contigo en vivo, sin tecnicismos',
    value: '$120.000',
  },
  {
    label: 'Actualizaciones y títulos nuevos sin costo extra',
    note: 'El catálogo crece y tú no vuelves a pagar',
    value: 'Incluido',
  },
  {
    label: 'Soporte experto post-instalación',
    note: 'Te acompañamos hasta que todo quede perfecto',
    value: '$80.000',
  },
];

/* — La ecuación de valor de Hormozi aplicada — */
export const valueEquation = [
  {
    dir: 'up',
    title: 'Sueño cumplido',
    desc: 'Miles de mundos VR listos para jugar hoy mismo, sin límites.',
  },
  {
    dir: 'up',
    title: 'Probabilidad de logro',
    desc: '+230 visores configurados y garantía de reembolso del 100%.',
  },
  {
    dir: 'down',
    title: 'Tiempo de espera',
    desc: 'Configuración el mismo día. Te pones las gafas y a jugar.',
  },
  {
    dir: 'down',
    title: 'Esfuerzo y sacrificio',
    desc: 'Nosotros hacemos todo el trabajo técnico de forma remota.',
  },
];

export const whatsappLink = 'https://wa.link/kfzofc';
