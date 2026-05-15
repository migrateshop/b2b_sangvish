const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else if (f.endsWith('.css')) {
            callback(dirPath);
        }
    });
}

const targetFont = 'font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;';
let count = 0;

walkDir('./src', (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Remove google font imports
    content = content.replace(/@import url\(['"].*?fonts\.googleapis\.com.*?['"]\);\r?\n?/g, '');

    // 2. Replace the body font
    if (filePath.endsWith('index.css')) {
        // Change body font
        content = content.replace(/body\s*\{[^}]*\}/, (match) => {
            return match.replace(/font-family:.*?;/g, targetFont);
        });
        // Also replace top level font-family variables or reset overrides
        content = content.replace(/font-family:\s*[^;]+;/g, (match) => {
            if (match.includes('system-ui')) return match;
            if (match.includes('Inter') || match.includes('Poppins')) return targetFont;
            return match;
        });
    } else {
        // Remove font-family overrides everywhere else
        content = content.replace(/^\s*font-family:\s*[^;]+;\r?\n?/gm, '');
        // Also catch inline `font-family: inherit;` or similar
        content = content.replace(/font-family:\s*[^;]+;/g, '');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        count++;
    }
});

console.log('Updated ' + count + ' CSS files. Added system-ui to root, removed overrides and imports.');
