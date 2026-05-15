const fs = require('fs');
const globalsPath = 'src/app/globals.css';
if (!fs.existsSync(globalsPath)) process.exit(0);

let css = fs.readFileSync(globalsPath, 'utf8');

// 1. Identify all complete @import statements
const imports = [];
css = css.replace(/@import\s+url\(['"].*?['"]\);/g, (match) => {
    imports.push(match);
    return '';
});

// 2. Identify and remove any BROKEN @import fragments (junk)
css = css.replace(/@import\s+url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@\d+(?:;\d+)*;?/g, '');
css = css.replace(/[\d;]*?&display=swap['"]\);/g, '');

// Clean up any double/triple newlines left by removals
css = css.replace(/\n{3,}/g, '\n\n');

// 3. Normalize Inter font import specifically (avoid duplicates)
const interImport = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');";
const otherImports = imports.filter(i => !i.includes('fonts.googleapis.com/css2?family=Inter'));
const uniqueOtherImports = Array.from(new Set(otherImports));

const finalCss = interImport + '\n' + uniqueOtherImports.join('\n') + '\n\n' + css.trim();

fs.writeFileSync(globalsPath, finalCss);
console.log('Sanitized globals.css and fixed @import ordering');
