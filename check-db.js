import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (value && !value.startsWith('#')) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
} catch (error) {
  console.log('Could not load .env file:', error.message);
}

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check if ebook_generations table exists and has data
    const { data: ebooks, error: ebookError } = await supabase
      .from('ebook_generations')
      .select('id, title, status, cover_image_url, images, chapters')
      .limit(3);

    if (ebookError) {
      console.error('❌ Error fetching ebooks:', ebookError);
      return;
    }

    console.log(`📚 Found ${ebooks.length} ebooks in database:`);
    
    ebooks.forEach((ebook, index) => {
      console.log(`\n📖 Ebook ${index + 1}:`);
      console.log(`  ID: ${ebook.id}`);
      console.log(`  Title: ${ebook.title}`);
      console.log(`  Status: ${ebook.status}`);
      console.log(`  Cover Image URL: ${ebook.cover_image_url || 'None'}`);
      console.log(`  Images Array Length: ${ebook.images?.length || 0}`);
      console.log(`  Chapters Count: ${ebook.chapters?.length || 0}`);
      
      if (ebook.images && ebook.images.length > 0) {
        console.log(`  Images:`, JSON.stringify(ebook.images, null, 2));
      }
      
      if (ebook.chapters && ebook.chapters.length > 0) {
        console.log(`  Chapter Titles:`, ebook.chapters.map(ch => ch.title));
      }
    });

    if (ebooks.length === 0) {
      console.log('\n💡 No ebooks found. You may need to create one first.');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkDatabase(); 