const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://khawarrr.github.io/daily-hadith';

function updatePaths(filePath, isHtml = false) {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  if (isHtml) {
    // Add meta tags
    const metaTags = `
    <meta http-equiv="Permissions-Policy" content="compute-pressure=()">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="${BASE_URL}/">`;
    
    content = content.replace('</head>', `${metaTags}\n</head>`);
    
    // Update asset paths
    content = content.replace(/src="\//g, `src="${BASE_URL}/`)
                    .replace(/href="\//g, `href="${BASE_URL}/`)
                    .replace(/from "\//g, `from "${BASE_URL}/`)
                    .replace(/"\.\/static\//g, `"${BASE_URL}/static/`)
                    .replace(/"\.\/assets\//g, `"${BASE_URL}/assets/`);
  } else if (filePath.endsWith('.js')) {
    // Update paths in JavaScript files
    content = content.replace(/"\//g, `"${BASE_URL}/`)
                    .replace(/"\.\/static\//g, `"${BASE_URL}/static/`)
                    .replace(/"\.\/assets\//g, `"${BASE_URL}/assets/`);
  }

  fs.writeFileSync(filePath, content);
}

// Process index.html first
const indexPath = path.join(__dirname, 'dist', 'index.html');
if (fs.existsSync(indexPath)) {
  updatePaths(indexPath, true);
  
  // Process all JavaScript files in the dist directory
  fs.readdirSync(path.join(__dirname, 'dist')).forEach(file => {
    if (file.endsWith('.js')) {
      updatePaths(path.join(__dirname, 'dist', file));
    }
  });
} else {
  console.error('dist/index.html not found!');
  process.exit(1);
}

console.log('Path fixing completed!'); 