/**
 * Image Publisher Service
 * Handles publishing generated images to staging and production environments
 */

import { supabase } from '@/core/integrations/supabase/client';

export interface PublishTarget {
  environment: 'staging' | 'production' | 'both';
  collection: 'hero' | 'era' | 'prompt';
}

export interface ImagePublishData {
  id: string;
  url: string;
  title?: string;
  seed?: number;
  score?: number;
  collection: string;
  sectionIndex: number;
}

export interface PublishResult {
  success: boolean;
  environment: string;
  imageId: string;
  error?: string;
}

class ImagePublisherService {
  private stagingBucket = 'era-images-staging';
  private productionBucket = 'era-images';
  
  /**
   * Publish a single image to the specified environment(s)
   */
  async publishImage(
    data: ImagePublishData,
    target: PublishTarget
  ): Promise<PublishResult[]> {
    const results: PublishResult[] = [];
    
    try {
      // Download image from Runware URL
      const imageBlob = await this.downloadImage(data.url);
      
      // Generate unique filename
      const filename = this.generateFilename(data);
      
      // Publish to staging
      if (target.environment === 'staging' || target.environment === 'both') {
        const stagingResult = await this.uploadToSupabase(
          imageBlob,
          filename,
          this.stagingBucket
        );
        
        results.push({
          success: stagingResult.success,
          environment: 'staging',
          imageId: data.id,
          error: stagingResult.error
        });
        
        // Update database with staging URL
        if (stagingResult.success) {
          await this.updateDatabase(data, stagingResult.publicUrl, 'staging');
        }
      }
      
      // Publish to production
      if (target.environment === 'production' || target.environment === 'both') {
        const productionResult = await this.uploadToSupabase(
          imageBlob,
          filename,
          this.productionBucket
        );
        
        results.push({
          success: productionResult.success,
          environment: 'production',
          imageId: data.id,
          error: productionResult.error
        });
        
        // Update database with production URL
        if (productionResult.success) {
          await this.updateDatabase(data, productionResult.publicUrl, 'production');
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error publishing image:', error);
      return [{
        success: false,
        environment: target.environment,
        imageId: data.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }];
    }
  }
  
  /**
   * Publish multiple images in batch
   */
  async publishBatch(
    images: ImagePublishData[],
    target: PublishTarget
  ): Promise<PublishResult[]> {
    const allResults: PublishResult[] = [];
    
    // Process in parallel with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(image => this.publishImage(image, target))
      );
      
      allResults.push(...batchResults.flat());
    }
    
    return allResults;
  }
  
  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return await response.blob();
  }
  
  /**
   * Upload image to Supabase storage
   */
  private async uploadToSupabase(
    blob: Blob,
    filename: string,
    bucket: string
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, blob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);
      
      return {
        success: true,
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
  
  /**
   * Update database with published image information
   */
  private async updateDatabase(
    data: ImagePublishData,
    publicUrl: string,
    environment: 'staging' | 'production'
  ): Promise<void> {
    const tableName = environment === 'staging' 
      ? 'era_images_staging' 
      : 'era_images';
    
    const { error } = await supabase
      .from(tableName)
      .upsert({
        id: data.id,
        collection: data.collection,
        section_index: data.sectionIndex,
        title: data.title,
        url: publicUrl,
        original_url: data.url,
        seed: data.seed,
        score: data.score,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (error) {
      console.error(`Failed to update database for ${environment}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate unique filename for the image
   */
  private generateFilename(data: ImagePublishData): string {
    const timestamp = Date.now();
    const collection = data.collection.toLowerCase();
    const sanitizedId = data.id.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    
    return `${collection}/${sanitizedId}-${timestamp}.webp`;
  }
  
  /**
   * Get publication status for images
   */
  async getPublicationStatus(
    imageIds: string[]
  ): Promise<Record<string, { staging: boolean; production: boolean }>> {
    const status: Record<string, { staging: boolean; production: boolean }> = {};
    
    // Check staging
    const { data: stagingData } = await supabase
      .from('era_images_staging')
      .select('id')
      .in('id', imageIds);
    
    // Check production  
    const { data: productionData } = await supabase
      .from('era_images')
      .select('id')
      .in('id', imageIds);
    
    const stagingIds = new Set(stagingData?.map(item => item.id) || []);
    const productionIds = new Set(productionData?.map(item => item.id) || []);
    
    imageIds.forEach(id => {
      status[id] = {
        staging: stagingIds.has(id),
        production: productionIds.has(id)
      };
    });
    
    return status;
  }
}

// Export singleton instance
export const imagePublisher = new ImagePublisherService();

// Export function for use in the HTML page
export async function publishImageToEnvironment(
  imageKey: string,
  imageUrl: string,
  target: 'staging' | 'production' | 'both'
): Promise<{ success: boolean; message: string }> {
  try {
    const [collection, index] = imageKey.split('-');
    
    const data: ImagePublishData = {
      id: imageKey,
      url: imageUrl,
      collection,
      sectionIndex: parseInt(index, 10)
    };
    
    const results = await imagePublisher.publishImage(
      data,
      { environment: target, collection: collection as any }
    );
    
    const allSuccess = results.every(r => r.success);
    const message = allSuccess
      ? `Successfully published to ${target}`
      : `Some uploads failed: ${results.filter(r => !r.success).map(r => r.error).join(', ')}`;
    
    return { success: allSuccess, message };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
