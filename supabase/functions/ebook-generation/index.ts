// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// IMPORTANT: This function handles additional updates to existing ebook_generations records.
// Initial record creation and progressive updates are handled by the stream-chapters-enhanced function.
// This function is used for post-generation updates like design settings, illustrations, etc.

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
    });
  }

  // Extract user ID from JWT token
  const authHeader = req.headers.get('Authorization');
  console.log('Auth header exists:', !!authHeader);
  
  // Log all headers for debugging
  console.log('Request headers:');
  for (const [key, value] of req.headers.entries()) {
    console.log(`${key}: ${key === 'authorization' ? 'Bearer [hidden]' : value}`);
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
      status: 401,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  let userId: string = 'test-user'; // Default for development
  
  try {
    // Decode JWT to get user ID (basic decode without verification for development)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format, using test user');
    } else {
      try {
        // Add padding if needed
        let payload = parts[1];
        while (payload.length % 4) {
          payload += '=';
        }
        
        const decodedPayload = JSON.parse(atob(payload));
        console.log('JWT payload:', JSON.stringify(decodedPayload, null, 2));
        
        userId = decodedPayload.sub || decodedPayload.user_id;
        
        // For development/testing, allow anon tokens and use a default user ID
        if (!userId && decodedPayload.role === 'anon') {
          userId = 'anonymous-user';
          console.log('Using anonymous user ID for testing');
        } else if (!userId) {
          console.warn('No user ID found in token, using test user');
        } else {
          console.log('Successfully extracted user ID:', userId);
        }
      } catch (decodeError) {
        console.warn('Error decoding JWT payload:', decodeError);
        console.log('Using test user ID for development');
      }
    }
  } catch (error) {
    console.error('JWT handling error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Using test user ID due to error');
    // Continue with test user instead of failing
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
    });
  }

  // Fields for additional ebook updates (post-generation)
  const {
    ebook_id, // Primary identifier for direct updates
    title,
    content,
    chapters, // Array of chapter objects
    designSettings, // Design settings object
    status,
    credits_used,
    paid_with_credits,
    transaction_id,
    story_type,
    chapter_count,
    word_count,
    description,
    subtitle,
    author_name,
    images, // Array of generated images
    pdf_url,
    epub_url,
    cover_image_url
  } = body;

  // Require ebook_id for identification
  if (!ebook_id) {
    return new Response(JSON.stringify({ error: "Missing required field: ebook_id" }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
    });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  console.log('Supabase URL exists:', !!supabaseUrl);
  console.log('Supabase key exists:', !!supabaseKey);

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    // For development, return success without actually saving
    return new Response(JSON.stringify({ 
      success: true,
      message: "Development mode: Simulated successful update (no actual database write)",
      data: { id: "dev-mode-id" }
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Prepare the update data object (only include fields that are provided)
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Only include fields that are provided in the request
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (subtitle !== undefined) updateData.subtitle = subtitle;
  if (author_name !== undefined) updateData.author_name = author_name;
  if (chapters !== undefined) updateData.chapters = chapters;
  if (status !== undefined) updateData.status = status;
  if (designSettings !== undefined) updateData.style_preferences = designSettings;
  if (content !== undefined) updateData.content = content;
  if (story_type !== undefined) updateData.story_type = story_type;
  if (chapter_count !== undefined) updateData.chapter_count = chapter_count;
  if (word_count !== undefined) updateData.word_count = word_count;
  if (credits_used !== undefined) updateData.credits_used = credits_used;
  if (paid_with_credits !== undefined) updateData.paid_with_credits = paid_with_credits;
  if (images !== undefined) updateData.images = images;
  if (pdf_url !== undefined) updateData.pdf_url = pdf_url;
  if (epub_url !== undefined) updateData.epub_url = epub_url;
  if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url;

  console.log('Attempting to update ebook data:', {
    user_id: userId,
    ebook_id,
    title: updateData.title,
    hasChapters: !!chapters,
    hasDesignSettings: !!designSettings,
    updateFields: Object.keys(updateData)
  });

  try {
    // Find the existing ebook record by ebook_id
    const { data: existingEbook, error: checkError } = await supabase
      .from("ebook_generations")
      .select("id, title, status")
      .eq("id", ebook_id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // No existing record found
        console.error('No existing ebook_generations record found for ebook_id:', ebook_id);
        return new Response(JSON.stringify({ 
          error: "No existing ebook record found. Records are created during the streaming generation process.",
          ebook_id
        }), {
          status: 404,
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
          },
        });
      } else {
        console.error('Error checking for existing ebook:', checkError);
        throw checkError;
      }
    }

    console.log('Found existing ebook record:', existingEbook);

    // Update the existing ebook record
    const { data, error } = await supabase
      .from("ebook_generations")
      .update(updateData)
      .eq("id", existingEbook.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      data,
      message: "Ebook updated successfully",
      updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at')
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
    });
  } catch (dbError) {
    console.error('Unexpected database error:', dbError);
    return new Response(JSON.stringify({ 
      error: "Database operation failed", 
      details: dbError instanceof Error ? dbError.message : "Unknown error"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ebook-generation' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.esaU0tAllSc9odxI0N-kH2hXruKTV5Ji1oi3Fuw6YcY' \
    --header 'Content-Type: application/json' \
    --data '{"ebook_id":"test-ebook-id","designSettings":{"textColor":"#374151","chapterHeadingColor":"#8B5CF6"}}'

*/
