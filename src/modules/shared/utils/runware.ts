// Runware API Types based on official documentation
// https://runware.ai/docs/en/image-inference/api-reference

import {
  createTaylorSwiftImagePrompt,
  analyzeChapterForImageGeneration,
  type ThematicImageParams,
  type ImageMood
} from '@/modules/story/utils/taylorSwiftImagePrompts';
import { TaylorSwiftTheme } from '@/modules/story/utils/storyPrompts';

export interface RunwareImageInferenceRequest {
  taskType: "imageInference";
  taskUUID: string;
  outputType?: "URL" | "base64Data" | "dataURI";
  outputFormat?: "PNG" | "JPG" | "WEBP";
  outputQuality?: number;
  uploadEndpoint?: string;
  checkNSFW?: boolean;
  includeCost?: boolean;
  positivePrompt: string;
  negativePrompt?: string;
  seedImage?: string;
  maskImage?: string;
  maskMargin?: number;
  strength?: number;
  referenceImages?: string[];
  outpaint?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    blur?: number;
  };
  height?: number;
  width?: number;
  model: string;
  vae?: string;
  steps?: number;
  scheduler?: string;
  seed?: number;
  CFGScale?: number;
  clipSkip?: number;
  promptWeighting?: "compel" | "sdEmbeds";
  numberResults?: number;
  advancedFeatures?: {
    layerDiffuse?: boolean;
  };
  acceleratorOptions?: {
    teaCache?: boolean;
    teaCacheDistance?: number;
    deepCache?: boolean;
    deepCacheInterval?: number;
    deepCacheBranchId?: string;
  };
  puLID?: {
    inputImages: string[];
    idWeight?: number;
    trueCFGScale?: number;
    CFGStartStep?: number;
    CFGStartStepPercentage?: number;
  };
  acePlusPlus?: {
    type: string;
    inputImages: string[];
    inputMasks?: string[];
    repaintingScale?: number;
  };
  refiner?: {
    model: string;
    startStep?: number;
    startStepPercentage?: number;
  };
  embeddings?: Array<{
    model: string;
    weight: number;
  }>;
  controlNet?: Array<{
    model: string;
    guideImage: string;
    weight?: number;
    startStep?: number;
    startStepPercentage?: number;
    endStep?: number;
    endStepPercentage?: number;
    controlMode?: string;
  }>;
  lora?: Array<{
    model: string;
    weight: number;
  }>;
  ipAdapters?: Array<{
    model: string;
    guideImage: string;
    weight?: number;
  }>;
}

export interface RunwareImageInferenceResponse {
  taskType: "imageInference";
  taskUUID: string;
  imageUUID: string;
  imageURL?: string;
  imageBase64Data?: string;
  imageDataURI?: string;
  seed: number;
  NSFWContent?: boolean;
  cost?: number;
}

export interface RunwareAuthenticationRequest {
  taskType: "authentication";
  apiKey: string;
  connectionSessionUUID?: string;
}

export interface RunwareAuthenticationResponse {
  taskType: "authentication";
  connectionSessionUUID: string;
}

export interface RunwareApiResponse {
  data: Array<RunwareImageInferenceResponse | RunwareAuthenticationResponse>;
  error?: string;
  errors?: Array<{ message: string }>;
  errorMessage?: string;
}

// Legacy interface for backward compatibility
export interface GenerateImageParams {
  positivePrompt: string;
  negativePrompt?: string;
  model?: string;
  numberResults?: number;
  outputFormat?: "PNG" | "JPG" | "WEBP";
  outputType?: "URL" | "base64Data" | "dataURI";
  CFGScale?: number;
  scheduler?: string;
  strength?: number;
  promptWeighting?: "compel" | "sdEmbeds";
  seed?: number | null;
  height?: number;
  width?: number;
  steps?: number;
  checkNSFW?: boolean;
  includeCost?: boolean;
  lora?: Array<{
    model: string;
    weight: number;
  }>;
  controlNet?: Array<{
    model: string;
    guideImage: string;
    weight?: number;
    startStep?: number;
    endStep?: number;
    controlMode?: string;
  }>;
}

