import React from 'react';
import { EbookPublishPreview } from '@/modules/ebook/components/EbookPublishPreview';

const TestEbookPreview: React.FC = () => {
  // Use the real ebook ID from the database
  const ebookId = '550e8400-e29b-41d4-a716-446655440000';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Test Ebook Preview</h1>
      <p className="text-gray-600 mb-6">
        Testing the publish preview with real ebook data from the database.
      </p>
      
      <EbookPublishPreview 
        ebookId={ebookId}
        onDownload={() => console.log('Download clicked')}
        onShare={() => console.log('Share clicked')}
      />
    </div>
  );
};

export default TestEbookPreview; 