import * as mammoth from 'mammoth';
import fs from 'fs';
const buffer = fs.readFileSync('/home/hnoloh/Escritorio/MVP1_PARTE2_IMPLEMENTATION_INDEX_V3_HERRAMIENTAS_ENTI_ARTEFACTOS_GENERADOS_ANTI_BLOQUEO.docx');
mammoth.extractRawText({ buffer }).then(result => {
  console.log("Characters:", result.value.length);
  console.log("Words:", result.value.split(/\s+/).length);
}).catch(console.error);