export interface GeneratedImage {
  imageURL?: string;
  imageBase64Data?: string;
  imageDataURI?: string;
  imageUUID: string;
  taskUUID: string;
  positivePrompt: string;
  seed: number;
  NSFWContent?: boolean;
  cost?: number;
}

export interface EbookIllustrationParams {
  chapterTitle: string;
  chapterContent: string;
  style?: 'children' | 'fantasy' | 'adventure' | 'educational';
  mood?: 'happy' | 'mysterious' | 'adventurous' | 'peaceful';
  useEnhancedPrompts?: boolean;
}

export interface TaylorSwiftIllustrationParams {
  chapterTitle: string;
  chapterContent: string;
  theme: 'coming-of-age' | 'first-love' | 'heartbreak' | 'friendship';
  useEnhancedPrompts?: boolean;
  customMood?: 'dreamy' | 'nostalgic' | 'romantic' | 'melancholic' | 'joyful' | 'empowering' | 'whimsical' | 'intimate';
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'golden-hour' | 'twilight' | 'night';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  setting?: string;
}

// Runware Model Constants based on official documentation
export const RUNWARE_MODELS = {
  // FLUX Models
  FLUX_1_1_PRO: "bfl:2@1", // FLUX.1.1 [pro] - Updated AIR model ID
  FLUX_1_DEV: "runware:101@1", // FLUX.1 [dev]
  FLUX_1_SCHNELL: "runware:102@1", // FLUX.1 [schnell]
  
  // SDXL Models
  SDXL_BASE: "runware:1@1", // Stable Diffusion XL Base 1.0
  SDXL_TURBO: "runware:4@1", // SDXL Turbo
  
  // SD 1.5 Models
  SD_1_5: "runware:2@1", // Stable Diffusion 1.5
  
  // Other Models
  PLAYGROUND_V2_5: "runware:3@1", // Playground v2.5
} as const;

// Scheduler Constants
export const RUNWARE_SCHEDULERS = {
  FLOW_MATCH_EULER_DISCRETE: "FlowMatchEulerDiscreteScheduler",
  EULER_DISCRETE: "EulerDiscreteScheduler",
  EULER_ANCESTRAL_DISCRETE: "EulerAncestralDiscreteScheduler",
  DPM_SOLVER_MULTISTEP: "DPMSolverMultistepScheduler",
  DDIM: "DDIMScheduler",
  DDPM: "DDPMScheduler",
  PNDM: "PNDMScheduler",
  LMS_DISCRETE: "LMSDiscreteScheduler",
  HEUN_DISCRETE: "HeunDiscreteScheduler",
  DEIS_MULTISTEP: "DEISMultistepScheduler",
  UNI_PC_MULTISTEP: "UniPCMultistepScheduler",
} as const;

// Model architecture capabilities
export const MODEL_CAPABILITIES = {
  FLUX: {
    supportsCFGScale: false,
    supportsCheckNSFW: false,
    supportsStrength: false,
    supportsNegativePrompt: false,
  },
  SDXL: {
    supportsCFGScale: true,
    supportsCheckNSFW: true,
    supportsStrength: true,
    supportsNegativePrompt: true,
  },
  SD15: {
    supportsCFGScale: true,
    supportsCheckNSFW: true,
    supportsStrength: true,
    supportsNegativePrompt: true,
  },
} as const;

/**
 * Get model architecture type from model ID
 */
export function getModelArchitecture(modelId: string): keyof typeof MODEL_CAPABILITIES {
  if (modelId.startsWith('bfl:') || modelId.includes('flux')) {
    return 'FLUX';
  } else if (modelId.includes('sdxl') || modelId === RUNWARE_MODELS.SDXL_BASE || modelId === RUNWARE_MODELS.SDXL_TURBO) {
    return 'SDXL';
  } else {
    return 'SD15';
  }
}

/**
 * Filter parameters based on model capabilities
 */
