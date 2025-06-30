const fs = require('fs');
const path = require('path');

// Import path mappings
const importMappings = {
  // Hooks
  '@/hooks/use-toast': '@/modules/shared/hooks/use-toast',
  '@/hooks/useApiCheck': '@/modules/shared/hooks/useApiCheck',
  '@/hooks/useStoryGeneration': '@modules/story/hooks/useStoryGeneration',
  '@/hooks/useStreamingGeneration': '@modules/story/hooks/useStreamingGeneration',
  
  // Contexts
  '@/contexts/ClerkAuthContext': '@/modules/auth/contexts/ClerkAuthContext',
  
  // Components
  '@/components/': '@modules/shared/components/',
  
  // Types
  '@/types/personality': '@modules/story/types/personality',
  
  // Integrations
  '@/integrations/': '@core/integrations/',
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      const regex = new RegExp(`from\\s+['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `from '${newPath}'`);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateImportsInFile(filePath);
    }
  }
}

// Process src directory
processDirectory('./src');
console.log('Import path updates completed!'); 