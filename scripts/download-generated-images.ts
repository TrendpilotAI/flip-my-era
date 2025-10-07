#!/usr/bin/env bun

/**
 * Script to download all generated images from Runware URLs and save them locally
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// Configuration
const INPUT_FILE = path.join(process.cwd(), 'src/modules/story/data/generatedImagesWithVariations.json');
const OUTPUT_DIR = path.join(process.cwd(), 'public/images/generated');
const OUTPUT_JSON = path.join(process.cwd(), 'src/modules/story/data/generatedImagesLocal.json');

interface ImageVariation {
  url: string;
  seed: number;
  cost: number;
  score?: number;
  reasoning?: string;
}

interface ImageItem {
  id: string;
  title?: string;
  variations: ImageVariation[];
  bestImageIndex: number;
  bestImage: ImageVariation;
}

interface ImageData {
  heroGallery: ImageItem[];
  eras: ImageItem[];
  prompts: ImageItem[];
}

/**
 * Download a single image from URL
 */
async function downloadImage(url: string, outputPath: string): Promise<string> {
  try {
    console.log(`  Downloading: ${path.basename(outputPath)}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Convert response to Node.js stream and save
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    return outputPath;
  } catch (error) {
    console.error(`  ❌ Failed to download ${url}:`, error);
    throw error;
  }
}

/**
 * Extract image ID from Runware URL
 */
function extractImageId(url: string): string {
  const match = url.match(/\/([a-f0-9-]+)\.\w+$/);
  return match ? match[1] : Date.now().toString();
}

/**
 * Process and download all images in a section
 */
async function processSection(
  items: ImageItem[],
  sectionName: string
): Promise<ImageItem[]> {
  const processedItems: ImageItem[] = [];
  
  console.log(`\n📂 Processing ${sectionName} (${items.length} items)...`);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n  📸 ${item.title || item.id} (${i + 1}/${items.length})`);
    
    const processedVariations: ImageVariation[] = [];
    const sectionDir = sectionName.toLowerCase().replace(' ', '-');
    
    // Download each variation
    for (let v = 0; v < item.variations.length; v++) {
      const variation = item.variations[v];
      const imageId = extractImageId(variation.url);
      const filename = `${item.id}-v${v + 1}-${imageId}.webp`;
      const localPath = path.join(OUTPUT_DIR, sectionDir, filename);
              const publicPath = `/public/images/generated/${sectionDir}/${filename}`;
      
      try {
        await downloadImage(variation.url, localPath);
        
        processedVariations.push({
          ...variation,
          url: publicPath,
          originalUrl: variation.url
        });
      } catch (error) {
        // Keep original URL if download fails
        processedVariations.push(variation);
      }
    }
    
    // Update best image URL
    const bestImage = processedVariations[item.bestImageIndex] || processedVariations[0];
    
    processedItems.push({
      ...item,
      variations: processedVariations,
      bestImage: bestImage
    });
    
    // Add small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return processedItems;
}

/**
 * Main function to download all images
 */
async function downloadAllImages() {
  console.log('🎨 Starting image download process...\n');
  
  try {
    // Read the input JSON
    console.log(`📖 Reading: ${INPUT_FILE}`);
    const jsonData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const imageData: ImageData = JSON.parse(jsonData);
    
    // Count total images
    let totalImages = 0;
    ['heroGallery', 'eras', 'prompts'].forEach(section => {
      if (imageData[section as keyof ImageData]) {
        imageData[section as keyof ImageData].forEach(item => {
          totalImages += item.variations?.length || 0;
        });
      }
    });
    
    console.log(`📊 Found ${totalImages} total images to download`);
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
    }
    
    // Process each section
    const processedData: ImageData = {
      heroGallery: [],
      eras: [],
      prompts: []
    };
    
    // Download Hero Gallery images
    if (imageData.heroGallery) {
      processedData.heroGallery = await processSection(
        imageData.heroGallery,
        'Hero Gallery'
      );
    }
    
    // Download Era images
    if (imageData.eras) {
      processedData.eras = await processSection(
        imageData.eras,
        'Eras'
      );
    }
    
    // Download Story Prompt images
    if (imageData.prompts) {
      processedData.prompts = await processSection(
        imageData.prompts,
        'Prompts'
      );
    }
    
    // Save the updated JSON with local paths
    console.log(`\n💾 Saving updated JSON to: ${OUTPUT_JSON}`);
    fs.writeFileSync(
      OUTPUT_JSON,
      JSON.stringify(processedData, null, 2)
    );
    
    // Create a summary file
    const summaryPath = path.join(OUTPUT_DIR, 'download-summary.json');
    const summary = {
      downloadedAt: new Date().toISOString(),
      totalImages,
      sections: {
        heroGallery: processedData.heroGallery.length,
        eras: processedData.eras.length,
        prompts: processedData.prompts.length
      },
      outputDirectory: OUTPUT_DIR
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Create an HTML preview page
    const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Downloaded Images - Flip My Era</title>
    <style>
        body {
            font-family: system-ui;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .stats {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 10px;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .image-card {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .image-card img {
            width: 100%;
            height: 250px;
            object-fit: cover;
        }
        .image-card .title {
            padding: 10px;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <h1>Downloaded Era Images</h1>
    <div class="stats">
        <p>Downloaded: ${new Date().toLocaleString()}</p>
        <p>Total Images: ${totalImages}</p>
        <p>Hero Gallery: ${processedData.heroGallery.length} | Eras: ${processedData.eras.length} | Prompts: ${processedData.prompts.length}</p>
    </div>
    
    ${processedData.heroGallery.length > 0 ? `
        <div class="section">
            <h2>Hero Gallery</h2>
            <div class="gallery">
                ${processedData.heroGallery.map(item => `
                    <div class="image-card">
                        <img src="${item.bestImage.url}" alt="${item.title || item.id}">
                        <div class="title">${item.title || item.id}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : ''}
    
    ${processedData.eras.length > 0 ? `
        <div class="section">
            <h2>Era Images</h2>
            <div class="gallery">
                ${processedData.eras.map(item => `
                    <div class="image-card">
                        <img src="${item.bestImage.url}" alt="${item.title || item.id}">
                        <div class="title">${item.title || item.id}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : ''}
    
    ${processedData.prompts.length > 0 ? `
        <div class="section">
            <h2>Story Prompts</h2>
            <div class="gallery">
                ${processedData.prompts.slice(0, 20).map(item => `
                    <div class="image-card">
                        <img src="${item.bestImage.url}" alt="${item.title || item.id}">
                        <div class="title">${item.title || item.id}</div>
                    </div>
                `).join('')}
                ${processedData.prompts.length > 20 ? `<p style="text-align: center; color: #666;">...and ${processedData.prompts.length - 20} more</p>` : ''}
            </div>
        </div>
    ` : ''}
</body>
</html>`;
    
    const previewPath = path.join(process.cwd(), 'public/downloaded-images.html');
    fs.writeFileSync(previewPath, previewHtml);
    
    console.log('\n✅ Download complete!');
    console.log(`   Images saved to: ${OUTPUT_DIR}`);
    console.log(`   Updated JSON: ${OUTPUT_JSON}`);
    console.log(`   Preview page: ${previewPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Hero Gallery: ${processedData.heroGallery.length} items`);
    console.log(`   - Eras: ${processedData.eras.length} items`);
    console.log(`   - Prompts: ${processedData.prompts.length} items`);
    console.log(`   - Total images: ${totalImages}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the download
downloadAllImages().catch(console.error);