export function filterParamsForModel(params: Partial<GenerateImageParams>): Partial<GenerateImageParams> {
  const modelId = params.model || RUNWARE_MODELS.FLUX_1_1_PRO;
  const architecture = getModelArchitecture(modelId);
  const capabilities = MODEL_CAPABILITIES[architecture];
  
  const filteredParams = { ...params };
  
  if (!capabilities.supportsCFGScale) {
    delete filteredParams.CFGScale;
  }
  if (!capabilities.supportsCheckNSFW) {
    delete filteredParams.checkNSFW;
  }
  if (!capabilities.supportsStrength) {
    delete filteredParams.strength;
  }
  if (!capabilities.supportsNegativePrompt) {
    delete filteredParams.negativePrompt;
  }
  
  return filteredParams;
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
    You are an expert AI prompt engineer specializing in creating optimized prompts for image generation models, specifically FLUX.1.1 Pro for children's book illustrations.

    Chapter Title: "${sanitizedTitle}"
    Chapter Content: "${sanitizedContent}..."
    Style: ${style}
    Mood: ${mood}

    Please create a highly detailed, optimized prompt for generating a children's book illustration using FLUX.1.1 Pro. The prompt should:

    1. Be specific and detailed about the visual elements
    2. Include appropriate artistic style descriptors
    3. Specify lighting, composition, and color palette
    4. Be age-appropriate for children
    5. Include technical quality specifications
    6. Be optimized for FLUX.1.1 Pro's capabilities
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
      // Don't expose detailed API error information
      console.error('Groq API request failed with status:', response.status);
      throw new Error('Failed to enhance prompt with AI service');
    }

    const data = await response.json();

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from Groq API');
    }

    const enhancedPrompt = data.choices[0].message.content.trim();
    
    return enhancedPrompt;
  } catch (error) {
    // Log error without exposing sensitive information
    console.error('Failed to enhance prompt with AI service');
    // Fallback to the basic prompt if enhancement fails
    return createEbookIllustrationPrompt(params);
  }
}

