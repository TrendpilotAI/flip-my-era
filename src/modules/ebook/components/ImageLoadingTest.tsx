import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';

interface TestImageData {
  imageUrl?: string;
  url?: string;
  chapterNumber?: number;
  chapter_id?: string;
  type: 'cover' | 'chapter_illustration' | 'chapter';
  prompt?: string;
}

interface TestChapter {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface TestEbookData {
  id: string;
  title: string;
  cover_image_url?: string;
  chapters: TestChapter[];
  images?: TestImageData[];
}

// Test case 1: Streaming-generated images
const testEbookData1: TestEbookData = {
  id: 'test-ebook-1',
  title: 'Test Ebook - Streaming Generated',
  cover_image_url: 'https://example.com/cover.jpg',
  chapters: [
    { id: 'ch1', title: 'Chapter 1', content: 'Content 1' },
    { id: 'ch2', title: 'Chapter 2', content: 'Content 2' },
    { id: 'ch3', title: 'Chapter 3', content: 'Content 3' },
  ],
  images: [
    // Streaming-generated images
    {
      imageUrl: 'https://example.com/streaming-ch1.jpg',
      chapterNumber: 1,
      type: 'chapter_illustration',
      prompt: 'Streaming generated image 1'
    },
    {
      imageUrl: 'https://example.com/streaming-ch2.jpg',
      chapterNumber: 2,
      type: 'chapter_illustration',
      prompt: 'Streaming generated image 2'
    }
  ]
};

// Test case 2: Manual-generated images
const testEbookData2: TestEbookData = {
  id: 'test-ebook-2',
  title: 'Test Ebook - Manual Generated',
  chapters: [
    { id: 'ch1', title: 'Chapter 1', content: 'Content 1' },
    { id: 'ch2', title: 'Chapter 2', content: 'Content 2' },
    { id: 'ch3', title: 'Chapter 3', content: 'Content 3' },
  ],
  images: [
    // Manual images
    {
      url: 'https://example.com/manual-ch1.jpg',
      chapter_id: 'ch1',
      type: 'chapter',
      prompt: 'Manual generated image 1'
    },
    {
      url: 'https://example.com/manual-ch2.jpg',
      chapter_id: 'ch2',
      type: 'chapter',
      prompt: 'Manual generated image 2'
    },
    // Cover image in images array
    {
      url: 'https://example.com/cover-in-array.jpg',
      type: 'cover',
      prompt: 'Cover image in array'
    }
  ]
};

// Test case 3: Mixed data (realistic scenario)
const testEbookData3: TestEbookData = {
  id: 'test-ebook-3',
  title: 'Test Ebook - Mixed Data',
  cover_image_url: 'https://example.com/cover-url.jpg',
  chapters: [
    { id: 'ch1', title: 'Chapter 1', content: 'Content 1' },
    { id: 'ch2', title: 'Chapter 2', content: 'Content 2' },
    { id: 'ch3', title: 'Chapter 3', content: 'Content 3' },
  ],
  images: [
    // Some streaming, some manual
    {
      imageUrl: 'https://example.com/streaming-ch1.jpg',
      chapterNumber: 1,
      type: 'chapter_illustration',
      prompt: 'Streaming generated image'
    },
    {
      url: 'https://example.com/manual-ch2.jpg',
      chapter_id: 'ch2',
      type: 'chapter',
      prompt: 'Manual generated image'
    },
    // Cover in both places
    {
      url: 'https://example.com/cover-in-array.jpg',
      type: 'cover',
      prompt: 'Cover image in array'
    }
  ]
};

// Test case 4: Real database structure (from our check)
const testEbookData4: TestEbookData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Untitled Ebook',
  cover_image_url: 'https://example.com/updated-cover.jpg',
  chapters: [],
  images: []
};

// Helper function to extract image URL from any image object
const extractImageUrl = (imageObj: any): string | undefined => {
  if (!imageObj) return undefined;
  return imageObj.imageUrl || imageObj.url || imageObj.image_url;
};

