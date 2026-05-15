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
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // Type 1: import styles from './Something.module.css'
    // Type 2: import styles from './Something.css' (Next.js requires .module.css for this syntax)
    
    const regex = /import\s+styles\s+from\s+['"]([^'"]+)['"];?/g;
    
    content = content.replace(regex, (match, cssPath) => {
        let absolutePath;
        if (cssPath.startsWith('@/')) {
            absolutePath = path.join('src', cssPath.substring(2));
        } else {
            absolutePath = path.resolve(path.dirname(file), cssPath);
        }
        
        let targetModulePath = absolutePath;
        if (!targetModulePath.endsWith('.module.css')) {
            targetModulePath = targetModulePath.replace('.css', '') + '.module.css';
        }

        const currentCssPath = targetModulePath.replace('.module.css', '.css');

        // If file doesn't exist as .module.css but exists as .css, rename it
        if (!fs.existsSync(targetModulePath) && fs.existsSync(currentCssPath)) {
            try {
                fs.renameSync(currentCssPath, targetModulePath);
                console.log(`FIXED: ${currentCssPath} -> ${targetModulePath}`);
            } catch (e) {
                console.error(`FAILED to rename ${currentCssPath}: ${e.message}`);
            }
        }
        
        // Ensure the import string in the TSX file matches the .module.css extension
        if (!cssPath.endsWith('.module.css')) {
            const newImportPath = cssPath.replace('.css', '') + '.module.css';
            console.log(`UPDATED IMPORT in ${file}: ${cssPath} -> ${newImportPath}`);
            return `import styles from '${newImportPath}';`;
        }

        return match;
    });

    if (content !== orig) {
        fs.writeFileSync(file, content);
    }
}

walk('src', processFile);
console.log('Final check on modules complete.');
