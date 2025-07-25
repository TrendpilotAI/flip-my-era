import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';

export interface ImageData {
  chapter_id?: string;
  type: 'cover' | 'chapter';
  url: string;
  prompt?: string;
  generated_at?: string;
}

export interface SaveImageToEbookParams {
  ebookId: string;
  imageData: ImageData;
  token: string;
}

export interface UpdateEbookImagesParams {
  ebookId: string;
  images: ImageData[];
  token: string;
}

/**
 * Save a single generated image to the ebook_generations table
 */
export async function saveImageToEbook({
  ebookId,
  imageData,
  token
}: SaveImageToEbookParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClientWithClerkToken(token);
    
    // First, get the current images array
    const { data: currentEbook, error: fetchError } = await supabase
      .from('ebook_generations')
      .select('images')
      .eq('id', ebookId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current ebook:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Prepare the new image data with timestamp
    const newImageData: ImageData = {
      ...imageData,
      generated_at: new Date().toISOString()
    };
    
    // Merge with existing images
    const currentImages = currentEbook?.images || [];
    const updatedImages = [...currentImages, newImageData];
    
    // Update the ebook with the new images array
    const { error: updateError } = await supabase
      .from('ebook_generations')
      .update({
        images: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', ebookId);
    
    if (updateError) {
      console.error('Error updating ebook images:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving image to ebook:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update the entire images array for an ebook
 */
export async function updateEbookImages({
  ebookId,
  images,
  token
}: UpdateEbookImagesParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClientWithClerkToken(token);
    
    // Add timestamps to all images
    const imagesWithTimestamps = images.map(img => ({
      ...img,
      generated_at: img.generated_at || new Date().toISOString()
    }));
    
    // Update the ebook with the new images array
    const { error: updateError } = await supabase
      .from('ebook_generations')
      .update({
        images: imagesWithTimestamps,
        updated_at: new Date().toISOString()
      })
      .eq('id', ebookId);
    
    if (updateError) {
      console.error('Error updating ebook images:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating ebook images:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Save cover image to ebook
 */
export async function saveCoverImageToEbook(
  ebookId: string,
  imageUrl: string,
  prompt: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  return saveImageToEbook({
    ebookId,
    imageData: {
      type: 'cover',
      url: imageUrl,
      prompt
    },
    token
  });
}

/**
 * Save chapter image to ebook
 */
export async function saveChapterImageToEbook(
  ebookId: string,
  chapterId: string,
  imageUrl: string,
  prompt: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  return saveImageToEbook({
    ebookId,
    imageData: {
      chapter_id: chapterId,
      type: 'chapter',
      url: imageUrl,
      prompt
    },
    token
  });
}

/**
 * Get all images for an ebook
 */
export async function getEbookImages(
  ebookId: string,
  token: string
): Promise<{ images: ImageData[] | null; error?: string }> {
  try {
    const supabase = createSupabaseClientWithClerkToken(token);
    
    const { data, error } = await supabase
      .from('ebook_generations')
      .select('images')
      .eq('id', ebookId)
      .single();
    
    if (error) {
      console.error('Error fetching ebook images:', error);
      return { images: null, error: error.message };
    }
    
    return { images: data?.images || [] };
  } catch (error) {
    console.error('Error getting ebook images:', error);
    return { 
      images: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update cover image URL in the ebook_generations table
 */
export async function updateCoverImageUrl(
  ebookId: string,
  coverImageUrl: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClientWithClerkToken(token);
    
    const { error } = await supabase
      .from('ebook_generations')
      .update({
        cover_image_url: coverImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', ebookId);
    
    if (error) {
      console.error('Error updating cover image URL:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating cover image URL:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 