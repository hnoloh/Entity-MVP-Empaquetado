const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/components/Workspace/__tests__');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("getByTestId('btn-close-editor')") || content.includes('getByTestId("btn-close-editor")')) {
    content = content.replace(/screen\.getByTestId\(['"]btn-close-editor['"]\)/g, "screen.getAllByTestId('btn-close-editor')[0]");
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
