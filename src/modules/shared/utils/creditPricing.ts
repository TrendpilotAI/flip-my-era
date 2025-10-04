/**
 * Credit Pricing Engine for FlipMyEra
 *
 * Calculates credit costs for different AI operations based on:
 * - Operation type (story/image/video/audio)
 * - Model quality (basic/advanced/ultra)
 * - Speed priority
 * - Commercial licensing
 * - Bulk discounts
 */

export type OperationType =
  | 'story_generation'
  | 'chapter_generation'
  | 'novel_outline'
  | 'character_development'
  | 'plot_enhancement'
  | 'image_generation'
  | 'video_generation'
  | 'audio_narration'
  | 'sound_effects'
  | 'background_music';

export type ModelQuality = 'basic' | 'advanced' | 'ultra';
export type ImageSubject = 'story_illustration' | 'character_portrait' | 'scene_background' | 'cover_art' | 'multi_panel_spread';
export type VideoType = 'story_recrap' | 'character_intro' | 'scene_animation' | 'full_adaptation';
export type AudioType = 'narration' | 'sound_effects' | 'background_music';

export interface CreditCostParams {
  operationType: OperationType;
  modelQuality: ModelQuality;
  speedPriority?: boolean;
  commercialLicense?: boolean;
  quantity?: number;

  // Type-specific parameters
  wordCount?: number; // For story operations
  imageSubject?: ImageSubject; // For image operations
  videoType?: VideoType; // For video operations
  audioType?: AudioType; // For audio operations
  durationMinutes?: number; // For audio operations
}

export interface CreditCostResult {
  baseCost: number;
  speedCost: number;
  commercialCost: number;
  bulkDiscount: number;
  totalCost: number;
  breakdown: {
    operation: string;
    quality: string;
    speed: string;
    commercial: string;
    bulk: string;
  };
}

/**
 * Credit cost calculation engine
 */
