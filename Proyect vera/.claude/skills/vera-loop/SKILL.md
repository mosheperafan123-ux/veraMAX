---
name: vera-loop
description: >-
  Loop autónomo local para el proyecto Vera (sin git/PR). Claude ejecuta el
  ciclo directamente en la app: implementar → de-sloppify → verificar →
  actualizar notas → repetir, autocorrigiéndose contra la checklist de calidad
  Vera hasta cumplirla o agotar el límite de vueltas. Usar cuando el usuario
  quiere que Claude avance solo sobre una tarea de Vera.
---

# vera-loop

Loop autónomo **local** para el proyecto Vera. Combina el patrón **Continuous
Claude (#4)** (mecánica de iteración con notas compartidas y señal de
completitud) con el patrón **De-Sloppify (#5)** (pasada de limpieza de código)
y un gate de verificación.

Origen de los patrones: `.agents/skills/autonomous-loops/SKILL.md`.

## Modo de uso (lo importante)

**Modo app (por defecto — el que usás).** Claude Code dentro de la app de Claude
ES el motor del loop. No hace falta ningún comando externo. Cuando se invoca esta
skill, **Claude ejecuta el ciclo directamente** con sus propias herramientas
(editar archivos, correr `npm` por Bash, previsualizar). El usuario da la tarea
una vez y Claude itera solo, reportando el progreso.

**Modo terminal (opcional).** Si algún día se corre desde una terminal con el
CLI `claude` instalado, existe `loop.sh` que hace lo mismo con `claude -p`. No
es necesario para el uso normal en la app.

## El ciclo que ejecuta Claude

Repetir hasta cumplir la checklist o llegar al límite de vueltas acordado
(por defecto ~8, o lo que pida el usuario):

1. **Leer estado** — abrir `SHARED_TASK_NOTES.md` (si no existe, crearlo con la
   tarea, progreso vacío y próximos pasos). Es el puente de contexto entre
   vueltas.
2. **Implementar** — avanzar el ítem pendiente de mayor valor. Ser exhaustivo.
   No crear archivos de documentación nuevos salvo que se pidan.
3. **De-sloppify** — releer críticamente lo recién cambiado (como si fuera de
   otro autor) y borrar el slop: tests que verifican el lenguaje/framework en
   vez de lógica de negocio, type checks redundantes, manejo de errores
   sobre-defensivo para estados imposibles, `console.log`, código comentado.
   Mantener todos los tests de lógica real. Esto NO es `/compact` — limpia el
   **código**, no el contexto.
4. **Verificar (gate)** — correr lint + build + tests por Bash (o levantar el
   dev server y revisar consola/preview). Si algo falla: **capturar el error en
   las notas y arreglar la causa raíz** antes de seguir — no reintentar a
   ciegas.
5. **Actualizar notas** — reflejar en `SHARED_TASK_NOTES.md` qué se hizo y qué
   falta.
6. **¿Checklist completa?** — si sí, parar y reportar. Si no, volver a 1.

Parar también si: se alcanzó el límite de vueltas, o dos vueltas seguidas no
producen avance real (evita loops infinitos).

## Checklist de calidad Vera (el gate)

Un ítem solo se marca hecho si cumple:

- [ ] **Funciona en local**: `npm run dev` levanta sin errores en consola.
- [ ] **node:sqlite**: usa el módulo nativo `node:sqlite`, NO `better-sqlite3`.
- [ ] **Demos**: las URLs de demos apuntan a `/index.html` (no a la raíz).
- [ ] **Evolution API**: requests usan el body de Evolution **v1**; el loop de
      conflictos está contemplado.
- [ ] **Modo prueba**: respeta el flag de modo prueba (no manda mensajes reales
      cuando está activo).
- [ ] **Sin slop**: pasó el de-sloppify.
- [ ] **Verificación verde**: build + lint + tests pasan.
- [ ] **Notas actualizadas**: `SHARED_TASK_NOTES.md` refleja el estado real.

> Ajustá esta checklist según la tarea concreta antes de arrancar.

## Anti-patrones (de #4/#5)

1. **Loop sin condición de salida** — siempre un límite de vueltas o señal de fin.
2. **Sin puente de contexto** — `SHARED_TASK_NOTES.md` conecta las vueltas.
3. **Reintentar el mismo fallo a ciegas** — capturar el error y atacarlo.
4. **Instrucciones negativas** — no "no hagas X"; usar la pasada de de-sloppify.
5. **Implementador = revisor sin distancia** — al de-sloppify, mirar el código
   con ojos críticos como si fuera de otro.
