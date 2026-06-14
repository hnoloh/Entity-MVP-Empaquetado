const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/components/Workspace/__tests__');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('btn-close-editor')) {
    // Reemplazamos screen.getByTestId('btn-close-editor') por document.querySelector('.tab-close') o el de la tab activa
    // Ya que JSDOM soporta querySelector
    // Mejor: fireEvent.click(document.querySelector('.tab-close')!)
    
    // Pero en tests unitarios como EntiEditor.test.tsx, no hay tab.
    if (file.includes('EntiEditor.test.tsx')) {
        // En EntiEditor.test.tsx, el componente se renderiza solo.
        // Como eliminamos el botón, tenemos que disparar el evento window
        content = content.replace(/fireEvent\.click\(screen\.getByTestId\(['"]btn-close-editor['"]\)\);/g, 
            "window.dispatchEvent(new CustomEvent('request-close-editor', { detail: { id: 'E1' } }));");
    } else if (file.includes('WorkspaceMultiEditorIntegration.test.tsx')) {
        // within(editor1Restored).getByTestId('btn-close-editor') -> document.querySelector(`[data-testid="tab-close-${enti1.id}"]`)
        content = content.replace(/fireEvent\.click\(within\(.*?\)\.getByTestId\(['"]btn-close-editor['"]\)\);/g, 
            "fireEvent.click(document.querySelector('[data-testid=\"tab-close-E1\"]')!);");
    } else {
        // Generic integration test
        // Usamos screen.getAllByTitle('Cerrar pestaña')[0] que funciona en la mayoría
        // O mejor: fireEvent.click(document.querySelector('.tab-close')!)
        content = content.replace(/screen\.getByTestId\(['"]btn-close-editor['"]\)/g, 
            "document.querySelector('.tab-close')!");
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
