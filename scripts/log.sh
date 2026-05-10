#!/bin/bash

DATE=$(date +%F)
TIME=$(date +"%H:%M")

mkdir -p docs/daily-journal

FILE="docs/daily-journal/$DATE.md"

# Crear encabezado si no existe
if [ ! -f "$FILE" ]; then
  echo "# FoodSPV - Bitácora Operacional ($DATE)" > "$FILE"
  echo "" >> "$FILE"
fi

# Agregar evento
echo "## $TIME - $1" >> "$FILE"

echo "✅ Evento registrado en $FILE"
