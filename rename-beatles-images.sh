#!/bin/bash

# Script to rename Beatles images in the correct directory
# Usage: ./rename-beatles-images.sh

BEATLES_DIR="public/images/themes/beatles"

echo "🎸 Beatles Image Renamer"
echo "=========================="

# Check if directory exists
if [ ! -d "$BEATLES_DIR" ]; then
    echo "❌ Directory $BEATLES_DIR does not exist!"
    echo "Please create the directory first."
    exit 1
fi

# Check if there are any images in the directory
if [ -z "$(ls -A $BEATLES_DIR/*.jpg $BEATLES_DIR/*.jpeg $BEATLES_DIR/*.png 2>/dev/null)" ]; then
    echo "❌ No images found in $BEATLES_DIR"
    echo "Please copy your Beatles images to this directory first."
    echo ""
    echo "Steps:"
    echo "1. Copy your Beatles images to: $BEATLES_DIR"
    echo "2. Run this script again"
    exit 1
fi

echo "📁 Found images in $BEATLES_DIR:"
ls -la "$BEATLES_DIR"/*.jpg "$BEATLES_DIR"/*.jpeg "$BEATLES_DIR"/*.png 2>/dev/null

echo ""
echo "🔄 Renaming images..."

# Counter for renaming
counter=1

# Loop through all image files and rename them
for file in "$BEATLES_DIR"/*.jpg "$BEATLES_DIR"/*.jpeg "$BEATLES_DIR"/*.png; do
    if [ -f "$file" ]; then
        # Get file extension
        extension="${file##*.}"
        
        # Create new filename
        new_name="$BEATLES_DIR/beatles-$counter.$extension"
        
        # Rename the file
        mv "$file" "$new_name"
        echo "✅ Renamed: $(basename "$file") → beatles-$counter.$extension"
        
        counter=$((counter + 1))
    fi
done

echo ""
echo "🎉 All Beatles images have been renamed!"
echo "📋 Final list:"
ls -la "$BEATLES_DIR"

echo ""
echo "🚀 Your Beatles theme is ready to use!"
echo "   Select 'The Beatles' theme in your app to see the new images." 