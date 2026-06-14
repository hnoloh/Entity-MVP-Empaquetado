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

  const replacePatterns = [
    { from: /screen\.getAllByTitle\('Cerrar pestaña'\)\[0\]/g, to: "screen.getByTestId('btn-close-editor')" },
    { from: /document\.querySelector\('\.tab-close'\)!/g, to: "screen.getByTestId('btn-close-editor')" },
    { from: /screen\.getAllByTitle\('Cerrar pestaña'\)/g, to: "screen.getAllByTestId('btn-close-editor')" },
    { from: /querySelector\('\.tab-close'\)/g, to: "querySelector('[data-testid=\"btn-close-editor\"]')" },
    { from: /fireEvent\.click\(document\.querySelector\('\.tab-close'\)!\);/g, to: "fireEvent.click(screen.getByTestId('btn-close-editor'));" },
    { from: /const btnClose = screen\.getByTestId\('tab-close-.*?'\);/g, to: "const btnClose = screen.getByTestId('btn-close-editor');" },
    { from: /fireEvent\.click\(screen\.getByTestId\('tab-close-.*?'\)\);/g, to: "fireEvent.click(screen.getByTestId('btn-close-editor'));" },
  ];

  replacePatterns.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Reverted', file);
  }
});
