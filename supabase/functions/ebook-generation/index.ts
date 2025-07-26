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
        
        userId = decodedPayload.sub || decodedPayload.user_id;
        
        // For development/testing, allow anon tokens and use a default user ID
        if (!userId && decodedPayload.role === 'anon') {
          userId = 'anonymous-user';
        } else if (!userId) {
          console.warn('No user ID found in token, using test user');
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



  try {
    // Find the existing ebook record by ebook_id
    const { data: existingEbook, error: checkError } = await supabase
      .from("ebook_generations")
      .select("id, title, status, images, cover_image_url")
      .eq("id", ebook_id)
      .single();

          if (checkError) {
        console.error('Database error during lookup:', checkError);
      
      if (checkError.code === 'PGRST116') {
        // No existing record found - create a new one
        const newEbookData = {
          id: ebook_id,
          user_id: userId,
          title: 'Untitled Ebook',
          description: '',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...updateData
        };
        
        const { data: newEbook, error: createError } = await supabase
          .from("ebook_generations")
          .insert(newEbookData)
          .select()
          .single();
          
                if (createError) {
          console.error('Error creating new ebook record:', createError);
          
          // If it's a foreign key constraint error, try to create the profile first
          if (createError.code === '23503' && createError.message.includes('user_id_fkey')) {
            try {
              // Try to create a profile record for the user
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: userId,
                  email: `${userId}@example.com`,
                  name: 'Test User',
                  subscription_status: 'free',
                  credits: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'id',
                  ignoreDuplicates: false
                });
                
              if (profileError) {
                console.error('Error creating profile:', profileError);
                return new Response(JSON.stringify({ 
                  error: "Failed to create user profile", 
                  details: profileError.message,
                  code: profileError.code
                }), {
                  status: 500,
                  headers: { 
                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': '*'
                  },
                });
              }
              
              // Retry creating the ebook record
              const { data: retryEbook, error: retryError } = await supabase
                .from("ebook_generations")
                .insert(newEbookData)
                .select()
                .single();
                
              if (retryError) {
                console.error('Error on retry creating ebook record:', retryError);
                return new Response(JSON.stringify({ 
                  error: "Failed to create ebook record after profile creation", 
                  details: retryError.message,
                  code: retryError.code
                }), {
                  status: 500,
                  headers: { 
                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': '*'
                  },
                });
              }
              
              return new Response(JSON.stringify({ 
                success: true,
                data: retryEbook,
                message: "New ebook record created successfully",
                created: true
              }), {
                status: 200,
                headers: { 
                  "Content-Type": "application/json",
                  'Access-Control-Allow-Origin': '*'
                },
              });
              
            } catch (profileCreateError) {
              console.error('Unexpected error during profile creation:', profileCreateError);
              return new Response(JSON.stringify({ 
                error: "Failed to create user profile", 
                details: profileCreateError instanceof Error ? profileCreateError.message : "Unknown error"
              }), {
                status: 500,
                headers: { 
                  "Content-Type": "application/json",
                  'Access-Control-Allow-Origin': '*'
                },
              });
            }
          }
          
          return new Response(JSON.stringify({ 
            error: "Failed to create ebook record", 
            details: createError.message,
            code: createError.code
          }), {
            status: 500,
            headers: { 
              "Content-Type": "application/json",
              'Access-Control-Allow-Origin': '*'
            },
          });
        }
        

        
        return new Response(JSON.stringify({ 
          success: true,
          data: newEbook,
          message: "New ebook record created successfully",
          created: true
        }), {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
          },
        });
      } else {
        console.error('Error checking for existing ebook:', checkError);
        return new Response(JSON.stringify({ 
          error: "Database lookup failed", 
          details: checkError.message,
          code: checkError.code
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
          },
        });
      }
    }



    // Handle image appending logic
    if (images && Array.isArray(images)) {
      const currentImages = existingEbook.images || [];
      
      // Add timestamps to new images
      const newImagesWithTimestamps = images.map(img => ({
        ...img,
        generated_at: img.generated_at || new Date().toISOString()
      }));
      
      // Append new images to existing ones
      updateData.images = [...currentImages, ...newImagesWithTimestamps];
    }

    // Update the existing ebook record
    const { data, error } = await supabase
      .from("ebook_generations")
      .update(updateData)
      .eq("id", existingEbook.id)
      .select()
      .single();

          if (error) {
        console.error('Database update error:', error);
        return new Response(JSON.stringify({ 
          error: "Database update failed", 
          details: error.message,
          code: error.code,
          hint: error.hint
        }), {
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
