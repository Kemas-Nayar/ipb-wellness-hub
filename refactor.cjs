const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'src', 'styles');

const replacements = [
  // Remove old root variables in HomePage.css and AuthPage.css if any
  { regex: /:root\s*\{[^}]*\}/g, replacement: '', applyTo: 'HomePage.css' },
  
  // Colors
  { regex: /var\(--red\)/g, replacement: 'var(--color-primary)' },
  { regex: /var\(--red-light\)/g, replacement: 'var(--color-primary-light)' },
  { regex: /var\(--red-mid\)/g, replacement: 'var(--color-primary-mid)' },
  { regex: /#C8102E/gi, replacement: 'var(--color-primary)' },
  { regex: /#FFF0F0/gi, replacement: 'var(--color-primary-light)' },
  { regex: /#FFD6DA/gi, replacement: 'var(--color-primary-mid)' },
  { regex: /#8b0000/gi, replacement: 'var(--color-primary-dark)' },
  
  { regex: /var\(--blue\)/g, replacement: 'var(--color-secondary)' },
  { regex: /var\(--blue-light\)/g, replacement: 'var(--color-secondary-light)' },
  { regex: /#2F5DAA/gi, replacement: 'var(--color-secondary)' },
  { regex: /#EEF3FF/gi, replacement: 'var(--color-secondary-light)' },
  
  { regex: /var\(--green\)/g, replacement: 'var(--color-success)' },
  { regex: /var\(--green-light\)/g, replacement: 'var(--color-success-light)' },
  { regex: /#1A9E5C/gi, replacement: 'var(--color-success)' },
  { regex: /#EDFFF5/gi, replacement: 'var(--color-success-light)' },
  
  { regex: /var\(--amber\)/g, replacement: 'var(--color-warning)' },
  { regex: /var\(--amber-light\)/g, replacement: 'var(--color-warning-light)' },
  { regex: /#E6A800/gi, replacement: 'var(--color-warning)' },
  { regex: /#FFF8E1/gi, replacement: 'var(--color-warning-light)' },
  
  { regex: /var\(--surface\)/g, replacement: 'var(--color-surface)' },
  { regex: /#ffffff/gi, replacement: 'var(--color-surface)' },
  
  { regex: /var\(--bg\)/g, replacement: 'var(--color-bg)' },
  { regex: /#f5f5f5/gi, replacement: 'var(--color-bg)' },
  
  { regex: /var\(--border\)/g, replacement: 'var(--color-border)' },
  { regex: /#ebebeb/gi, replacement: 'var(--color-border)' },
  { regex: /#ddd/gi, replacement: 'var(--color-border)' },
  { regex: /#e8e8e8/gi, replacement: 'var(--color-border)' },
  
  { regex: /var\(--ink\)/g, replacement: 'var(--text-primary)' },
  { regex: /#1a1a1a/gi, replacement: 'var(--text-primary)' },
  { regex: /#333333/gi, replacement: 'var(--text-primary)' },
  { regex: /#333/gi, replacement: 'var(--text-primary)' },
  
  { regex: /var\(--ink-muted\)/g, replacement: 'var(--text-secondary)' },
  { regex: /#666666/gi, replacement: 'var(--text-secondary)' },
  { regex: /#666/gi, replacement: 'var(--text-secondary)' },
  { regex: /#555/gi, replacement: 'var(--text-secondary)' },
  
  { regex: /var\(--ink-faint\)/g, replacement: 'var(--text-tertiary)' },
  { regex: /#aaaaaa/gi, replacement: 'var(--text-tertiary)' },
  { regex: /#aaa/gi, replacement: 'var(--text-tertiary)' },
  { regex: /#777/gi, replacement: 'var(--text-tertiary)' },
  
  // Spacing (Replacing hardcoded paddings and margins with tokens)
  // Caution: Only doing exact matches to avoid messing up properties like width.
  { regex: /padding:\s*16px/g, replacement: 'padding: var(--space-16)' },
  { regex: /padding:\s*12px/g, replacement: 'padding: var(--space-12)' },
  { regex: /padding:\s*8px/g, replacement: 'padding: var(--space-8)' },
  { regex: /padding:\s*10px/g, replacement: 'padding: var(--space-8)' }, // 10px standardized to 8px
  { regex: /padding:\s*14px/g, replacement: 'padding: var(--space-12)' }, // 14px standardized to 12px
  { regex: /padding:\s*20px/g, replacement: 'padding: var(--space-20)' },
  { regex: /padding:\s*24px/g, replacement: 'padding: var(--space-24)' },
  { regex: /padding:\s*32px/g, replacement: 'padding: var(--space-32)' },
  
  { regex: /margin:\s*16px/g, replacement: 'margin: var(--space-16)' },
  { regex: /margin:\s*12px/g, replacement: 'margin: var(--space-12)' },
  { regex: /margin:\s*8px/g, replacement: 'margin: var(--space-8)' },
  { regex: /margin:\s*10px/g, replacement: 'margin: var(--space-8)' },
  { regex: /margin:\s*14px/g, replacement: 'margin: var(--space-12)' },
  { regex: /margin:\s*20px/g, replacement: 'margin: var(--space-20)' },
  { regex: /margin:\s*24px/g, replacement: 'margin: var(--space-24)' },
  
  { regex: /gap:\s*16px/g, replacement: 'gap: var(--space-16)' },
  { regex: /gap:\s*12px/g, replacement: 'gap: var(--space-12)' },
  { regex: /gap:\s*8px/g, replacement: 'gap: var(--space-8)' },
  { regex: /gap:\s*10px/g, replacement: 'gap: var(--space-8)' },
  { regex: /gap:\s*14px/g, replacement: 'gap: var(--space-12)' },
  { regex: /gap:\s*20px/g, replacement: 'gap: var(--space-20)' },
  { regex: /gap:\s*24px/g, replacement: 'gap: var(--space-24)' },

  // Radius
  { regex: /border-radius:\s*8px/g, replacement: 'border-radius: var(--radius-sm)' },
  { regex: /border-radius:\s*9px/g, replacement: 'border-radius: var(--radius-sm)' },
  { regex: /border-radius:\s*10px/g, replacement: 'border-radius: var(--radius-sm)' },
  { regex: /border-radius:\s*12px/g, replacement: 'border-radius: var(--radius-md)' },
  { regex: /border-radius:\s*14px/g, replacement: 'border-radius: var(--radius-md)' },
  { regex: /border-radius:\s*16px/g, replacement: 'border-radius: var(--radius-lg)' },
  { regex: /border-radius:\s*20px/g, replacement: 'border-radius: var(--radius-lg)' },
  { regex: /border-radius:\s*24px/g, replacement: 'border-radius: var(--radius-xl)' },
  { regex: /border-radius:\s*50%/g, replacement: 'border-radius: var(--radius-full)' },
  { regex: /border-radius:\s*9999px/g, replacement: 'border-radius: var(--radius-full)' },

  // Shadows
  { regex: /box-shadow:\s*0 1px 3px rgba\(0,0,0,0\.05\)/g, replacement: 'box-shadow: var(--shadow-sm)' },
  { regex: /box-shadow:\s*0 4px 12px rgba\(0,0,0,0\.1\)/g, replacement: 'box-shadow: var(--shadow-md)' },
  { regex: /box-shadow:\s*0 4px 12px rgba\(0,0,0,0\.05\)/g, replacement: 'box-shadow: var(--shadow-md)' },
  { regex: /box-shadow:\s*0 4px 12px rgba\(200,\s*16,\s*46,\s*0\.05\)/g, replacement: 'box-shadow: var(--shadow-md)' },
  { regex: /box-shadow:\s*0 6px 20px rgba\(0,0,0,0\.08\)/g, replacement: 'box-shadow: var(--shadow-lg)' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement, applyTo }) => {
    if (applyTo && !filePath.endsWith(applyTo)) return;
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${path.basename(filePath)}`);
  }
}

fs.readdirSync(stylesDir).forEach(file => {
  if (file.endsWith('.css')) {
    processFile(path.join(stylesDir, file));
  }
});

console.log("Refactoring complete.");
