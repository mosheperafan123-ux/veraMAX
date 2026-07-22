#!/usr/bin/env bash
#
# vera-loop — Loop autónomo LOCAL para el proyecto Vera (sin git/PR/CI).
# Combina: Continuous Claude (#4, adaptado a local) + De-Sloppify (#5) + gate de verificación.
#
# Uso:
#   bash .claude/skills/vera-loop/loop.sh --prompt "TAREA" [--max-runs N] [--review-prompt "..."]
#
# Requiere: claude CLI en PATH, Node 22+ (node:sqlite), npm.

set -uo pipefail

# ---------- Config por defecto ----------
PROMPT=""
MAX_RUNS=8
REVIEW_PROMPT=""
COMPLETION_SIGNAL="VERA_LOOP_COMPLETE"
COMPLETION_THRESHOLD=2          # iteraciones seguidas con la señal para parar
NOTES_FILE="SHARED_TASK_NOTES.md"
MODEL_IMPL="${VERA_LOOP_MODEL_IMPL:-sonnet}"
MODEL_REVIEW="${VERA_LOOP_MODEL_REVIEW:-opus}"

# Pasos de verificación de Vera (editá según el proyecto):
VERIFY_CMD="${VERA_LOOP_VERIFY:-npm run lint && npm run build && npm test}"

# ---------- Parseo de flags ----------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt)           PROMPT="$2"; shift 2 ;;
    --max-runs)         MAX_RUNS="$2"; shift 2 ;;
    --review-prompt)    REVIEW_PROMPT="$2"; shift 2 ;;
    --completion-signal) COMPLETION_SIGNAL="$2"; shift 2 ;;
    --verify)           VERIFY_CMD="$2"; shift 2 ;;
    *) echo "Flag desconocido: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$PROMPT" ]]; then
  echo "ERROR: falta --prompt \"qué querés que haga el loop\"" >&2
  exit 1
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "ERROR: no encuentro el comando 'claude' en el PATH." >&2
  exit 1
fi

# ---------- Notas compartidas (puente de contexto) ----------
if [[ ! -f "$NOTES_FILE" ]]; then
  cat > "$NOTES_FILE" <<EOF
# SHARED_TASK_NOTES — vera-loop

## Tarea
$PROMPT

## Progreso
(todavía nada)

## Próximos pasos
- Arrancar por el ítem de mayor valor pendiente

## Errores capturados
(ninguno)
EOF
  echo "→ Creado $NOTES_FILE"
fi

consecutive_done=0

# ---------- Loop principal ----------
for ((i=1; i<=MAX_RUNS; i++)); do
  echo ""
  echo "=================================================="
  echo "  vera-loop — Iteración $i / $MAX_RUNS"
  echo "=================================================="

  # 1+2. IMPLEMENTAR (contexto fresco; lee las notas)
  echo "→ [1/4] Implementando..."
  claude -p --model "$MODEL_IMPL" \
    "Lee $NOTES_FILE para el estado y la tarea. Avanzá el ítem pendiente de mayor valor de esta tarea: $PROMPT. Sé exhaustivo. NO crees archivos de documentación nuevos. Al terminar, actualizá la sección Progreso y Próximos pasos de $NOTES_FILE."

  # 3. DE-SLOPPIFY (contexto separado, foco en limpiar el código)
  echo "→ [2/4] De-sloppify (limpieza de código)..."
  claude -p --model "$MODEL_REVIEW" \
    "Revisá TODOS los cambios recientes en el working tree. Eliminá: tests que verifican comportamiento del lenguaje/framework en vez de lógica de negocio; type checks redundantes que el sistema de tipos ya garantiza; manejo de errores sobre-defensivo para estados imposibles; console.log; código comentado. MANTENÉ todos los tests de lógica de negocio real. No agregues features."

  # 3b. Review extra opcional
  if [[ -n "$REVIEW_PROMPT" ]]; then
    echo "→ [2b] Review adicional..."
    claude -p --model "$MODEL_REVIEW" "$REVIEW_PROMPT"
  fi

  # 4. VERIFICAR (gate). Si falla, capturamos el error para la próxima vuelta.
  echo "→ [3/4] Verificando: $VERIFY_CMD"
  verify_log="$(mktemp)"
  if bash -c "$VERIFY_CMD" >"$verify_log" 2>&1; then
    echo "  ✓ Verificación verde."
  else
    echo "  ✗ Verificación falló — paso fix a la próxima iteración."
    {
      echo ""
      echo "## Errores capturados (iteración $i)"
      echo '```'
      tail -n 60 "$verify_log"
      echo '```'
    } >> "$NOTES_FILE"
    # Pasada de fix inmediata con el contexto del error
    claude -p --model "$MODEL_IMPL" \
      "La verificación ($VERIFY_CMD) falló. Lee los errores en la sección 'Errores capturados' al final de $NOTES_FILE, reproducí y arreglá la causa raíz. No agregues features. Volvé a correr la verificación mentalmente y dejá el árbol en verde."
  fi
  rm -f "$verify_log"

  # 5+6. ¿Completo? El implementador emite la señal en las notas si la checklist está cumplida.
  echo "→ [4/4] Chequeando completitud..."
  signal_check="$(claude -p --model "$MODEL_REVIEW" \
    "Lee $NOTES_FILE y el estado del código. ¿La tarea ($PROMPT) está COMPLETA según la checklist de calidad Vera (funciona en local, node:sqlite, demos /index.html, Evolution v1, modo prueba, sin slop, verificación verde)? Si está 100% completa respondé EXACTAMENTE con el texto $COMPLETION_SIGNAL y nada más. Si falta algo, respondé qué falta en una línea.")"

  echo "  $signal_check"
  if echo "$signal_check" | grep -q "$COMPLETION_SIGNAL"; then
    consecutive_done=$((consecutive_done+1))
    echo "  (señal de completitud $consecutive_done/$COMPLETION_THRESHOLD)"
    if [[ $consecutive_done -ge $COMPLETION_THRESHOLD ]]; then
      echo ""
      echo "✅ Tarea completa tras $i iteraciones. Loop terminado."
      exit 0
    fi
  else
    consecutive_done=0
  fi
done

echo ""
echo "⏹  Alcanzado el límite de $MAX_RUNS iteraciones. Revisá $NOTES_FILE para el estado."
