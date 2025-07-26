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
 * Save a single generated image to the ebook_generations table via edge function
 */
export async function saveImageToEbook({
  ebookId,
  imageData,
  token
}: SaveImageToEbookParams): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 DEBUGGING: saveImageToEbook called with:', { ebookId, imageData });
    
    // Use the ebook-generation edge function instead of direct database update
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/ebook-generation`;
    
    // Prepare the request body for the edge function
    const requestBody = {
      ebook_id: ebookId,
      images: [imageData] // Send as array to append to existing images
    };
    
    console.log('🔍 DEBUGGING: Calling ebook-generation edge function with:', requestBody);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🔍 DEBUGGING: Edge function response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 DEBUGGING: Edge function error:', errorText);
      throw new Error(`Edge function call failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🔍 DEBUGGING: Edge function success result:', result);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving image to ebook via edge function:', error);
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
  try {
    // First, save to the images array
    const imageResult = await saveImageToEbook({
      ebookId,
      imageData: {
        type: 'cover',
        url: imageUrl,
        prompt
      },
      token
    });

    if (!imageResult.success) {
      return imageResult;
    }

    // Also update the cover_image_url field
    const coverUrlResult = await updateCoverImageUrl(ebookId, imageUrl, token);
    
    if (!coverUrlResult.success) {
      console.warn('Failed to update cover_image_url field:', coverUrlResult.error);
      // Don't fail the entire operation if this fails
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving cover image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
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
 * Update cover image URL in the ebook_generations table via edge function
 */
export async function updateCoverImageUrl(
  ebookId: string,
  coverImageUrl: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 DEBUGGING: updateCoverImageUrl called with:', { ebookId, coverImageUrl });
    
    // Use the ebook-generation edge function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/ebook-generation`;
    
    const requestBody = {
      ebook_id: ebookId,
      cover_image_url: coverImageUrl
    };
    
    console.log('🔍 DEBUGGING: Calling ebook-generation edge function for cover URL:', requestBody);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🔍 DEBUGGING: Cover URL update response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 DEBUGGING: Cover URL update error:', errorText);
      throw new Error(`Edge function call failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🔍 DEBUGGING: Cover URL update success:', result);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating cover image URL via edge function:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 