const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // React Router replacements
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, (match, imports) => {
    const importList = imports.split(',').map(i => i.trim());
    let nextNavigationImports = [];
    let nextLink = false;
    let newImports = '';

    if (importList.includes('Link')) {
      nextLink = true;
    }
    if (importList.includes('useNavigate')) nextNavigationImports.push('useRouter');
    if (importList.includes('useLocation')) nextNavigationImports.push('usePathname', 'useSearchParams');
    if (importList.includes('useParams')) nextNavigationImports.push('useParams');
    if (importList.includes('useSearchParams')) nextNavigationImports.push('useSearchParams');

    if (nextLink) {
      newImports += "import Link from 'next/link';\n";
    }
    if (nextNavigationImports.length > 0) {
      // Deduplicate
      nextNavigationImports = [...new Set(nextNavigationImports)];
      newImports += `import { ${nextNavigationImports.join(', ')} } from 'next/navigation';\n`;
    }
    return newImports.trim();
  });

  content = content.replace(/useNavigate\(\)/g, "useRouter()");
  content = content.replace(/useLocation\(\)/g, "usePathname()");
  content = content.replace(/<Link([^>]+)to=/g, "<Link$1href=");

  // CSS Modules Replacement
  // Match `import './Search.css';`
  const cssRegex = /import\s+['"]\.\/([^'"]+)\.css['"];?/g;
  let hasCssImport = false;
  content = content.replace(cssRegex, (match, name) => {
    hasCssImport = true;
    // Rename actual CSS file
    const cssPath = path.join(path.dirname(filePath), `${name}.css`);
    const moduleCssPath = path.join(path.dirname(filePath), `${name}.module.css`);
    if (fs.existsSync(cssPath)) {
        try {
            fs.renameSync(cssPath, moduleCssPath);
        } catch(e) {}
    }
    return `import styles from './${name}.module.css';`;
  });

  if (hasCssImport) {
    // Very basic mapping for simple className="foo bar"
    // Note: this is a heuristic to satisfy strict module requirement
    content = content.replace(/className=(['"])(.*?)\1/g, (match, quote, classes) => {
      const clsList = classes.split(' ').map(c => `styles['${c.trim()}']`).join(' + " " + ');
      return `className={${clsList}}`;
    });
  }

  // Next/Image Replacement (Basic)
  // content = content.replace(/<img(.*?)src=(.*?)\/?>/g, "<Image$1src=$2 width={500} height={500} />");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
  }

  // Rename to .tsx or .ts
  if (filePath.endsWith('.js')) {
    const isReact = content.includes('import React') || content.match(/<[A-Z][A-Za-z0-9]+/);
    const newExt = isReact ? '.tsx' : '.tsx'; // Defaulting to tsx to be safe
    fs.renameSync(filePath, filePath.replace(/\.js$/, newExt));
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) return;
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  });
}

traverseDir(path.join(__dirname, 'src'));
console.log('Refactoring complete.');
