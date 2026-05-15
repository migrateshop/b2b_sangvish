const fs = require('fs');
const path = require('path');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // 1. Fix location.pathname -> pathname (if location is usePathname)
    // We already have: const location = usePathname();
    content = content.replace(/location\.pathname/g, 'location');
    content = content.replace(/location\.search/g, 'searchParams?.toString()');

    // 2. Fix navigate(...) calls
    // First, handle replace: true
    content = content.replace(/navigate\s*\(([^,)]+),\s*\{\s*replace:\s*true\s*\}\)/g, 'navigate.replace($1)');
    // Then basic push
    content = content.replace(/navigate\s*\(([^,)]+)\)/g, (match, p1) => {
        if (p1.trim().startsWith('{') || p1.includes('.push') || p1.includes('.replace')) return match; 
        return `navigate.push(${p1})`;
    });

    // 3. Fix useIsMobile import
    content = content.replace(/import\s+\{?useIsMobile\}?\s+from\s+['"]@\/hooks\/useIsMobile['"]/g, "import useIsMobile from '@/hooks/useIsMobile'");

    if (content !== orig) {
        fs.writeFileSync(file, content);
    }
}

function walk(dir) {
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
console.log('Navigation migration applied');
