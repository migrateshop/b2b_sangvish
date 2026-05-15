const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
};

const replaceInFile = (file) => {
    const data = fs.readFileSync(file, 'utf8');
    if (data.includes('via.placeholder.com')) {
        const newData = data.replace(/via\.placeholder\.com/g, 'placehold.co');
        fs.writeFileSync(file, newData, 'utf8');
        console.log(`Replaced in ${file}`);
    }
};

const srcDir = path.join(__dirname, 'src');
const files = walk(srcDir);
files.forEach(replaceInFile);
console.log('Finished replace script.');
