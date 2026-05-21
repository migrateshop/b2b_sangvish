const fs = require('fs');
const path = require('path');

const fileToCheck = path.join(__dirname, '../uploads/products/product-1775802617177-499786498.png');
console.log('Checking path:', fileToCheck);
console.log('Exists:', fs.existsSync(fileToCheck));
if (fs.existsSync(fileToCheck)) {
    console.log('Size:', fs.statSync(fileToCheck).size, 'bytes');
}
