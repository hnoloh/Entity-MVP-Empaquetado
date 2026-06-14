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

  if (content.includes("document.querySelector('.tab-close')!")) {
    content = content.replace(/document\.querySelector\('\.tab-close'\)!/g, "screen.getAllByTitle('Cerrar pestaña')[0]");
    changed = true;
  }
  
  if (content.includes('btn-close-editor')) {
    content = content.replace(/screen\.getByTestId\(['"]btn-close-editor['"]\)/g, "screen.getAllByTitle('Cerrar pestaña')[0]");
    changed = true;
  }

  // Fallback para getAllByTestId('btn-close-editor')
  if (content.includes('getAllByTestId("btn-close-editor")') || content.includes("getAllByTestId('btn-close-editor')")) {
    content = content.replace(/screen\.getAllByTestId\(['"]btn-close-editor['"]\)/g, "screen.getAllByTitle('Cerrar pestaña')");
    changed = true;
  }

  // En WorkspaceMultiEditorIntegration.test.tsx
  if (content.includes("querySelector('[data-testid=\"btn-close-editor\"]')")) {
    content = content.replace(/querySelector\('\[data-testid="btn-close-editor"\]'\)/g, "querySelector('.tab-close')");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