export function calculateCreditCost(params: CreditCostParams): CreditCostResult {
  const {
    operationType,
    modelQuality,
    speedPriority = false,
    commercialLicense = false,
    quantity = 1
  } = params;

  // Base cost calculation
  let baseCost = calculateBaseCost(operationType, modelQuality, params);

  // Apply quantity
  baseCost *= quantity;

  // Speed priority cost
  const speedCost = speedPriority ? calculateSpeedCost(operationType, baseCost) : 0;

  // Commercial license cost (+50% of base + speed)
  const commercialCost = commercialLicense ? (baseCost + speedCost) * 0.5 : 0;

  // Bulk discount (-10% per item for 5+ items)
  const bulkDiscount = quantity >= 5 ? (baseCost + speedCost + commercialCost) * 0.1 : 0;

  // Total cost
  const totalCost = Math.max(0.1, baseCost + speedCost + commercialCost - bulkDiscount);

  return {
    baseCost: Math.round(baseCost * 100) / 100,
    speedCost: Math.round(speedCost * 100) / 100,
    commercialCost: Math.round(commercialCost * 100) / 100,
    bulkDiscount: Math.round(bulkDiscount * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    breakdown: {
      operation: `${operationType} (${quantity}x)`,
      quality: modelQuality,
      speed: speedPriority ? 'priority' : 'normal',
      commercial: commercialLicense ? '+50% license' : 'standard',
      bulk: quantity >= 5 ? '10% discount' : 'no discount'
    }
  };
}

/**
 * Calculate base cost for different operation types
 */
function calculateBaseCost(operationType: OperationType, quality: ModelQuality, params: CreditCostParams): number {
  const qualityMultiplier = {
    basic: 1,
    advanced: 2,
    ultra: 4
  }[quality];

  switch (operationType) {
    // Story Generation (LLM Models)
    case 'story_generation':
      return 1 * qualityMultiplier;

    case 'chapter_generation':
      return 1.5 * qualityMultiplier;

    case 'novel_outline':
      return 2 * qualityMultiplier;

    case 'character_development':
      return 1 * qualityMultiplier;

    case 'plot_enhancement':
      return 1.5 * qualityMultiplier;

    // Image Generation (Visual Models)
    case 'image_generation':
      return calculateImageCost(params.imageSubject || 'story_illustration', quality);

    // Video Generation (A/V Models)
    case 'video_generation':
      return calculateVideoCost(params.videoType || 'story_recrap', quality);

    // Audio Generation (Text-to-Speech)
    case 'audio_narration':
      return calculateAudioCost('narration', quality, params.durationMinutes || 1);

    case 'sound_effects':
      return calculateAudioCost('sound_effects', quality, 1);

    case 'background_music':
      return calculateAudioCost('background_music', quality, 1);

    default:
      return 1; // Default fallback
  }
}

/**
 * Calculate image generation costs
 */
function calculateImageCost(subject: ImageSubject, quality: ModelQuality): number {
  const baseCosts = {
    story_illustration: { basic: 0.5, advanced: 1, ultra: 2 },
    character_portrait: { basic: 1, advanced: 2, ultra: 4 },
    scene_background: { basic: 0.8, advanced: 1.5, ultra: 3 },
    cover_art: { basic: 1.5, advanced: 3, ultra: 6 },
    multi_panel_spread: { basic: 2, advanced: 4, ultra: 8 }
  };

  return baseCosts[subject][quality];
}

/**
 * Calculate video generation costs
 */
function calculateVideoCost(videoType: VideoType, quality: ModelQuality): number {
  const baseCosts = {
    story_recrap: { basic: 5, advanced: 10, ultra: 20 },
    character_intro: { basic: 8, advanced: 15, ultra: 30 },
    scene_animation: { basic: 12, advanced: 25, ultra: 50 },
    full_adaptation: { basic: 25, advanced: 50, ultra: 100 }
  };

  return baseCosts[videoType][quality];
}

/**
 * Calculate audio generation costs
 */
function calculateAudioCost(audioType: AudioType, quality: ModelQuality, durationMinutes: number): number {
  const perMinuteCosts = {
    narration: { basic: 0.5, advanced: 1, ultra: 3 },
    sound_effects: { basic: 0.3, advanced: 0.6, ultra: 1.2 },
    background_music: { basic: 0.8, advanced: 1.5, ultra: 3 }
  };

  return perMinuteCosts[audioType][quality] * durationMinutes;
}

/**
 * Calculate speed priority costs
 */
function calculateSpeedCost(operationType: OperationType, baseCost: number): number {
  // Speed costs vary by operation complexity
  const speedMultipliers = {
    story_generation: 0.25, // +25% of base cost
    chapter_generation: 0.25,
    novel_outline: 0.25,
    character_development: 0.25,
    plot_enhancement: 0.25,
    image_generation: 0.5, // +50% for visual processing
    video_generation: 0.4, // +40% for video processing
    audio_narration: 0.2, // +20% for audio processing
    sound_effects: 0.1,
    background_music: 0.3
  };

  return baseCost * (speedMultipliers[operationType] || 0.25);
}

/**
 * Validate credit cost parameters
 */
export function validateCreditCostParams(params: CreditCostParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.operationType) {
    errors.push('Operation type is required');
  }

  if (!params.modelQuality) {
    errors.push('Model quality is required');
  }

  if (params.quantity !== undefined && (params.quantity < 1 || params.quantity > 1000)) {
    errors.push('Quantity must be between 1 and 1000');
  }

  // Operation-specific validations
  if (params.operationType?.includes('audio') && !params.durationMinutes) {
    errors.push('Duration in minutes is required for audio operations');
  }

  if (params.operationType === 'image_generation' && !params.imageSubject) {
    errors.push('Image subject is required for image generation');
  }

  if (params.operationType === 'video_generation' && !params.videoType) {
    errors.push('Video type is required for video generation');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get estimated cost for common operations
 */
export function getEstimatedCost(operationType: OperationType, quality: ModelQuality = 'basic'): number {
  return calculateCreditCost({
    operationType,
    modelQuality: quality,
    speedPriority: false,
    commercialLicense: false,
    quantity: 1
  }).totalCost;
}

/**
 * Calculate cost for multiple operations
 */
export function calculateBulkCost(operations: CreditCostParams[]): {
  totalCost: number;
  breakdown: CreditCostResult[];
  savings: number;
} {
  const results = operations.map(op => calculateCreditCost(op));
  const totalWithoutBulk = results.reduce((sum, result) => sum + (result.baseCost + result.speedCost + result.commercialCost), 0);
  const totalWithBulk = results.reduce((sum, result) => sum + result.totalCost, 0);
  const savings = totalWithoutBulk - totalWithBulk;

  return {
    totalCost: Math.round(totalWithBulk * 100) / 100,
    breakdown: results,
    savings: Math.round(savings * 100) / 100
  };
}
