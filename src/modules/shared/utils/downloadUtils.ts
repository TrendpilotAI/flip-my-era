import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { supabase } from '@/core/integrations/supabase/client';

export interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  name?: string;
  created_at?: string;
}

export interface DownloadOptions {
  format: 'pdf' | 'epub' | 'txt' | 'json';
  includeMetadata?: boolean;
  includeCoverPage?: boolean;
  fontSize?: number;
  fontFamily?: string;
  pageSize?: 'A4' | 'Letter' | 'A5';
}

export interface DownloadAnalytics {
  userId?: string;
  contentType: 'story' | 'ebook';
  contentId: string;
  format: string;
  downloadedAt: string;
}

// Track download analytics
export const trackDownload = async (analytics: DownloadAnalytics) => {
  try {
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: analytics.userId,
        activity_type: 'download',
        activity_data: {
          content_type: analytics.contentType,
          content_id: analytics.contentId,
          format: analytics.format,
          downloaded_at: analytics.downloadedAt
        },
        resource_type: analytics.contentType,
        resource_id: analytics.contentId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking download:', error);
    }

    // Update download count in the respective table
    if (analytics.contentType === 'ebook') {
      await supabase
        .from('ebook_generations')
        .update({ 
          download_count: supabase.raw('download_count + 1') 
        })
        .eq('id', analytics.contentId);
    }
  } catch (error) {
    console.error('Error tracking download analytics:', error);
  }
};

// Generate PDF from story content
export const generatePDF = async (
  title: string,
  content: string | Chapter[],
  options: DownloadOptions = { format: 'pdf' }
): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.pageSize || 'A4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Set font
  doc.setFont(options.fontFamily || 'helvetica');
  doc.setFontSize(options.fontSize || 12);

  let yPosition = margin;

  // Add cover page if requested
  if (options.includeCoverPage) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    
    const titleLines = doc.splitTextToSize(title, maxWidth);
    const titleHeight = titleLines.length * 10;
    const titleY = (pageHeight - titleHeight) / 2;
    
    doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });
    
    if (options.includeMetadata) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, titleY + titleHeight + 20, { align: 'center' });
    }
    
    doc.addPage();
    yPosition = margin;
  }

  // Add content
  if (Array.isArray(content)) {
    // Handle chapters
    for (const chapter of content) {
      // Chapter title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const chapterTitle = doc.splitTextToSize(chapter.title, maxWidth);
      
      if (yPosition + chapterTitle.length * 8 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(chapterTitle, margin, yPosition);
      yPosition += chapterTitle.length * 8 + 10;
      
      // Chapter content
      doc.setFontSize(options.fontSize || 12);
      doc.setFont('helvetica', 'normal');
      const chapterContent = doc.splitTextToSize(chapter.content, maxWidth);
      
      for (const line of chapterContent) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10; // Space between chapters
    }
  } else {
    // Handle single story content
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, maxWidth);
    
    doc.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 8 + 10;
    
    doc.setFontSize(options.fontSize || 12);
    doc.setFont('helvetica', 'normal');
    const contentLines = doc.splitTextToSize(content, maxWidth);
    
    for (const line of contentLines) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    }
  }

  return doc.output('blob');
};

