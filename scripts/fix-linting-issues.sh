#!/bin/bash

echo "================================================"
echo "Fixing Linting Issues"
echo "================================================"
echo ""

# Fix TypeScript any types in test files
echo "Fixing TypeScript 'any' types in test files..."

# Fix AdminCreditsTest.tsx
sed -i 's/const handleTestOperation = async (operation: any)/const handleTestOperation = async (operation: string)/' /workspace/src/components/AdminCreditsTest.tsx

# Fix UserBooks.tsx
sed -i 's/books: any\[\]/books: Array<{ id: string; title: string; chapters: unknown[]; created_at: string; }>/' /workspace/src/modules/ebook/components/UserBooks.tsx
sed -i 's/(a: any, b: any)/(a: { created_at: string }, b: { created_at: string })/' /workspace/src/modules/ebook/components/UserBooks.tsx
sed -i 's/const book: any/const book/' /workspace/src/modules/ebook/components/UserBooks.tsx

# Fix DownloadShareModal.tsx
sed -i 's/catch (error: any)/catch (error)/' /workspace/src/modules/shared/components/DownloadShareModal.tsx
sed -i 's/const errorMessage = error instanceof Error/const errorMessage = error instanceof Error/' /workspace/src/modules/shared/components/DownloadShareModal.tsx

# Fix wavy-background.tsx
sed -i 's/var /const /' /workspace/src/modules/shared/utils/wavy-background.tsx 2>/dev/null || true
sed -i 's/var /const /' /workspace/src/modules/shared/components/ui/wavy-background.tsx 2>/dev/null || true

# Fix prefer-const in socialShareUtils.ts
sed -i "s/let hashtags = \['FlipMyEra'\];/const hashtags = ['FlipMyEra'];/" /workspace/src/modules/shared/utils/socialShareUtils.ts

# Fix no-case-declarations in socialShareUtils.ts
echo "Fixing case declarations in socialShareUtils.ts..."
cat > /tmp/fix-social-share.js << 'EOF'
const fs = require('fs');
const path = '/workspace/src/modules/shared/utils/socialShareUtils.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix case declarations by adding block scopes
content = content.replace(/case 'twitter':\n(\s+)let/g, "case 'twitter': {\n$1let");
content = content.replace(/case 'facebook':\n(\s+)let/g, "case 'facebook': {\n$1let");
content = content.replace(/case 'linkedin':\n(\s+)let/g, "case 'linkedin': {\n$1let");
content = content.replace(/case 'reddit':\n(\s+)let/g, "case 'reddit': {\n$1let");

// Add closing braces before breaks
content = content.replace(/(\s+)break;/g, "$1}\n$1break;");

fs.writeFileSync(path, content);
console.log('Fixed case declarations');
EOF

node /tmp/fix-social-share.js 2>/dev/null || true

# Remove unused eslint-disable directive
sed -i '/eslint-disable no-console/d' /workspace/src/core/integrations/supabase/client.ts

echo ""
echo "Linting issues fixed. Running linter again to check..."
echo ""

# Run linter again to see remaining issues
npm run lint 2>&1 | grep -E "error|warning" | head -20

echo ""
echo "================================================"
echo "Linting fixes completed"
echo "================================================"