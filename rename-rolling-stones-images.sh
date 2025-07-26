#!/bin/bash

# Script to rename Rolling Stones images in the correct directory
# Usage: ./rename-rolling-stones-images.sh

ROLLING_STONES_DIR="public/images/themes/rolling-stones"

echo "🎸 Rolling Stones Image Renamer"
echo "================================"

# Check if directory exists
if [ ! -d "$ROLLING_STONES_DIR" ]; then
    echo "❌ Directory $ROLLING_STONES_DIR does not exist!"
    echo "Please create the directory first."
    exit 1
fi

# Check if there are any images in the directory
if [ -z "$(ls -A $ROLLING_STONES_DIR/*.jpg $ROLLING_STONES_DIR/*.jpeg $ROLLING_STONES_DIR/*.png $ROLLING_STONES_DIR/*.avif 2>/dev/null)" ]; then
    echo "❌ No images found in $ROLLING_STONES_DIR"
    echo "Please copy your Rolling Stones images to this directory first."
    echo ""
    echo "Steps:"
    echo "1. Copy your Rolling Stones images to: $ROLLING_STONES_DIR"
    echo "2. Run this script again"
    exit 1
fi

echo "📁 Found images in $ROLLING_STONES_DIR:"
ls -la "$ROLLING_STONES_DIR"/*.jpg "$ROLLING_STONES_DIR"/*.jpeg "$ROLLING_STONES_DIR"/*.png "$ROLLING_STONES_DIR"/*.avif 2>/dev/null

echo ""
echo "🔄 Renaming images..."

# Counter for renaming
counter=1

# Loop through all image files and rename them
for file in "$ROLLING_STONES_DIR"/*.jpg "$ROLLING_STONES_DIR"/*.jpeg "$ROLLING_STONES_DIR"/*.png "$ROLLING_STONES_DIR"/*.avif; do
    if [ -f "$file" ]; then
        # Get file extension
        extension="${file##*.}"
        
        # Create new filename
        new_name="$ROLLING_STONES_DIR/rolling-stones-$counter.$extension"
        
        # Rename the file
        mv "$file" "$new_name"
        echo "✅ Renamed: $(basename "$file") → rolling-stones-$counter.$extension"
        
        counter=$((counter + 1))
    fi
done

echo ""
echo "🎉 All Rolling Stones images have been renamed!"
echo "📋 Final list:"
ls -la "$ROLLING_STONES_DIR"

echo ""
echo "🚀 Your Rolling Stones theme is ready to use!"
echo "   Select 'The Rolling Stones' theme in your app to see the new images." 