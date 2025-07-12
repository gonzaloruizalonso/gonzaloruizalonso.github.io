// netlify-ignore.js
const { execSync } = require('child_process');

try {
  // Lista de archivos cambiados entre este commit y el anterior
  const diff = execSync('git diff --name-only HEAD~1 HEAD')
    .toString()
    .trim()
    .split('\n');

  // Si **todos** los archivos son EXACTAMENTE 'lists.json', salta el build
  const onlyListsJson = diff.length > 0 && diff.every(f => f === 'lists.json');

  if (onlyListsJson) {
    console.log('Sólo ha cambiado lists.json → Skip build');
    process.exit(0);  // 0 = “no error, salto build”
  }
} catch (e) {
  // si algo falla, no skippeamos, que haga el build normal
  console.error('Error comprobando cambios:', e);
}

// Si llegamos aquí, netlify sigue con el build (exit ≠ 0)
process.exit(1);