// Generate EPUB format
export const generateEPUB = async (
  title: string,
  content: string | Chapter[],
  options: DownloadOptions = { format: 'epub' }
): Promise<Blob> => {
  // Basic EPUB structure
  const mimeType = 'application/epub+zip';
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${crypto.randomUUID()}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:creator>FlipMyEra</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>`;

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="content.xhtml">${title}</a></li>
    </ol>
  </nav>
</body>
</html>`;

  let contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <h1>${title}</h1>`;

  if (Array.isArray(content)) {
    for (const chapter of content) {
      contentXhtml += `
  <section>
    <h2>${chapter.title}</h2>
    <div class="chapter-content">
      ${chapter.content.split('\n').map(p => `<p>${p}</p>`).join('')}
    </div>
  </section>`;
    }
  } else {
    contentXhtml += `
  <div class="story-content">
    ${content.split('\n').map(p => `<p>${p}</p>`).join('')}
  </div>`;
  }

  contentXhtml += `
</body>
</html>`;

  const stylesCSS = `
body {
  font-family: Georgia, serif;
  font-size: 14px;
  line-height: 1.6;
  margin: 2em;
  color: #333;
}

h1 {
  font-size: 2em;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 1em;
}

h2 {
  font-size: 1.5em;
  color: #34495e;
  margin-top: 2em;
  margin-bottom: 1em;
}

p {
  margin-bottom: 1em;
  text-align: justify;
}

.chapter-content {
  margin-bottom: 2em;
}

.story-content {
  text-align: justify;
}
`;

  // Create a simple ZIP-like structure for EPUB
  const files = new Map([
    ['mimetype', mimeType],
    ['META-INF/container.xml', containerXml],
    ['OEBPS/content.opf', contentOpf],
    ['OEBPS/nav.xhtml', navXhtml],
    ['OEBPS/content.xhtml', contentXhtml],
    ['OEBPS/styles.css', stylesCSS]
  ]);

  // For simplicity, we'll create a basic file structure
  // In a production environment, you'd want to use a proper ZIP library
  const epubContent = Array.from(files.entries())
    .map(([path, content]) => `--- ${path} ---\n${content}\n`)
    .join('\n');

  return new Blob([epubContent], { type: 'application/epub+zip' });
};

// Generate TXT format
export const generateTXT = (
  title: string,
  content: string | Chapter[],
  options: DownloadOptions = { format: 'txt' }
): Blob => {
  let textContent = `${title}\n${'='.repeat(title.length)}\n\n`;

  if (options.includeMetadata) {
    textContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
    textContent += `Format: Plain Text\n\n`;
  }

  if (Array.isArray(content)) {
    for (const chapter of content) {
      textContent += `${chapter.title}\n${'-'.repeat(chapter.title.length)}\n\n`;
      textContent += `${chapter.content}\n\n`;
    }
  } else {
    textContent += content;
  }

  return new Blob([textContent], { type: 'text/plain;charset=utf-8' });
};

// Generate JSON format
export const generateJSON = (
  title: string,
  content: string | Chapter[],
  options: DownloadOptions = { format: 'json' }
): Blob => {
  const jsonData = {
    title,
    generatedAt: new Date().toISOString(),
    format: 'FlipMyEra JSON Export',
    content: Array.isArray(content) ? content : [{ title, content }],
    metadata: options.includeMetadata ? {
      exportedBy: 'FlipMyEra',
      version: '1.0',
      options
    } : undefined
  };

  return new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
};

// Main download function
export const downloadContent = async (
  title: string,
  content: string | Chapter[],
  options: DownloadOptions,
  analytics?: DownloadAnalytics
): Promise<void> => {
  try {
    let blob: Blob;
    let filename: string;
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');

    switch (options.format) {
      case 'pdf':
        blob = await generatePDF(title, content, options);
        filename = `${sanitizedTitle}.pdf`;
        break;
      case 'epub':
        blob = await generateEPUB(title, content, options);
        filename = `${sanitizedTitle}.epub`;
        break;
      case 'txt':
        blob = generateTXT(title, content, options);
        filename = `${sanitizedTitle}.txt`;
        break;
      case 'json':
        blob = generateJSON(title, content, options);
        filename = `${sanitizedTitle}.json`;
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    // Save file
    saveAs(blob, filename);

    // Track analytics
    if (analytics) {
      await trackDownload({
        ...analytics,
        format: options.format,
        downloadedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error downloading content:', error);
    throw error;
  }
};

// Download story
export const downloadStory = async (
  story: Story,
  options: DownloadOptions,
  userId?: string
): Promise<void> => {
  await downloadContent(
    story.title,
    story.content,
    options,
    {
      userId,
      contentType: 'story',
      contentId: story.id,
      format: options.format,
      downloadedAt: new Date().toISOString()
    }
  );
};

// Download ebook
export const downloadEbook = async (
  title: string,
  chapters: Chapter[],
  options: DownloadOptions,
  ebookId: string,
  userId?: string
): Promise<void> => {
  await downloadContent(
    title,
    chapters,
    options,
    {
      userId,
      contentType: 'ebook',
      contentId: ebookId,
      format: options.format,
      downloadedAt: new Date().toISOString()
    }
  );
}; 