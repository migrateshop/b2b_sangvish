const fs = require('fs');
const path = require('path');

const globalsPath = 'src/app/globals.css';
let globalsContent = fs.readFileSync(globalsPath, 'utf8');

// 1. Rename all .module.css to .css (if they were renamed by mistake or are global anyway)
function renameRecursive(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            renameRecursive(p);
        } else if (f.endsWith('.module.css')) {
            const newPath = p.replace('.module.css', '.css');
            if (fs.existsSync(newPath)) {
                fs.appendFileSync(newPath, '\n\n' + fs.readFileSync(p, 'utf8'));
                fs.unlinkSync(p);
            } else {
                fs.renameSync(p, newPath);
            }
        }
    }
}
renameRecursive('src');

// 2. Identify all CSS imports in TSX/TS files, remove them, and track them
const seenCss = new Set();
const cssToImport = [];

function processImports(file) {
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;
    
    // Match import './Something.css' or import '@/Something.css' or import '../Something.css'
    // Also handle .module.css if any left
    const regex = /import\s+['"]([^'"]+\.css)['"];?/g;
    
    content = content.replace(regex, (match, cssPath) => {
        let absolutePath;
        if (cssPath.startsWith('@/')) {
            absolutePath = path.join('src', cssPath.substring(2));
        } else {
            absolutePath = path.resolve(path.dirname(file), cssPath);
            // Relativize to project root
            absolutePath = path.relative(process.cwd(), absolutePath);
        }

        if (fs.existsSync(absolutePath)) {
            if (!seenCss.has(absolutePath)) {
                seenCss.add(absolutePath);
                cssToImport.push(absolutePath);
            }
            return ''; // Remove from file
        }
        return match; // Keep if file not found (might be node_modules)
    });

    if (content !== orig) {
        fs.writeFileSync(file, content);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            if (f !== 'app') walk(p); // Skip app for now as it contains globals.css
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            processImports(p);
        }
    }
}
walk('src');

// 3. Append CSS content to globals.css (or a separate file)
let combinedCss = '\n\n/* ─── Unified Component Styles ─── */\n';
for (const cssPath of cssToImport) {
    combinedCss += `\n\n/* Source: ${cssPath} */\n`;
    combinedCss += fs.readFileSync(cssPath, 'utf8');
}

fs.appendFileSync(globalsPath, combinedCss);

console.log(`Consolidated ${cssToImport.length} CSS files into globals.css`);
