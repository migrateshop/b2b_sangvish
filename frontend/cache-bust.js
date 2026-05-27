const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'public/documentation/index.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// Replace src="images/filename.png" or src="images/filename.png?query" with src="images/filename.png?v=3"
content = content.replace(/src="images\/([^"?#\s>]+)(\?[^"]*)?"/g, 'src="images/$1?v=3"');

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Successfully updated image URLs in index.html for cache busting.');
