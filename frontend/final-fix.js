const fs = require('fs');
const path = require('path');

// 1. Fix globals.css properly
let cssPath = 'src/app/globals.css';
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    // First, remove any broken @import fragments at the very top
    css = css.replace(/^@import url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;[\s\S]*?&display=swap['"]\);/g, '');
    css = css.replace(/^@import[\s\S]*?&display=swap['"]\);/g, '');
    
    // Clean all @import references anywhere in the file
    css = css.replace(/@import url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;[\s\S]*?&display=swap['"]\);/g, '');
    
    // One final cleanup of start of file to avoid junk
    css = css.replace(/^[\s\d;&]*?:root/, ':root');

    const cleanImport = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');\n\n";
    fs.writeFileSync(cssPath, cleanImport + css);
}

// 2. Fix broken imports in all TSX files
function fixFile(fullPath) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let orig = content;
    // Fix src/src/ issue
    content = content.replace(/['"]\.\.\/src\/(.*?)['"]/g, "'@/$1'");
    // Fix relative imports that might still exist
    content = content.replace(/import\s+.*\s+from\s+['"]\.\.\/context\/(.*?)['"]/g, (m, p) => m.replace(`../context/${p}`, `@/context/${p}`));
    content = content.replace(/import\s+.*\s+from\s+['"]\.\.\/components\/(.*?)['"]/g, (m, p) => m.replace(`../components/${p}`, `@/components/${p}`));
    content = content.replace(/import\s+.*\s+from\s+['"]\.\.\/hooks\/(.*?)['"]/g, (m, p) => m.replace(`../hooks/${p}`, `@/hooks/${p}`));
    content = content.replace(/import\s+.*\s+from\s+['"]\.\.\/utils\/(.*?)['"]/g, (m, p) => m.replace(`../utils/${p}`, `@/utils/${p}`));
    content = content.replace(/import\s+.*\s+from\s+['"]\.\.\/services\/(.*?)['"]/g, (m, p) => m.replace(`../services/${p}`, `@/services/${p}`));
    
    if (content !== orig) {
        fs.writeFileSync(fullPath, content);
    }
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            fixFile(p);
        }
    }
}
walk('src');

console.log('Final fix applied');
