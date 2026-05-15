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

    // Pattern to fix: const searchParams = new URLSearchParams(searchParams?.toString());
    // Replacement: const searchParams = useSearchParams();
    
    const pattern = /const searchParams = new URLSearchParams\(searchParams\?\.toString\(\)\);/g;
    content = content.replace(pattern, "const searchParams = useSearchParams();");

    if (content !== orig) {
        fs.writeFileSync(file, content);
        console.log(`FIXED SHADOWING BUG: ${file}`);
    }
}

walk('src', processFile);
console.log('Shadowing bug fix complete.');
