const { execSync } = require('child_process');
try {
  execSync('npm run typecheck > typecheck4.log', { stdio: 'inherit' });
} catch (e) {
}
console.log('Typecheck finished.');
