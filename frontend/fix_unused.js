const fs = require('fs');

const errors = fs.readFileSync('ts_errors.txt', 'utf8').split('\n');
const fixes = {};

// Group errors by file
errors.forEach(line => {
  const match = line.match(/(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)/);
  if (match) {
    const [, file, row, col, tsCode, msg] = match;
    const varMatch = msg.match(/'(.+?)' is declared but its value is never read/);
    const unusedImportMatch = msg.match(/All imports in import declaration are unused/);
    
    if (varMatch || unusedImportMatch) {
      if (!fixes[file]) fixes[file] = [];
      fixes[file].push({
        line: parseInt(row),
        col: parseInt(col),
        tsCode,
        varName: varMatch ? varMatch[1] : null,
        isAllImportsUnused: !!unusedImportMatch
      });
    }
  }
});

for (const [file, fileFixes] of Object.entries(fixes)) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');

  // We need to sort fixes in reverse line order to safely splice or remove lines without changing subsequent line numbers.
  // Actually, modifying line contents is better.
  fileFixes.sort((a, b) => b.line - a.line);

  for (const fix of fileFixes) {
    const lIdx = fix.line - 1;
    let lineStr = lines[lIdx];
    
    if (fix.isAllImportsUnused) {
        // Find if this is a multiline import. We can just delete the line, but if it's multiline, we need a better heuristic.
        // It's easier to use regex on the whole file. 
    }
    
    if (fix.varName) {
      // Find the variable in the line and remove it.
      // E.g. `import { A, B, C } from ...`
      // Or `const { A, B } = ...`
      const regex1 = new RegExp(`\\b${fix.varName}\\s*,?\\s*`);
      lineStr = lineStr.replace(regex1, '');
      
      // Fix cases where it leaves empty curly braces or trailing commas
      lineStr = lineStr.replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
      
      // If the line becomes just `import { } from '...'` or `import {} from '...'`, we can remove it.
      if (/import\s*{\s*}\s*from/.test(lineStr) || /import\s+type\s*{\s*}\s*from/.test(lineStr)) {
        lineStr = '';
      }
      
      // For TS6133 that is `const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');` where useState is unused... 
      // Actually if useState is unused in import, it will be removed. 
      // If it's a hook return like `const { setActiveModal } = useUIStore();` 
      // wait, `useUIStore` might be unused, or `setActiveModal` unused.
      
      lines[lIdx] = lineStr;
    }
  }

  // After single line edits, let's join and do some multi-line cleanups for empty imports
  content = lines.join('\n');
  content = content.replace(/import\s+{\s*}\s*from\s+['"][^'"]+['"];?\n/g, '');
  content = content.replace(/import\s+['"][^'"]+['"];?\n/g, (match, offset, str) => {
    // only if the fix was "all imports unused"
    return match;
  });
  
  fs.writeFileSync(file, content);
}

console.log('Done processing fixes.');
