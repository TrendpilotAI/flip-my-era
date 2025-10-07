# Image Manager Guide

## Overview

The Image Manager is an interactive web interface for managing your AI-generated era images. It provides features to:
- **Swap best images** with any variation
- **Publish images** to staging or production environments
- **Track changes** and publication status
- **Export selections** as JSON

## Access the Image Manager

1. **Start the local server** (if not already running):
```bash
python3 -m http.server 8888
```

2. **Open in browser**:
```
http://localhost:8888/image-manager.html
```

## Features

### 🔄 Swapping Best Images

1. Click the **"👁 Variations"** button on any image card
2. Click on any variation thumbnail to set it as the new "best" image
3. Selected variations are highlighted with a golden border
4. Changes are marked with an "✨ UPDATED" badge

### 🚀 Publishing Images

#### Single Image Publishing
1. Click the **"🚀 Publish"** button on any image
2. Select target environment:
   - **Staging**: Test environment for review
   - **Production**: Live website (requires admin role)
   - **Both**: Deploy to both environments
3. Click "Publish" to upload

#### Batch Publishing
- Click **"🚀 Publish All Best"** in the header to publish all best images to staging

### 💾 Saving Changes

- **Save Changes**: Downloads updated JSON with your best image selections
- **Export Best**: Downloads only the best images in a compact format
- Changes are automatically saved to browser localStorage

### 📊 Statistics Dashboard

The top of the page shows:
- **Total Images**: All generated variations
- **Published**: Count of published images
- **Changes Made**: Number of swapped selections
- **Total Cost**: Combined generation cost

## Backend Integration

### Database Setup

Run the migration to create necessary tables:
```bash
supabase db push
```

This creates:
- `era_images_staging` - Staging environment images
- `era_images` - Production environment images
- Storage buckets for image files
- RLS policies for access control

### API Integration

The `imagePublisher.ts` service provides:
```typescript
import { imagePublisher } from '@/modules/admin/services/imagePublisher';

// Publish single image
await imagePublisher.publishImage(imageData, {
  environment: 'staging',
  collection: 'hero'
});

// Check publication status
const status = await imagePublisher.getPublicationStatus(['hero-1', 'era-2']);
```

### Environment Configuration

Add to your `.env.local`:
```env
# Supabase Storage Buckets
VITE_STAGING_BUCKET=era-images-staging
VITE_PRODUCTION_BUCKET=era-images
```

## Image Collections

Images are organized into three collections:

1. **Hero Gallery** (`hero-*`)
   - Showcase images for main page
   - 5 high-impact visuals

2. **Era Images** (`eras-*`)
   - Era-specific themed images
   - 5 distinctive era styles

3. **Story Prompts** (`prompts-*`)
   - Story-driven illustrations
   - 35 narrative images

## Local Storage

The manager uses browser localStorage to persist:
- `imageManagerChanges`: Track swapped selections
- `publishedImages`: Track published image IDs

Clear localStorage to reset:
```javascript
localStorage.removeItem('imageManagerChanges');
localStorage.removeItem('publishedImages');
```

## Publishing Workflow

### Recommended Process

1. **Review & Select**: Use Image Manager to review all variations
2. **Swap Best**: Click variations to update best selections
3. **Test in Staging**: Publish to staging first
4. **Review Staging**: Check images on staging site
5. **Promote to Production**: Publish approved images to production

### Security Notes

- Staging: All authenticated users can publish
- Production: Only admin users can publish
- Images are stored in Supabase Storage with public URLs
- Original Runware URLs are preserved as backup

## Troubleshooting

### Images Not Loading
- Ensure local server is running on port 8888
- Check browser console for CORS errors
- Verify JSON file exists at correct path

### Publishing Fails
- Check Supabase connection
- Verify user authentication
- Check storage bucket permissions
- Review browser console for API errors

### Changes Not Saving
- Check browser localStorage quota
- Try different browser if issues persist
- Export JSON backup regularly

## File Structure

```
/flip-my-era/
├── image-manager.html              # Main UI interface
├── src/
│   └── modules/
│       ├── admin/
│       │   └── services/
│       │       └── imagePublisher.ts  # Publishing service
│       └── story/
│           └── data/
│               └── generatedImagesWithVariations.json  # Image data
└── supabase/
    └── migrations/
        └── 20251007_era_images_tables.sql  # Database schema
```

## Next Steps

1. **Test Publishing**: Try publishing a few images to staging
2. **Customize UI**: Modify HTML/CSS to match your brand
3. **Add Features**: 
   - Image tagging/categorization
   - Batch operations
   - Image editing integration
   - Analytics tracking
4. **Deploy Manager**: Host the manager on your admin subdomain

## Support

For issues or questions:
1. Check browser console for errors
2. Review network tab for API failures
3. Verify Supabase configuration
4. Check image URLs are accessible
