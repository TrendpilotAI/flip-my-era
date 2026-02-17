// === AI Image Enhancement Module Types ===

export type ImageStyle = 'retro' | 'neon' | 'vintage' | 'watercolor' | 'comic' | 'minimalist' | 'photorealistic' | 'art-deco';

export type CoverSize = '6x9' | '5x8' | '8.5x11' | 'square';

export interface GenerationRequest {
  prompt: string;
  style: ImageStyle;
  size: CoverSize;
  negativePrompt?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: ImageStyle;
  size: CoverSize;
  createdAt: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
}

export interface StyleTransferRequest {
  sourceImageUrl: string;
  targetStyle: ImageStyle;
  intensity: number; // 0-100
}

export interface StyleTransferResult {
  id: string;
  originalUrl: string;
  resultUrl: string;
  style: ImageStyle;
  intensity: number;
  status: 'pending' | 'processing' | 'complete' | 'failed';
}

export interface ChapterIllustrationRequest {
  chapterId: string;
  chapterText: string;
  style: ImageStyle;
  count: number;
}

export interface ChapterIllustration {
  id: string;
  chapterId: string;
  url: string;
  caption: string;
  style: ImageStyle;
  status: 'pending' | 'generating' | 'complete' | 'failed';
}

export type FilterType = 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale';

export interface ImageFilter {
  type: FilterType;
  value: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EditorState {
  imageUrl: string;
  filters: ImageFilter[];
  textOverlays: TextOverlay[];
  crop: CropArea | null;
  zoom: number;
  rotation: number;
}

export type AssetCategory = 'stickers' | 'borders' | 'frames' | 'backgrounds' | 'icons';

export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  category: AssetCategory;
  tags: string[];
  isPremium: boolean;
}

export interface AssetLibraryFilters {
  category: AssetCategory | 'all';
  search: string;
  showPremiumOnly: boolean;
}
