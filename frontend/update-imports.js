const fs = require('fs');
const path = require('path');

// Maps old src/folder aliases to new Next.js folders
const replacements = [
  { regex: /['"](\.\.\/)+components\/(.*?)['"]/g, rep: "'@/components/$2'" },
  { regex: /['"](\.\.\/)+hooks\/(.*?)['"]/g, rep: "'@/hooks/$2'" },
  { regex: /['"](\.\.\/)+context\/(.*?)['"]/g, rep: "'@/context/$2'" },
  { regex: /['"](\.\.\/)+utils\/(.*?)['"]/g, rep: "'@/utils/$2'" },
  { regex: /['"](\.\.\/)+api\/(.*?)['"]/g, rep: "'@/services/$2'" },
  { regex: /['"]\.\/api\/(.*?)['"]/g, rep: "'@/services/$1'" },
  { regex: /['"]\.\/components\/(.*?)['"]/g, rep: "'@/components/$1'" },
  { regex: /['"](\.\.\/)+pages\/(.*?)['"]/g, rep: "'@/app/pages/$2'" },
  { regex: /['"]\.\/pages\/(.*?)['"]/g, rep: "'@/app/pages/$1'" },
  { regex: /['"]@\/src\/pages\/(.*?)['"]/g, rep: "'@/app/pages/$1'" },
  { regex: /['"]@\/src\/components\/(.*?)['"]/g, rep: "'@/components/$1'" },
  { regex: /['"]@\/src\/(.*?)['"]/g, rep: "'@/$1'" }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(r => {
    content = content.replace(r.regex, r.rep);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
  }
}

function traverseDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) return;
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  });
}

['src', 'app'].forEach(d => traverseDir(path.join(__dirname, d)));
console.log('Imports updated.');