// Test the image matching logic
const testImageMatching = (ebookData: TestEbookData) => {
  const chaptersWithImages = ebookData.chapters.map((chapter, index) => {
    // Find streaming-generated image by chapterNumber
    const streamingImage = ebookData.images?.find(
      img => img.chapterNumber === index + 1 && img.type === 'chapter_illustration'
    );
    // Find manually-generated image by chapter_id
    const manualImage = ebookData.images?.find(
      img => img.chapter_id === chapter.id && img.type === 'chapter'
    );
    // Also check for any image with matching chapter number (fallback)
    const fallbackImage = ebookData.images?.find(
      img => img.chapterNumber === index + 1
    );
    // Check for any image that might be associated with this chapter
    const anyChapterImage = ebookData.images?.find(
      img => img.type === 'chapter' || img.type === 'chapter_illustration'
    );
    
    // Try all possible image sources in order of preference
    const imageUrl =
      extractImageUrl(streamingImage) ||
      extractImageUrl(manualImage) ||
      extractImageUrl(fallbackImage) ||
      extractImageUrl(anyChapterImage);
    
    return {
      ...chapter,
      imageUrl
    };
  });

  // Get cover image from cover_image_url field first, then from images array
  const coverImage = ebookData.cover_image_url || 
    extractImageUrl(ebookData.images?.find(img => img.type === 'cover'));

  return { chaptersWithImages, coverImage };
};

export const ImageLoadingTest: React.FC = () => {
  const test1 = testImageMatching(testEbookData1);
  const test2 = testImageMatching(testEbookData2);
  const test3 = testImageMatching(testEbookData3);
  const test4 = testImageMatching(testEbookData4);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Loading Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Test Case 1 */}
            <div>
              <h4 className="font-medium mb-2">Test Case 1: Streaming Generated Images</h4>
              <div className="bg-gray-100 p-3 rounded">
                <p><strong>Cover Image:</strong> {test1.coverImage || 'None'}</p>
                <div className="mt-2">
                  <strong>Chapters:</strong>
                  {test1.chaptersWithImages.map((chapter, index) => (
                    <div key={chapter.id} className="ml-4 text-sm">
                      {chapter.title}: {chapter.imageUrl || 'No image'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Case 2 */}
            <div>
              <h4 className="font-medium mb-2">Test Case 2: Manual Generated Images</h4>
              <div className="bg-gray-100 p-3 rounded">
                <p><strong>Cover Image:</strong> {test2.coverImage || 'None'}</p>
                <div className="mt-2">
                  <strong>Chapters:</strong>
                  {test2.chaptersWithImages.map((chapter, index) => (
                    <div key={chapter.id} className="ml-4 text-sm">
                      {chapter.title}: {chapter.imageUrl || 'No image'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Case 3 */}
            <div>
              <h4 className="font-medium mb-2">Test Case 3: Mixed Data (Realistic)</h4>
              <div className="bg-gray-100 p-3 rounded">
                <p><strong>Cover Image:</strong> {test3.coverImage || 'None'}</p>
                <div className="mt-2">
                  <strong>Chapters:</strong>
                  {test3.chaptersWithImages.map((chapter, index) => (
                    <div key={chapter.id} className="ml-4 text-sm">
                      {chapter.title}: {chapter.imageUrl || 'No image'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Case 4 */}
            <div>
              <h4 className="font-medium mb-2">Test Case 4: Real Database Structure</h4>
              <div className="bg-gray-100 p-3 rounded">
                <p><strong>Cover Image:</strong> {test4.coverImage || 'None'}</p>
                <div className="mt-2">
                  <strong>Chapters:</strong>
                  {test4.chaptersWithImages.map((chapter, index) => (
                    <div key={chapter.id} className="ml-4 text-sm">
                      {chapter.title}: {chapter.imageUrl || 'No image'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Raw Data Display */}
            <div>
              <h4 className="font-medium mb-2">Raw Test Data (Case 3)</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(testEbookData3, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 