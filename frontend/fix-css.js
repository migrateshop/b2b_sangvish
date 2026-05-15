const fs = require('fs');

// Fix globals.css
let css = fs.readFileSync('src/app/globals.css', 'utf8');
let imports = [];
css = css.replace(/@import.*?;/g, match => {
  imports.push(match);
  return '';
});
fs.writeFileSync('src/app/globals.css', imports.join('\n') + '\n\n' + css);

// Fix AuthModal
let authPath = 'src/components/js/AuthModal.tsx';
if (fs.existsSync(authPath)) {
  let auth = fs.readFileSync(authPath, 'utf8');
  auth = auth.replace(/import\s+['"]@\/app\/pages\/Register\.css['"];?/g, '');
  auth = auth.replace(/import\s+['"]\.\.\/css\/AuthModal\.css['"];?/g, '');
  fs.writeFileSync(authPath, auth);
}

// Ensure Register.module.css and AuthModal.css are in globals if needed, 
// for perfectly safe migration, we can just append them to globals.css
function appendToGlobals(p) {
    if (fs.existsSync(p)) {
        fs.appendFileSync('src/app/globals.css', '\n\n' + fs.readFileSync(p, 'utf8'));
    }
}

appendToGlobals('src/app/pages/Register.module.css');
appendToGlobals('src/components/css/AuthModal.module.css');
appendToGlobals('src/components/css/AuthModal.css');
console.log('Fixed CSS issues.');
