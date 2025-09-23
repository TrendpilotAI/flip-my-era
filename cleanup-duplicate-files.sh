#!/bin/bash

# Script to clean up duplicate Supabase files
# These duplicates were likely created during development/merging

echo "================================================"
echo "    Cleaning Up Duplicate Supabase Files"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will remove duplicate files with ' 2' in their names.${NC}"
echo "These appear to be duplicates created during development."
echo ""
read -p "Do you want to see the list of files that will be removed? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Files to be removed:${NC}"
    find /workspace/supabase -name "* 2.*" -type f
    echo ""
fi

read -p "Do you want to proceed with deletion? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Removing duplicate files...${NC}"
    
    # Count files before deletion
    COUNT=$(find /workspace/supabase -name "* 2.*" -type f | wc -l)
    
    # Remove the files
    find /workspace/supabase -name "* 2.*" -type f -delete
    
    echo -e "${GREEN}✅ Removed $COUNT duplicate files${NC}"
    
    # Also remove other duplicate patterns in src
    echo -e "${YELLOW}Checking for other duplicates in src...${NC}"
    
    # Remove duplicate App files
    if [ -f "/workspace/src/app/App 2.css" ]; then
        rm "/workspace/src/app/App 2.css"
        echo "Removed: src/app/App 2.css"
    fi
    
    if [ -f "/workspace/src/app/App 2.tsx" ]; then
        rm "/workspace/src/app/App 2.tsx"
        echo "Removed: src/app/App 2.tsx"
    fi
    
    if [ -f "/workspace/src/app/index 2.css" ]; then
        rm "/workspace/src/app/index 2.css"
        echo "Removed: src/app/index 2.css"
    fi
    
    if [ -f "/workspace/src/app/main 2.tsx" ]; then
        rm "/workspace/src/app/main 2.tsx"
        echo "Removed: src/app/main 2.tsx"
    fi
    
    if [ -f "/workspace/src/components/AuthTest 2.tsx" ]; then
        rm "/workspace/src/components/AuthTest 2.tsx"
        echo "Removed: src/components/AuthTest 2.tsx"
    fi
    
    # Remove other duplicate scripts
    if [ -f "/workspace/fix-imports 2.cjs" ]; then
        rm "/workspace/fix-imports 2.cjs"
        echo "Removed: fix-imports 2.cjs"
    fi
    
    if [ -f "/workspace/update-imports 2.js" ]; then
        rm "/workspace/update-imports 2.js"
        echo "Removed: update-imports 2.js"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review the remaining files to ensure nothing important was removed"
    echo "2. Test the application to ensure it still works correctly"
    echo "3. Commit the cleanup to version control"
    
else
    echo -e "${RED}Cleanup cancelled.${NC}"
fi

echo ""
echo "================================================"
