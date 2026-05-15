const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        try {
            const stat = fs.statSync(p);
            if (stat.isDirectory()) {
                if (f !== 'node_modules' && f !== '.next') walk(p, callback);
            } else {
                callback(p);
            }
        } catch (err) {}
    }
}

function processFile(file) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts') && !file.endsWith('.js')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // 1. Replace window.innerWidth with (typeof window !== 'undefined' ? window.innerWidth : 1200)
    // and other window.innerHeight
    content = content.replace(/(?<!typeof window !== 'undefined' && )window\.innerWidth/g, "(typeof window !== 'undefined' ? window.innerWidth : 1200)");
    content = content.replace(/(?<!typeof window !== 'undefined' && )window\.innerHeight/g, "(typeof window !== 'undefined' ? window.innerHeight : 800)");

    if (content !== orig) {
        fs.writeFileSync(file, content);
        console.log(`FIXED WINDOW SSR BUG: ${file}`);
    }
}

walk('src', processFile);
console.log('Window SSR check complete.');
