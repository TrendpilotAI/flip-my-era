import { describe, it, expect } from 'vitest';
import {
  calculateCreditCost,
  validateCreditCostParams,
  getEstimatedCost,
  calculateBulkCost,
  type CreditCostParams,
  type OperationType,
  type ModelQuality
} from '../creditPricing';

describe('creditPricing', () => {
  describe('calculateCreditCost', () => {
    it('should calculate basic story generation cost correctly', () => {
      const params: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        quantity: 1
      };

      const result = calculateCreditCost(params);

      expect(result.baseCost).toBe(1);
      expect(result.speedCost).toBe(0);
      expect(result.commercialCost).toBe(0);
      expect(result.bulkDiscount).toBe(0);
      expect(result.totalCost).toBe(1);
    });

    it('should apply quality multipliers correctly', () => {
      const basicParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        quantity: 1
      };

      const advancedParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'advanced',
        quantity: 1
      };

      const ultraParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'ultra',
        quantity: 1
      };

      const basicResult = calculateCreditCost(basicParams);
      const advancedResult = calculateCreditCost(advancedParams);
      const ultraResult = calculateCreditCost(ultraParams);

      expect(advancedResult.baseCost).toBe(basicResult.baseCost * 2);
      expect(ultraResult.baseCost).toBe(basicResult.baseCost * 4);
    });

    it('should apply speed priority cost correctly', () => {
      const normalParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        speedPriority: false,
        quantity: 1
      };

      const priorityParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        speedPriority: true,
        quantity: 1
      };

      const normalResult = calculateCreditCost(normalParams);
      const priorityResult = calculateCreditCost(priorityParams);

      expect(priorityResult.speedCost).toBe(normalResult.baseCost * 0.25);
      expect(priorityResult.totalCost).toBeGreaterThan(normalResult.totalCost);
    });

    it('should apply commercial license cost correctly', () => {
      const standardParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        commercialLicense: false,
        quantity: 1
      };

      const commercialParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        commercialLicense: true,
        quantity: 1
      };

      const standardResult = calculateCreditCost(standardParams);
      const commercialResult = calculateCreditCost(commercialParams);

      expect(commercialResult.commercialCost).toBe(standardResult.baseCost * 0.5);
      expect(commercialResult.totalCost).toBeGreaterThan(standardResult.totalCost);
    });

    it('should apply bulk discount for 5+ items', () => {
      const singleParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        quantity: 1
      };

      const bulkParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        quantity: 5
      };

      const singleResult = calculateCreditCost(singleParams);
      const bulkResult = calculateCreditCost(bulkParams);

      expect(bulkResult.bulkDiscount).toBeGreaterThan(0);
      expect(bulkResult.totalCost).toBeLessThan(singleResult.totalCost * 5);
    });

    it('should calculate different operation types correctly', () => {
      const storyParams: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        quantity: 1
      };

      const chapterParams: CreditCostParams = {
        operationType: 'chapter_generation',
        modelQuality: 'basic',
        quantity: 1
      };

      const imageParams: CreditCostParams = {
        operationType: 'image_generation',
        modelQuality: 'basic',
        imageSubject: 'story_illustration',
        quantity: 1
      };

      const storyResult = calculateCreditCost(storyParams);
      const chapterResult = calculateCreditCost(chapterParams);
      const imageResult = calculateCreditCost(imageParams);

      expect(chapterResult.baseCost).toBe(storyResult.baseCost * 1.5);
      expect(imageResult.baseCost).toBe(0.5); // story_illustration basic cost
    });

    it('should handle image generation with different subjects', () => {
      const subjects = [
        'story_illustration',
        'character_portrait',
        'scene_background',
        'cover_art',
        'multi_panel_spread'
      ] as const;

      const results = subjects.map(subject => 
        calculateCreditCost({
          operationType: 'image_generation',
          modelQuality: 'basic',
          imageSubject: subject,
          quantity: 1
        })
      );

      // Cover art should be most expensive, story illustration least
      expect(results[3].baseCost).toBeGreaterThan(results[0].baseCost);
      expect(results[4].baseCost).toBeGreaterThan(results[0].baseCost);
    });

    it('should handle video generation costs', () => {
      const videoTypes = [
        'story_recrap',
        'character_intro',
        'scene_animation',
        'full_adaptation'
      ] as const;

      const results = videoTypes.map(videoType => 
        calculateCreditCost({
          operationType: 'video_generation',
          modelQuality: 'basic',
          videoType,
          quantity: 1
        })
      );

      // Full adaptation should be most expensive
      expect(results[3].baseCost).toBeGreaterThan(results[0].baseCost);
    });

    it('should handle audio generation with duration', () => {
      const shortAudio: CreditCostParams = {
        operationType: 'audio_narration',
        modelQuality: 'basic',
        durationMinutes: 1,
        quantity: 1
      };

      const longAudio: CreditCostParams = {
        operationType: 'audio_narration',
        modelQuality: 'basic',
        durationMinutes: 10,
        quantity: 1
      };

      const shortResult = calculateCreditCost(shortAudio);
      const longResult = calculateCreditCost(longAudio);

      expect(longResult.baseCost).toBe(shortResult.baseCost * 10);
    });

    it('should ensure minimum cost of 0.1', () => {
      const params: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        quantity: 0.1 // Very small quantity
      };

      const result = calculateCreditCost(params);
      expect(result.totalCost).toBe(0.1);
    });
  });

  describe('validateCreditCostParams', () => {
    it('should validate correct parameters', () => {
      const params: CreditCostParams = {
        operationType: 'story_generation',
        modelQuality: 'basic',
        quantity: 1
      };

      const result = validateCreditCostParams(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require operation type', () => {
      const params = {
        modelQuality: 'basic' as ModelQuality,
        quantity: 1
      } as CreditCostParams;

      const result = validateCreditCostParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Operation type is required');
    });

    it('should require model quality', () => {
      const params = {
        operationType: 'story_generation' as OperationType,
        quantity: 1
      } as CreditCostParams;

      const result = validateCreditCostParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model quality is required');
    });

    it('should validate quantity range', () => {
      const invalidQuantities = [0, -1, 1001];

      invalidQuantities.forEach(quantity => {
        const params: CreditCostParams = {
          operationType: 'story_generation',
          modelQuality: 'basic',
          quantity
        };

        const result = validateCreditCostParams(params);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Quantity must be between 1 and 1000');
      });
    });

    it('should allow valid quantities', () => {
      const validQuantities = [1, 5, 100, 1000];

      validQuantities.forEach(quantity => {
        const params: CreditCostParams = {
          operationType: 'story_generation',
          modelQuality: 'basic',
          quantity
        };

        const result = validateCreditCostParams(params);
        expect(result.valid).toBe(true);
        expect(result.errors).not.toContain('Quantity must be between 1 and 1000');
      });
    });

    it('should require duration for audio operations', () => {
      const params: CreditCostParams = {
        operationType: 'audio_narration',
        modelQuality: 'basic',
        quantity: 1
      };

      const result = validateCreditCostParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duration in minutes is required for audio operations');
    });

    it('should require image subject for image generation', () => {
      const params: CreditCostParams = {
        operationType: 'image_generation',
        modelQuality: 'basic',
        quantity: 1
      };

      const result = validateCreditCostParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Image subject is required for image generation');
    });

    it('should require video type for video generation', () => {
      const params: CreditCostParams = {
        operationType: 'video_generation',
        modelQuality: 'basic',
        quantity: 1
      };

      const result = validateCreditCostParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Video type is required for video generation');
    });
  });

  describe('getEstimatedCost', () => {
    it('should return estimated cost for basic operations', () => {
      const storyCost = getEstimatedCost('story_generation', 'basic');
      const chapterCost = getEstimatedCost('chapter_generation', 'basic');
      const imageCost = getEstimatedCost('image_generation', 'basic');

      expect(storyCost).toBe(1);
      expect(chapterCost).toBe(1.5);
      expect(imageCost).toBe(0.5); // story_illustration default
    });

    it('should return different costs for different qualities', () => {
      const basicCost = getEstimatedCost('story_generation', 'basic');
      const advancedCost = getEstimatedCost('story_generation', 'advanced');
      const ultraCost = getEstimatedCost('story_generation', 'ultra');

      expect(advancedCost).toBe(basicCost * 2);
      expect(ultraCost).toBe(basicCost * 4);
    });
  });

  describe('calculateBulkCost', () => {
    it('should calculate bulk cost correctly', () => {
      const operations: CreditCostParams[] = [
        {
          operationType: 'story_generation',
          modelQuality: 'basic',
          quantity: 1
        },
        {
          operationType: 'image_generation',
          modelQuality: 'basic',
          imageSubject: 'story_illustration',
          quantity: 1
        }
      ];

      const result = calculateBulkCost(operations);

      expect(result.totalCost).toBe(1.5); // 1 + 0.5
      expect(result.breakdown).toHaveLength(2);
      expect(result.savings).toBe(0); // No bulk discount for 2 items
    });

    it('should apply bulk discount for 5+ items', () => {
      const operations: CreditCostParams[] = [{
        operationType: 'story_generation',
        modelQuality: 'basic',
        quantity: 5 // Single operation with quantity 5
      }];

      const result = calculateBulkCost(operations);

      expect(result.totalCost).toBeLessThan(5); // Should have bulk discount
      expect(result.savings).toBeGreaterThan(0);
    });
  });
});