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
    if (!file.endsWith('.module.css')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // 1. Remove that weird '0' junk in Search.module.css
    // It's likely a line containing only '0' or '0\n'
    // Specifically looking around padding: 0 10px; gap: 0; } 0
    content = content.replace(/\}\s*\n\s*0\s*\n/g, '}\n');
    content = content.replace(/\s+0\s+(?=\/\*)/g, '\n'); // or just look for 0 on its own line
    
    // A more generic fix for the 0 junk:
    content = content.replace(/\n\s*0\s*\n/g, '\n');

    // 2. Fix purity errors by wrapping tag selectors in :global()
    // This is hard to do perfectly with regex, but we can target common ones
    const tags = ['button', 'div', 'span', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'li', 'a', 'p', 'input', 'select', 'textarea', 'label', 'header', 'footer', 'main', 'aside', 'nav', 'section', 'article', 'small', 'strong', 'em', 'i', 'b', 'svg'];
    
    tags.forEach(tag => {
        // Match tag at start of line or after comma/brace, not followed by . or # or :
        // This is still risky. Let's ONLY target those that are likely causing issues.
        // The error said "button". 
        // In @media print { .something, button { ... } }
        const regex = new RegExp(`(^|,\\s*)(${tag})(\\s*[{,])`, 'gm');
        content = content.replace(regex, (match, p1, p2, p3) => {
            return `${p1}:global(${p2})${p3}`;
        });
    });

    if (content !== orig) {
        fs.writeFileSync(file, content);
        console.log(`FIXED PURITY: ${file}`);
    }
}

walk('src', processFile);
console.log('CSS purity check complete.');
