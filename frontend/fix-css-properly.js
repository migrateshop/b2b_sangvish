const fs = require('fs');
const path = require('path');

const globalsPath = 'src/app/globals.css';
let globalsContent = fs.readFileSync(globalsPath, 'utf8');

// 1. COLLECT all unique @import statements
const allImports = new Set();
// Existing imports in globals.css
globalsContent = globalsContent.replace(/@import url.*?;/g, (match) => {
    allImports.add(match);
    return '';
});

// 2. Scan for .css / .module.css and handle them
function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            if (f !== 'node_modules') walk(p, callback);
        } else {
            callback(p);
        }
    }
}

// Map to track which files we've already "globalized"
const globalized = new Set();

function processFile(file) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // Regex for both .css and .module.css
    // We only remove GLOBAL .css imports (not assigned to 'styles')
    // e.g. import './style.css'; => remove and globalize
    // e.g. import styles from './style.module.css'; => KEEP as is
    
    // a. Remove global CSS imports
    content = content.replace(/^import\s+['"]([^'"]+\.css)['"];?\s*$/gm, (match, cssPath) => {
        if (cssPath.endsWith('.module.css')) return match; // Keep module css
        
        let absolutePath;
        if (cssPath.startsWith('@/')) {
            absolutePath = path.join('src', cssPath.substring(2));
        } else {
            absolutePath = path.resolve(path.dirname(file), cssPath);
            absolutePath = path.relative(process.cwd(), absolutePath);
        }

        // Remove lines that import a CSS file if the file does not exist
        if (match.startsWith('import ') && match.includes('.css') && !fs.existsSync(absolutePath)) {
            console.log(`Removing missing CSS import in ${file}: ${cssPath}`);
            return '';
        }
        
        if (fs.existsSync(absolutePath)) {
            if (!globalized.has(absolutePath)) {
                globalized.add(absolutePath);
                let cssText = fs.readFileSync(absolutePath, 'utf8');
                // Strip @import from this component CSS
                cssText = cssText.replace(/@import url.*?;/g, (m) => {
                    allImports.add(m);
                    return '';
                });
                globalsContent += `\n\n/* From: ${absolutePath} */\n` + cssText;
            }
            return ''; // Remove import from TSX
        }
        return match;
    });

    if (content !== orig) {
        fs.writeFileSync(file, content);
    }
}

walk('src', processFile);

// 3. Reconstruct globals.css
const finalImportStr = Array.from(allImports).join('\n') + '\n\n';
fs.writeFileSync(globalsPath, finalImportStr + globalsContent);

// 4. Fix Worldwide.module.css (it was mistakenly renamed)
const worldwideCss = 'src/app/pages/Worldwide.css';
const worldwideModuleCss = 'src/app/pages/Worldwide.module.css';
if (fs.existsSync(worldwideCss) && !fs.existsSync(worldwideModuleCss)) {
    fs.renameSync(worldwideCss, worldwideModuleCss);
}

console.log('Fixed CSS imports and @import ordering');
