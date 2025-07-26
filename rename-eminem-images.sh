#!/bin/bash

# Script to rename Eminem images in the correct directory
# Usage: ./rename-eminem-images.sh

EMINEM_DIR="public/images/themes/eminem"

echo "🎤 Eminem Image Renamer"
echo "======================="

# Check if directory exists
if [ ! -d "$EMINEM_DIR" ]; then
    echo "❌ Directory $EMINEM_DIR does not exist!"
    echo "Please create the directory first."
    exit 1
fi

# Check if there are any images in the directory
if [ -z "$(ls -A $EMINEM_DIR/*.jpg $EMINEM_DIR/*.jpeg $EMINEM_DIR/*.png $EMINEM_DIR/*.avif $EMINEM_DIR/*.webp 2>/dev/null)" ]; then
    echo "❌ No images found in $EMINEM_DIR"
    echo "Please copy your Eminem images to this directory first."
    echo ""
    echo "Steps:"
    echo "1. Copy your Eminem images to: $EMINEM_DIR"
    echo "2. Run this script again"
    exit 1
fi

echo "✅ Found images in $EMINEM_DIR"
echo "🔄 Renaming images..."

# Get all image files and rename them
counter=1
for file in $EMINEM_DIR/*.{jpg,jpeg,png,avif,webp}; do
    if [ -f "$file" ]; then
        # Get file extension
        extension="${file##*.}"
        # Create new filename
        new_name="$EMINEM_DIR/eminem-$counter.$extension"
        
        echo "📸 Renaming: $(basename "$file") → eminem-$counter.$extension"
        mv "$file" "$new_name"
        ((counter++))
    fi
done

echo ""
echo "✅ Successfully renamed $(($counter - 1)) Eminem images!"
echo "🎤 Your Eminem images are ready for the theme!" 