function extractFirstValidString(obj: unknown, forbidden: string[]): string | null {
  if (typeof obj === 'string') {
    const isForbidden = forbidden.some(f => obj.includes(f));
    // string literal "string" is also forbidden to avoid "type": "string" leak
    if (!isForbidden && obj !== 'string') return obj;
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = extractFirstValidString(item, forbidden);
      if (res) return res;
    }
  } else if (typeof obj === 'object' && obj !== null) {
    // Priority keys
    const r = obj as Record<string, unknown>;
    if (typeof r.value === 'string' && r.value !== 'string') return r.value;
    if (typeof r.content === 'string' && r.content !== 'string') return r.content;
    if (typeof r.text === 'string' && r.text !== 'string') return r.text;
    
    // Any other key except 'type'
    for (const key of Object.keys(obj)) {
      if (key === 'type') continue;
      const res = extractFirstValidString(r[key], forbidden);
      if (res) return res;
    }
  }
  return null;
}

function sanitizeArgValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  
  let parsedValue = value;
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Ignore
    }
  }

  if (typeof parsedValue === 'object' && parsedValue !== null) {
    const forbidden = [
      'The text content to be written',
      'Name of the file',
      'The operation to perform',
      'Relative path',
      'Tu respuesta conversacional',
      'The text content' // General rule
    ];
    
    const extracted = extractFirstValidString(parsedValue, forbidden);
    if (extracted) return extracted;

    // Si no extrajo nada útil, devuelve el string original o lo stringifica
    return typeof value === 'string' ? value : JSON.stringify(parsedValue);
  }
  
  return String(parsedValue);
}

export function parseToolCallsIntoXml(toolCalls: Array<{ function: { name: string, arguments: string | Record<string, unknown> } }>): string {
  let responseText = '';
  for (const toolCall of toolCalls) {
    if (toolCall.function.name === 'generate_docx') {
      try {
        const args = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        const filename = sanitizeArgValue(args.filename) || 'documento.docx';
        const content = sanitizeArgValue(args.content) || ' ';
        responseText += `\n<generate_docx filename="${filename}">${content}</generate_docx>\n`;
      } catch {
        responseText += `\n[Error parsing tool arguments for docx]\n`;
      }
    } else if (toolCall.function.name === 'generate_pdf') {
      try {
        const args = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        const filename = sanitizeArgValue(args.filename) || 'documento.pdf';
        const content = sanitizeArgValue(args.content) || ' ';
        responseText += `\n<generate_pdf filename="${filename}">${content}</generate_pdf>\n`;
      } catch {
        responseText += `\n[Error parsing tool arguments for pdf]\n`;
      }
    } else if (toolCall.function.name === 'generate_html') {
      try {
        const args = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        const filename = sanitizeArgValue(args.filename) || 'index.html';
        const content = sanitizeArgValue(args.content) || ' ';
        responseText += `\n<generate_html filename="${filename}">${content}</generate_html>\n`;
      } catch {
        responseText += `\n[Error parsing tool arguments for html]\n`;
      }
    } else if (toolCall.function.name === 'manage_local_filesystem') {
      try {
        const args = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        
        let pathValue = sanitizeArgValue(args.relativePath);
        if (pathValue === '<nil>' || pathValue === 'null' || pathValue === 'undefined' || pathValue === '') {
          if (args.operation === 'create_directory') pathValue = 'nueva_carpeta';
          else pathValue = '';
        }
        
        const contentValue = sanitizeArgValue(args.content);
        responseText += `\n<manage_local_filesystem operation="${sanitizeArgValue(args.operation)}" relativePath="${pathValue}">${contentValue}</manage_local_filesystem>\n`;
      } catch {
        responseText += `\n[Error parsing tool arguments for local filesystem]\n`;
      }
    } else if (toolCall.function.name === 'reply_to_user') {
      try {
        const args = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        const msg = sanitizeArgValue(args.message);
        responseText += `\n${msg}\n`;
      } catch {
        responseText += `\n[Error parsing reply message]\n`;
      }
    }
  }
  return responseText;
}
