const fs = require('fs');
const path = require('path');

function replaceColors(dir) {
    if (!fs.existsSync(dir)) {
        console.log("Directory does not exist: " + dir);
        return;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceColors(fullPath);
        } else if (fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            content = content.replace(/#0d2e67/gi, 'var(--primary-color)');
            content = content.replace(/#e65c00/gi, 'var(--accent-hover)');
            content = content.replace(/#ff6a00/gi, 'var(--clr-accent)');
            content = content.replace(/rgb\(13,\s*46,\s*103\)/gi, 'var(--primary-color)');
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated: ' + fullPath);
            }
        }
    }
}

// Resolve paths dynamically based on where the script is located
const baseDir = __dirname;

// Detect if we're in the frontend root or already inside src/
let targetDir;
if (fs.existsSync(path.join(baseDir, 'src', 'pages', 'admin'))) {
    targetDir = path.join(baseDir, 'src', 'pages', 'admin');
} else if (fs.existsSync(path.join(baseDir, 'pages', 'admin'))) {
    targetDir = path.join(baseDir, 'pages', 'admin');
} else {
    console.log("Could not find the 'pages/admin' folder relative to this script.");
    process.exit(1);
}

console.log("Starting color wipe on: " + targetDir);
replaceColors(targetDir);
console.log('Done replacing colors in admin pages!');
