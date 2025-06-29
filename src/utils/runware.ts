export interface GenerateImageParams {
  positivePrompt: string;
  model?: string;
  numberResults?: number;
  outputFormat?: string;
  CFGScale?: number;
  scheduler?: string;
  strength?: number;
  promptWeighting?: "compel" | "sdEmbeds";
  seed?: number | null;
  lora?: string[];
}

export interface GeneratedImage {
  imageURL: string;
  positivePrompt: string;
  seed: number;
  NSFWContent: boolean;
}

export interface EbookIllustrationParams {
  chapterTitle: string;
  chapterContent: string;
  style?: 'children' | 'fantasy' | 'adventure' | 'educational';
  mood?: 'happy' | 'mysterious' | 'adventurous' | 'peaceful';
}

/**
 * Use Groq AI to enhance and optimize the image generation prompt
 */
export async function enhancePromptWithGroq(params: EbookIllustrationParams): Promise<string> {
  try {
    const { chapterTitle, chapterContent, style = 'children', mood = 'happy' } = params;
    
    // Create a detailed prompt for Groq to enhance
    // Sanitize user inputs to prevent prompt injection
    const sanitizedTitle = chapterTitle.replace(/[`"'\\]/g, '').substring(0, 100);
    const sanitizedContent = chapterContent.replace(/[`"'\\]/g, '').substring(0, 500);

    const enhancementPrompt = `
    You are an expert AI prompt engineer specializing in creating optimized prompts for image generation models, specifically Flux1.1 Pro for children's book illustrations.

    Chapter Title: "${sanitizedTitle}"
    Chapter Content: "${sanitizedContent}..."
    Style: ${style}
Mood: ${mood}

Please create a highly detailed, optimized prompt for generating a children's book illustration using Flux1.1 Pro. The prompt should:

1. Be specific and detailed about the visual elements
2. Include appropriate artistic style descriptors
3. Specify lighting, composition, and color palette
4. Be age-appropriate for children
5. Include technical quality specifications
6. Be optimized for Flux1.1 Pro's capabilities
7. Be under 500 words total

Focus on creating a vivid, engaging scene that captures the essence of the chapter while being visually appealing to children.

Return ONLY the optimized prompt, no explanations or additional text.
    `;

    // Call Groq API to enhance the prompt
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI prompt engineer for image generation models. Create detailed, optimized prompts that produce high-quality illustrations.'
          },
          {
            role: 'user',
            content: enhancementPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from Groq API');
    }

    const enhancedPrompt = data.choices[0].message.content.trim();
    
    return enhancedPrompt;
  } catch (error) {
    console.error('Failed to enhance prompt with Groq:', error);
    // Fallback to the basic prompt if enhancement fails
    return createEbookIllustrationPrompt(params);
  }
}

/**
 * Create an optimized prompt for ebook chapter illustrations using Flux1.1 Pro
 */
export function createEbookIllustrationPrompt(params: EbookIllustrationParams): string {
  const { chapterTitle, chapterContent, style = 'children', mood = 'happy' } = params;
  
  // Extract key elements from chapter content (first 200 characters for context)
  const contentPreview = chapterContent.substring(0, 200).replace(/[^\w\s]/g, '');
  
  // Style-specific enhancements
  const styleEnhancements = {
    children: 'colorful, vibrant, child-friendly, simple shapes, warm colors, cute characters',
    fantasy: 'magical, ethereal, mystical elements, glowing effects, fantasy creatures, enchanted setting',
    adventure: 'dynamic, action-oriented, dramatic lighting, exciting composition, adventurous spirit',
    educational: 'clear, informative, educational, well-lit, detailed, learning-focused'
  };
  
  // Mood-specific enhancements
  const moodEnhancements = {
    happy: 'bright, cheerful, positive energy, smiling characters, warm lighting',
    mysterious: 'mysterious atmosphere, soft lighting, intriguing elements, subtle shadows',
    adventurous: 'bold, energetic, dynamic composition, exciting colors, sense of movement',
    peaceful: 'calm, serene, gentle colors, peaceful atmosphere, tranquil setting'
  };
  
  // Base prompt structure optimized for Flux1.1 Pro
  const basePrompt = `Create a beautiful children's book illustration for the chapter "${chapterTitle}". 
    The scene should be: ${styleEnhancements[style]}, ${moodEnhancements[mood]}. 
    Context from the chapter: ${contentPreview}... 
    Style: high-quality digital art, professional children's book illustration, 
    detailed but not overwhelming, age-appropriate, engaging for young readers. 
    Technical quality: sharp details, balanced composition, harmonious colors, 
    professional lighting, clean lines, appealing to children.`;
  
  return basePrompt.trim();
}

export class RunwareService {
  private ws: WebSocket | null = null;
  private apiKey: string | null = null;
  private connectionSessionUUID: string | null = null;
  private messageCallbacks: Map<string, (data: any) => void> = new Map();
  private isAuthenticated: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) {
      console.warn('RUNWARE API key not provided. Image generation will fall back to other services.');
      return;
    }
    this.connectionPromise = this.connect();
  }

  /**
   * Check if the service is properly configured and ready
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Check if the service is connected and authenticated
   */
  async isConnected(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      await this.connectionPromise;
      return this.isAuthenticated && this.ws?.readyState === WebSocket.OPEN;
    } catch (error) {
      console.error('RUNWARE connection check failed:', error);
      return false;
    }
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        reject(new Error('RUNWARE API key not provided'));
        return;
      }

      try {
        this.ws = new WebSocket('wss://ws-api.runware.ai/v1');
        
        this.ws.onopen = async () => {
          console.log("RUNWARE WebSocket connected, waiting for ready state...");
          await this.waitForReadyState();
          console.log("RUNWARE WebSocket ready, authenticating...");
          try {
            await this.authenticate();
            resolve();
          } catch (error) {
            console.error("RUNWARE authentication failed:", error);
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          console.log("RUNWARE received message:", event.data);
          const response = JSON.parse(event.data);
          
          if (response.error || response.errors) {
            console.error("RUNWARE WebSocket error response:", response);
            const errorMessage = response.errorMessage || response.errors?.[0]?.message || "An error occurred";
            throw new Error(errorMessage);
          }

          if (response.data) {
            response.data.forEach((item: any) => {
              if (item.taskType === "authentication") {
                console.log("RUNWARE authentication successful");
                this.connectionSessionUUID = item.connectionSessionUUID;
                this.isAuthenticated = true;
              } else {
                const callback = this.messageCallbacks.get(item.taskUUID);
                if (callback) {
                  callback(item);
                  this.messageCallbacks.delete(item.taskUUID);
                }
              }
            });
          }
        };

        this.ws.onerror = (error) => {
          console.error("RUNWARE WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("RUNWARE WebSocket closed");
          this.isAuthenticated = false;
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`RUNWARE attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connectionPromise = this.connect();
            }, 1000 * this.reconnectAttempts); // Exponential backoff
          } else {
            console.error("RUNWARE max reconnection attempts reached");
          }
        };
      } catch (error) {
        console.error("Error creating RUNWARE WebSocket:", error);
        reject(error);
      }
    });
  }

  private waitForReadyState(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws) {
        resolve();
        return;
      }

      if (this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const checkState = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          clearInterval(checkState);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkState);
        resolve();
      }, 5000);
    });
  }

  private authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("RUNWARE WebSocket not ready for authentication"));
        return;
      }
      
      console.log("Sending RUNWARE authentication message");
      const authMessage = [{
        taskType: "authentication",
        apiKey: this.apiKey,
        ...(this.connectionSessionUUID && { connectionSessionUUID: this.connectionSessionUUID }),
      }];
      
      const authCallback = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.data?.[0]?.taskType === "authentication") {
          this.ws?.removeEventListener("message", authCallback);
          resolve();
        }
      };
      
      this.ws.addEventListener("message", authCallback);
      this.ws.send(JSON.stringify(authMessage));
    });
  }

  async generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
    if (!this.apiKey) {
      throw new Error('RUNWARE API key not provided');
    }

    await this.connectionPromise;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
      console.log("RUNWARE connection not ready, reconnecting...");
      this.connectionPromise = this.connect();
      await this.connectionPromise;
    }

    const taskUUID = crypto.randomUUID();
    
    return new Promise((resolve, reject) => {
      const message = [{
        taskType: "imageInference",
        taskUUID,
        model: params.model || "runware:100@1",  // Default to AIR model
        width: 1024,
        height: 1024,
        numberResults: params.numberResults || 1,
        outputFormat: params.outputFormat || "WEBP",
        steps: 4,
        CFGScale: params.CFGScale || 1,
        scheduler: params.scheduler || "FlowMatchEulerDiscreteScheduler",
        strength: params.strength || 0.8,
        lora: params.lora || [],
        positivePrompt: params.positivePrompt,
      }];

      console.log("Sending RUNWARE image generation message:", message);

      this.messageCallbacks.set(taskUUID, (data) => {
        if (data.error) {
          reject(new Error(data.errorMessage));
        } else {
          resolve(data);
        }
      });

      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Generate an optimized illustration for an ebook chapter using Flux1.1 Pro with AI-enhanced prompts
   */
  async generateEbookIllustration(params: EbookIllustrationParams): Promise<GeneratedImage> {
    if (!this.apiKey) {
      throw new Error('RUNWARE API key not provided');
    }

    // Use Groq to enhance the prompt
    const enhancedPrompt = await enhancePromptWithGroq(params);
    
    return this.generateImage({
      positivePrompt: enhancedPrompt,
      model: "flux1.1-pro", // Use Flux1.1 Pro model
      numberResults: 1,
      outputFormat: "WEBP",
      CFGScale: 7, // Higher CFG for better prompt adherence
      scheduler: "FlowMatchEulerDiscreteScheduler",
      strength: 0.8,
    });
  }

  /**
   * Generate multiple illustrations for a series of chapters with AI-enhanced prompts
   */
  async generateChapterIllustrations(chapters: Array<{ title: string; content: string }>, style: 'children' | 'fantasy' | 'adventure' | 'educational' = 'children'): Promise<GeneratedImage[]> {
    if (!this.apiKey) {
      throw new Error('RUNWARE API key not provided');
    }

    const illustrations: GeneratedImage[] = [];
    
    for (const chapter of chapters) {
      try {
        const illustration = await this.generateEbookIllustration({
          chapterTitle: chapter.title,
          chapterContent: chapter.content,
          style,
          mood: 'happy' // Default mood, could be made dynamic based on content
        });
        illustrations.push(illustration);
      } catch (error) {
        console.error(`Failed to generate illustration for chapter "${chapter.title}":`, error);
        // Continue with next chapter even if one fails
      }
    }
    
    return illustrations;
  }
}