/**
 * Create an optimized prompt for ebook chapter illustrations using FLUX.1.1 Pro
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
  
  // Base prompt structure optimized for FLUX.1.1 Pro
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
  private messageCallbacks: Map<string, (data: RunwareImageInferenceResponse | RunwareAuthenticationResponse) => void> = new Map();
  private isAuthenticated: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) {
      console.warn('RUNWARE service not configured. Image generation will fall back to other services.');
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
        reject(new Error('RUNWARE service not configured'));
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
            console.error("RUNWARE authentication failed");
            reject(new Error("Authentication failed"));
          }
        };

        this.ws.onmessage = (event) => {
          console.log("RUNWARE received message:", event.data);
          
          try {
            const response: RunwareApiResponse = JSON.parse(event.data);
            
            if (response.error || response.errors) {
              console.error("RUNWARE WebSocket error response:", response);
              const errorMessage = response.errorMessage || response.errors?.[0]?.message || "An error occurred";
              throw new Error(errorMessage);
            }

            if (response.data) {
              response.data.forEach((item) => {
                if (item.taskType === "authentication") {
                  console.log("RUNWARE authentication successful");
                  this.connectionSessionUUID = (item as RunwareAuthenticationResponse).connectionSessionUUID;
                  this.isAuthenticated = true;
                } else if (item.taskType === "imageInference") {
                  const callback = this.messageCallbacks.get(item.taskUUID);
                  if (callback) {
                    callback(item as RunwareImageInferenceResponse);
                    this.messageCallbacks.delete(item.taskUUID);
                  }
                }
              });
            }
          } catch (parseError) {
            console.error("RUNWARE failed to parse response:", parseError);
          }
        };

        this.ws.onerror = (error) => {
          console.error("RUNWARE WebSocket connection error");
          reject(new Error("WebSocket connection failed"));
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
      const authMessage: RunwareAuthenticationRequest[] = [{
        taskType: "authentication",
        apiKey: this.apiKey!,
        ...(this.connectionSessionUUID && { connectionSessionUUID: this.connectionSessionUUID }),
      }];
      
      const authCallback = (event: MessageEvent) => {
        try {
          const response: RunwareApiResponse = JSON.parse(event.data);
          if (response.data?.[0]?.taskType === "authentication") {
            this.ws?.removeEventListener("message", authCallback);
            resolve();
          }
        } catch (error) {
          console.error("RUNWARE authentication response parse error:", error);
          reject(error);
        }
      };
      
      this.ws.addEventListener("message", authCallback);
      this.ws.send(JSON.stringify(authMessage));
    });
  }

  /**
   * Generate image using Runware API with full parameter support
   */
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
    
    // Filter parameters based on model capabilities
    const filteredParams = filterParamsForModel(params);
    
    return new Promise((resolve, reject) => {
      const request: RunwareImageInferenceRequest = {
        taskType: "imageInference",
        taskUUID,
        positivePrompt: filteredParams.positivePrompt!,
        negativePrompt: filteredParams.negativePrompt,
        model: filteredParams.model || RUNWARE_MODELS.FLUX_1_1_PRO,
        width: filteredParams.width || 1024,
        height: filteredParams.height || 1024,
        numberResults: filteredParams.numberResults || 1,
        outputFormat: filteredParams.outputFormat || "WEBP",
        outputType: filteredParams.outputType || "URL",
        steps: filteredParams.steps || 4,
        CFGScale: filteredParams.CFGScale || (getModelArchitecture(filteredParams.model || RUNWARE_MODELS.FLUX_1_1_PRO) !== 'FLUX' ? 1 : undefined),
        scheduler: filteredParams.scheduler || RUNWARE_SCHEDULERS.FLOW_MATCH_EULER_DISCRETE,
        strength: filteredParams.strength || (getModelArchitecture(filteredParams.model || RUNWARE_MODELS.FLUX_1_1_PRO) !== 'FLUX' ? 0.8 : undefined),
        seed: filteredParams.seed || undefined,
        promptWeighting: filteredParams.promptWeighting,
        checkNSFW: filteredParams.checkNSFW,
        includeCost: filteredParams.includeCost,
        lora: filteredParams.lora,
        controlNet: filteredParams.controlNet,
      };

      // Remove undefined values to keep the request clean
      Object.keys(request).forEach(key => {
        const requestKey = key as keyof RunwareImageInferenceRequest;
        if (request[requestKey] === undefined) {
          delete request[requestKey];
        }
      });

      const message = [request];

      console.log("Sending RUNWARE image generation message:", message);

      this.messageCallbacks.set(taskUUID, (data: RunwareImageInferenceResponse) => {
        if ('error' in data) {
          reject(new Error('Image generation failed'));
        } else {
          const result: GeneratedImage = {
            imageUUID: data.imageUUID,
            taskUUID: data.taskUUID,
            imageURL: data.imageURL,
            imageBase64Data: data.imageBase64Data,
            imageDataURI: data.imageDataURI,
            positivePrompt: params.positivePrompt,
            seed: data.seed,
            NSFWContent: data.NSFWContent,
            cost: data.cost,
          };
          resolve(result);
        }
      });

      this.ws!.send(JSON.stringify(message));
    });
  }

  /**
   * Generate an optimized illustration for an ebook chapter using FLUX.1.1 Pro with AI-enhanced prompts
   */
  async generateEbookIllustration(params: EbookIllustrationParams): Promise<GeneratedImage> {
    if (!this.apiKey) {
      throw new Error('RUNWARE API key not provided');
    }

    // Use Groq to enhance the prompt if enabled
    const enhancedPrompt = params.useEnhancedPrompts !== false
      ? await enhancePromptWithGroq(params)
      : createEbookIllustrationPrompt(params);
    
    return this.generateImage({
      positivePrompt: enhancedPrompt,
      model: RUNWARE_MODELS.FLUX_1_1_PRO, // Use FLUX.1.1 Pro model
      numberResults: 1,
      outputFormat: "WEBP",
      outputType: "URL",
      // Note: FLUX models don't support CFGScale, checkNSFW, or strength parameters
      scheduler: RUNWARE_SCHEDULERS.FLOW_MATCH_EULER_DISCRETE,
      width: 1024,
      height: 1024,
      steps: 4,
      includeCost: true,
    });
  }

  /**
   * Generate a Taylor Swift-inspired thematic illustration with mood-appropriate styling
   */
  async generateTaylorSwiftIllustration(params: TaylorSwiftIllustrationParams): Promise<GeneratedImage> {
    if (!this.apiKey) {
      throw new Error('RUNWARE API key not provided');
    }

    // Analyze chapter content for optimal image parameters
    const imageParams = analyzeChapterForImageGeneration(
      params.chapterTitle,
      params.chapterContent,
      params.theme
    );

    // Override with custom parameters if provided
    const thematicParams: ThematicImageParams = {
      theme: params.theme,
      chapterTitle: params.chapterTitle,
      chapterContent: params.chapterContent,
      mood: params.customMood || imageParams.mood,
      timeOfDay: params.timeOfDay || imageParams.timeOfDay,
      season: params.season || imageParams.season,
      setting: params.setting
    };

    // Create Taylor Swift-inspired prompt
    const taylorSwiftPrompt = createTaylorSwiftImagePrompt(thematicParams);

    // Use Groq to enhance the prompt if enabled
    let finalPrompt = taylorSwiftPrompt;
    if (params.useEnhancedPrompts !== false) {
      try {
        finalPrompt = await this.enhanceTaylorSwiftPromptWithGroq(taylorSwiftPrompt, thematicParams);
      } catch (error) {
        console.warn('Failed to enhance Taylor Swift prompt with Groq, using base prompt:', error);
        // Fall back to the Taylor Swift prompt if enhancement fails
      }
    }
    
    return this.generateImage({
      positivePrompt: finalPrompt,
      model: RUNWARE_MODELS.FLUX_1_1_PRO, // Use FLUX.1.1 Pro for best quality
      numberResults: 1,
      outputFormat: "WEBP",
      outputType: "URL",
      scheduler: RUNWARE_SCHEDULERS.FLOW_MATCH_EULER_DISCRETE,
      width: 1024,
      height: 1024,
      steps: 4,
      includeCost: true,
    });
  }

  /**
   * Enhanced prompt generation specifically for Taylor Swift-themed illustrations
   */
  private async enhanceTaylorSwiftPromptWithGroq(basePrompt: string, params: ThematicImageParams): Promise<string> {
    try {
      const enhancementPrompt = `
You are an expert AI prompt engineer specializing in creating Taylor Swift-inspired illustrations for young adult literature.

Base Prompt: "${basePrompt}"

Theme: ${params.theme.replace('-', ' ')}
Mood: ${params.mood}
Chapter: "${params.chapterTitle}"

Please enhance this prompt to create a more detailed, optimized prompt for FLUX.1.1 Pro that:

1. Captures Taylor Swift's visual aesthetic and storytelling style
2. Incorporates ${params.theme.replace('-', ' ')} themes authentically
3. Uses rich, emotional imagery that resonates with young adults
4. Includes specific artistic techniques (lighting, composition, color theory)
5. Maintains age-appropriate content for 13-18 year olds
6. Optimizes for FLUX.1.1 Pro's capabilities
7. Creates Instagram-worthy, cinematic quality
8. Incorporates symbolic elements that enhance the narrative

Focus on creating a vivid, emotionally resonant scene that could be from a Taylor Swift music video or album artwork, while serving the story narrative.

Return ONLY the enhanced prompt, no explanations.
`;

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
              content: 'You are an expert AI prompt engineer for Taylor Swift-inspired illustrations. Create detailed, emotionally resonant prompts for young adult literature.'
            },
            {
              role: 'user',
              content: enhancementPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error('Groq API request failed');
      }

      const data = await response.json();
      const enhancedPrompt = data.choices?.[0]?.message?.content?.trim();
      
      if (!enhancedPrompt) {
        throw new Error('Invalid response from Groq API');
      }

      return enhancedPrompt;
    } catch (error) {
      console.error('Failed to enhance Taylor Swift prompt with Groq:', error);
      throw error;
    }
  }

  /**
   * Generate multiple illustrations for a series of chapters with AI-enhanced prompts
   */
  async generateChapterIllustrations(
    chapters: Array<{ title: string; content: string }>, 
    style: 'children' | 'fantasy' | 'adventure' | 'educational' = 'children'
  ): Promise<GeneratedImage[]> {
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
