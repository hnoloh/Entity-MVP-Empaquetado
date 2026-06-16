#!/bin/bash
OUT="/home/hnoloh/.gemini/antigravity-cli/brain/8f74a460-2da1-4b9a-808d-2c556647c821/RV04_LOCK_Review.md"

echo "# RV-04 LOCK Review" > $OUT
echo "" >> $OUT
echo "Aquí tienes el código de la UI del Chat consolidado tras todas las iteraciones de diseño y refactorización, listo para pasar a LOCK." >> $OUT
echo "" >> $OUT

for FILE in src/components/Chat/ChatView.tsx src/components/Chat/ChatView.css src/components/ChatWindow/ChatWindowView.tsx src/components/ChatWindow/ChatWindow.css; do
  echo "## \`$FILE\`" >> $OUT
  if [[ $FILE == *.css ]]; then
    echo '```css' >> $OUT
  else
    echo '```tsx' >> $OUT
  fi
  cat $FILE >> $OUT
  echo '```' >> $OUT
  echo "" >> $OUT
done
