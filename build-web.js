const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build the web version
console.log('Building web version...');
execSync('npx expo export --platform web', { stdio: 'inherit' });

// Read the index.html file
console.log('Fixing asset paths...');
const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Fix the paths
html = html.replace(
  /src="\/_expo/g,
  'src="/daily-hadith/_expo'
).replace(
  /href="\/_expo/g,
  'href="/daily-hadith/_expo'
).replace(
  /src="\/static/g,
  'src="/daily-hadith/static'
).replace(
  /href="\/static/g,
  'href="/daily-hadith/static'
);

// Write the modified content back
fs.writeFileSync(indexPath, html);

console.log('Build completed successfully!'); 