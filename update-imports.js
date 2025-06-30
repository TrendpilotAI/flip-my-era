import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert file URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import path mappings
const importMappings = [
  // Auth module
  { from: '@/contexts/ClerkAuthContext', to: '@/modules/auth/contexts/ClerkAuthContext' },
  { from: '@/pages/Auth', to: '@/modules/auth/components/Auth' },
  { from: '@/pages/AuthCallback', to: '@/modules/auth/components/AuthCallback' },
  { from: '@/pages/ResetPassword', to: '@/modules/auth/components/ResetPassword' },
  
  // Story module
  { from: '@/pages/Stories', to: '@/modules/story/components/Stories' },
  { from: '@/components/StoryForm', to: '@/modules/story/components/StoryForm' },
  { from: '@/components/StoryResult', to: '@/modules/story/components/StoryResult' },
  { from: '@/components/StoriesList', to: '@/modules/story/components/StoriesList' },
  { from: '@/components/StreamingText', to: '@/modules/story/components/StreamingText' },
  
  // Ebook module
  { from: '@/components/EbookGenerator', to: '@/modules/ebook/components/EbookGenerator' },
  
  // User module
  { from: '@/pages/UserDashboard', to: '@/modules/user/components/UserDashboard' },
  { from: '@/pages/Profile', to: '@/modules/user/components/Profile' },
  { from: '@/pages/Settings', to: '@/modules/user/components/Settings' },
  { from: '@/pages/SettingsDashboard', to: '@/modules/user/components/SettingsDashboard' },
  { from: '@/components/CreditBalance', to: '@/modules/user/components/CreditBalance' },
  { from: '@/components/CreditPurchaseModal', to: '@/modules/user/components/CreditPurchaseModal' },
  { from: '@/components/PersonalitySelector', to: '@/modules/user/components/PersonalitySelector' },
  { from: '@/components/StarSignDisplay', to: '@/modules/user/components/StarSignDisplay' },
  
  // Shared module
  { from: '@/components/Layout', to: '@/modules/shared/components/Layout' },
  { from: '@/components/PageHeader', to: '@/modules/shared/components/PageHeader' },
  { from: '@/components/ProtectedRoute', to: '@/modules/shared/components/ProtectedRoute' },
  { from: '@/components/AdminRoute', to: '@/modules/shared/components/AdminRoute' },
  { from: '@/components/AdminNav', to: '@/modules/shared/components/AdminNav' },
  { from: '@/components/AuthDialog', to: '@/modules/shared/components/AuthDialog' },
  { from: '@/components/BackgroundImages', to: '@/modules/shared/components/BackgroundImages' },
  { from: '@/components/SparkleEffect', to: '@/modules/shared/components/SparkleEffect' },
  { from: '@/components/GoogleSignInButton', to: '@/modules/shared/components/GoogleSignInButton' },
  
  // UI components
  { from: '@/components/ui/', to: '@/modules/shared/components/ui/' },
  
  // Core
  { from: '@/lib/', to: '@/core/lib/' },
  { from: '@/integrations/', to: '@/core/integrations/' },
  
  // App pages
  { from: '@/pages/Index', to: '@/app/pages/Index' },
  { from: '@/pages/NotFound', to: '@/app/pages/NotFound' },
  { from: '@/pages/Checkout', to: '@/app/pages/Checkout' },
  { from: '@/pages/CheckoutSuccess', to: '@/app/pages/CheckoutSuccess' },
  { from: '@/pages/UpgradePlan', to: '@/app/pages/UpgradePlan' },
  { from: '@/pages/AdminDashboard', to: '@/app/pages/AdminDashboard' },
  { from: '@/pages/AdminIntegrations', to: '@/app/pages/AdminIntegrations' },
  { from: '@/pages/AdminUsers', to: '@/app/pages/AdminUsers' }
];

// File extensions to process
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to skip
const skipDirs = ['.git', 'node_modules', 'dist', 'build'];

// Process a file
async function processFile(filePath) {
  try {
    // Check if file has a supported extension
    if (!extensions.some(ext => filePath.endsWith(ext))) {
      return;
    }
    
    // Read file content
    let content = await fs.promises.readFile(filePath, 'utf8');
    let originalContent = content;
    
    // Apply import mappings
    importMappings.forEach(mapping => {
      const regex = new RegExp(`from\\s+['"]${mapping.from}(\\.?[^'"]*?)['"]`, 'g');
      content = content.replace(regex, `from '${mapping.to}$1'`);
      
      const regexRequire = new RegExp(`require\\(['"]${mapping.from}(\\.?[^'"]*?)['"]\\)`, 'g');
      content = content.replace(regexRequire, `require('${mapping.to}$1')`);
    });
    
    // Write file if content changed
    if (content !== originalContent) {
      await fs.promises.writeFile(filePath, content, 'utf8');
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Recursively process all files in directory
async function processDirectory(dirPath) {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip directories we don't want to process
      if (entry.isDirectory() && !skipDirs.includes(entry.name)) {
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
}

// Main function
async function main() {
  console.log('Starting import path updates...');
  await processDirectory('./src');
  console.log('Import path updates completed!');
}

main().catch(console.error); 