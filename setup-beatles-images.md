# Beatles Theme Images Setup

## Instructions for Setting Up Beatles Images

You've uploaded Beatles photos that need to be organized for the Beatles theme. Here's how to set them up:

### 1. Image File Organization

Place your Beatles images in the following directory:
```
flip-my-era/public/images/themes/beatles/
```

### 2. Image Naming Convention

Rename your uploaded Beatles images to match this pattern:
- `beatles-1.jpg` - First Beatles image
- `beatles-2.jpg` - Second Beatles image  
- `beatles-3.jpg` - Third Beatles image
- `beatles-4.jpg` - Fourth Beatles image
- `beatles-5.jpg` - Fifth Beatles image
- `beatles-6.jpg` - Sixth Beatles image
- `beatles-7.jpg` - Seventh Beatles image
- `beatles-8.jpg` - Eighth Beatles image
- `beatles-9.jpg` - Ninth Beatles image

### 3. Image Requirements

- **Format**: JPG or PNG
- **Size**: Recommended 400x300px or larger
- **Quality**: High quality, clear images
- **Content**: Beatles photos (performing, studio, portraits, etc.)

### 4. How It Works

Once you place the images in the correct directory with the correct names:

1. **Beatles Theme**: When users select "The Beatles" theme, they'll see your Beatles photos
2. **Other Themes**: Other themes will continue to show the default Unsplash images
3. **Dynamic Switching**: Images automatically change when users switch themes

### 5. Testing

After setting up the images:
1. Start your development server
2. Select "The Beatles" theme
3. Navigate to any page to see the Beatles photos in the background

### 6. Adding More Themes

To add images for other themes (Taylor Swift, Rolling Stones, etc.):
1. Create a new directory: `flip-my-era/public/images/themes/[theme-name]/`
2. Add images following the same naming pattern
3. Update the `theme-images.ts` file to include the new theme

### Example Directory Structure
```
flip-my-era/public/images/themes/
├── beatles/
│   ├── beatles-1.jpg
│   ├── beatles-2.jpg
│   ├── beatles-3.jpg
│   └── ...
├── taylor-swift/
│   ├── taylor-1.jpg
│   ├── taylor-2.jpg
│   └── ...
└── ...
```

The system is now ready to use your Beatles photos! Just place the images in the correct directory with the correct names. 