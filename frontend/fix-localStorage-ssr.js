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

    // 1. Replace localStorage.getItem(...) with (typeof window !== 'undefined' ? localStorage.getItem(...) : null)
    // but only if it's not already wrapped
    
    // We target common patterns like useState(() => localStorage.getItem('search_view_mode') || 'grid')
    // and replace with useState(() => (typeof window !== 'undefined' ? localStorage.getItem('search_view_mode') : null) || 'grid')
    
    const getItemRegex = /(?<!typeof window !== 'undefined' \? )localStorage\.getItem\(([^)]+)\)/g;
    content = content.replace(getItemRegex, "(typeof window !== 'undefined' ? localStorage.getItem($1) : null)");

    // 2. Wrap localStorage.setItem and removeItem in if blocks
    // This is harder because they are statements. 
    // We only need to worry about them if they run at TOP LEVEL or in CONSTRUCTORS that run on server.
    // In React components, they usually run in useEffect which is safe.
    // However, some might run in the component body.
    
    // For now, let's just target the ones that are definitely causing crashes in state init.
    
    // 3. Fix JSON.parse(localStorage.getItem(...))
    // It becomes JSON.parse((typeof window !== 'undefined' ? localStorage.getItem(...) : null) || 'null')
    const jsonParseRegex = /JSON\.parse\(localStorage\.getItem\(([^)]+)\)\)/g;
    content = content.replace(jsonParseRegex, "JSON.parse((typeof window !== 'undefined' ? localStorage.getItem($1) : null) || 'null')");

    if (content !== orig) {
        fs.writeFileSync(file, content);
        console.log(`FIXED SSR LOCALSTORAGE: ${file}`);
    }
}

walk('src', processFile);
console.log('LocalStorage SSR check complete.');
