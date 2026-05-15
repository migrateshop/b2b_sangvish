const fs = require('fs');
const path = require('path');

// Update .env files
['.env', '.env.local', '.env.development', '.env.production'].forEach(f => {
  const filePath = path.join(__dirname, f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/REACT_APP_/g, 'NEXT_PUBLIC_');
    content = content.replace(/VITE_/g, 'NEXT_PUBLIC_');
    fs.writeFileSync(filePath, content);
  }
});

// Update source code references
function traverseDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) return;
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const orig = content;
      content = content.replace(/REACT_APP_/g, 'NEXT_PUBLIC_');
      content = content.replace(/VITE_/g, 'NEXT_PUBLIC_');
      if (content !== orig) fs.writeFileSync(fullPath, content);
    }
  });
}

// Ensure the command_status of Move-Item has finished before this runs, or just run over everything
['components', 'hooks', 'context', 'services', 'utils', 'app'].forEach(d => traverseDir(path.join(__dirname, d)));
console.log('Environment variables updated.');
