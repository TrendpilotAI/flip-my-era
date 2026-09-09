import {
  getCorsHeaders,
  handleCors,
  initSupabaseClient,
  verifyAuth,
} from '../_shared/utils.ts'

const CHAPTER_OPERATION_TYPE = 'chapter_generation';
// Mirrors calculateCreditCost({ operationType: 'chapter_generation', modelQuality: 'advanced' }).
const CHAPTER_GENERATION_CREDITS = 3;
const MAX_BODY_LENGTH = 100_000;
const MAX_ORIGINAL_STORY_LENGTH = 50_000;
const MAX_CHAPTERS = 12;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;
const MAX_CACHED_CHAPTER_CONTENT_LENGTH = 100_000;

// Groq API types
interface GroqChatMessage {
  role: string;
  content: string;
}

interface GroqChatChoice {
  message: GroqChatMessage;
  index: number;
  finish_reason: string;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface StorylineRequest {
  logline: string;
  threeActStructure: Record<string, unknown>;
  chapters: Array<{ number: number; title: string; summary: string; wordCountTarget: number }>;
  themes: string[];
  wordCountTotal: number;
}

interface StreamChapterRequest {
  originalStory: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme?: string;
  selectedFormat?: string;
  numChapters?: number;
  idempotencyKey: string;
  storyline?: StorylineRequest;
}

interface ChapterProgress {
  type: 'status' | 'progress' | 'chapter' | 'complete' | 'error';
  status?: 'claimed' | 'replay';
  replay?: boolean;
  idempotencyKey?: string;
  creditsCharged?: number;
  currentBalance?: number;
  currentChapter?: number;
  totalChapters?: number;
  chapterTitle?: string;
  chapterContent?: string;
  progress?: number;
  message?: string;
  code?: string;
  estimatedTimeRemaining?: number;
}

interface GeneratedChapter {
  title: string;
  content: string;
}

interface GenerationClaim {
  request_id: string | null;
  outcome: 'claimed' | 'replay' | 'in_progress' | 'insufficient' | 'failed';
  status: string;
  transaction_id: string | null;
  credits_charged: number | string;
  current_balance: number | string;
  response_cache: Record<string, unknown> | null;
  lease_token: string | null;
  lease_expires_at: string | null;
}

interface GenerationSettlement {
  success: boolean;
  is_replay?: boolean;
  refunded?: boolean;
  refund_transaction_id?: string | null;
}

// Story formats configuration
const storyFormats = {
  'short-story': { chapters: 3 },
  'novella': { chapters: 8 },
  'children-book': { chapters: 5 }
} as const;

// Taylor Swift themes
const taylorSwiftThemes = ['coming-of-age', 'first-love', 'heartbreak', 'friendship'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
  idempotencyKey?: string,
  additionalHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      ...additionalHeaders,
    },
  });
}

function parseStoryline(value: unknown): StorylineRequest | null {
  if (!isRecord(value)) return null;
  if (typeof value.logline !== 'string' || value.logline.length > 5_000) return null;
  if (!isRecord(value.threeActStructure)) return null;
  if (!Array.isArray(value.chapters) || value.chapters.length > MAX_CHAPTERS) return null;
  if (!Array.isArray(value.themes) || value.themes.length > 20) return null;
  if (!Number.isFinite(value.wordCountTotal) || Number(value.wordCountTotal) < 0 || Number(value.wordCountTotal) > 100_000) {
    return null;
  }

  const chapters = value.chapters.map((chapter) => {
    if (!isRecord(chapter)) return null;
    if (!Number.isInteger(chapter.number) || Number(chapter.number) < 1 || Number(chapter.number) > MAX_CHAPTERS) return null;
    if (typeof chapter.title !== 'string' || chapter.title.length > 300) return null;
    if (typeof chapter.summary !== 'string' || chapter.summary.length > 5_000) return null;
    if (!Number.isInteger(chapter.wordCountTarget) || Number(chapter.wordCountTarget) < 1 || Number(chapter.wordCountTarget) > 10_000) {
      return null;
    }
    return {
      number: Number(chapter.number),
      title: chapter.title,
      summary: chapter.summary,
      wordCountTarget: Number(chapter.wordCountTarget),
    };
  });

  if (chapters.some((chapter) => chapter === null)) return null;
  if (value.themes.some((theme) => typeof theme !== 'string' || theme.length > 100)) return null;

  return {
    logline: value.logline,
    threeActStructure: value.threeActStructure,
    chapters: chapters as StorylineRequest['chapters'],
    themes: value.themes as string[],
    wordCountTotal: Number(value.wordCountTotal),
  };
}

function parseStreamRequest(
  value: unknown,
  headerIdempotencyKey: string | null,
): { request?: StreamChapterRequest; error?: string } {
  if (!isRecord(value)) return { error: 'Request body must be a JSON object' };

  if (typeof value.originalStory !== 'string' || !value.originalStory.trim()) {
    return { error: 'Original story is required' };
  }
  const originalStory = value.originalStory.trim();
  if (originalStory.length > MAX_ORIGINAL_STORY_LENGTH) {
    return { error: `Original story must be ${MAX_ORIGINAL_STORY_LENGTH.toLocaleString()} characters or less` };
  }
  if (typeof value.useTaylorSwiftThemes !== 'boolean') {
    return { error: 'useTaylorSwiftThemes must be a boolean' };
  }

  const selectedFormat = value.selectedFormat ?? 'short-story';
  if (typeof selectedFormat !== 'string' || !(selectedFormat in storyFormats)) {
    return { error: 'selectedFormat must be short-story, novella, or children-book' };
  }

  const selectedTheme = value.selectedTheme ?? 'coming-of-age';
  if (typeof selectedTheme !== 'string' || !taylorSwiftThemes.includes(selectedTheme)) {
    return { error: 'selectedTheme is invalid' };
  }

  const defaultChapterCount = storyFormats[selectedFormat as keyof typeof storyFormats].chapters;
  const numChapters = value.numChapters ?? defaultChapterCount;
  if (!Number.isInteger(numChapters) || Number(numChapters) < 1 || Number(numChapters) > MAX_CHAPTERS) {
    return { error: `numChapters must be an integer between 1 and ${MAX_CHAPTERS}` };
  }

  const rawIdempotencyKey = value.idempotencyKey ?? headerIdempotencyKey;
  if (typeof rawIdempotencyKey !== 'string') {
    return { error: 'A client idempotency key is required' };
  }
  const idempotencyKey = rawIdempotencyKey.trim();
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    return { error: `Idempotency key must contain 1 to ${MAX_IDEMPOTENCY_KEY_LENGTH} characters` };
  }

  let storyline: StorylineRequest | undefined;
  if (value.storyline !== undefined && value.storyline !== null) {
    storyline = parseStoryline(value.storyline) ?? undefined;
    if (!storyline) return { error: 'storyline is invalid or exceeds its limits' };
  }

  return {
    request: {
      originalStory,
      useTaylorSwiftThemes: value.useTaylorSwiftThemes,
      selectedTheme,
      selectedFormat,
      numChapters: Number(numChapters),
      idempotencyKey,
      storyline,
    },
  };
}

function parseCachedChapters(value: Record<string, unknown> | null): GeneratedChapter[] | null {
  if (!value || !Array.isArray(value.chapters) || value.chapters.length < 1 || value.chapters.length > MAX_CHAPTERS) {
    return null;
  }

  const chapters = value.chapters.map((chapter) => {
    if (!isRecord(chapter)) return null;
    if (typeof chapter.title !== 'string' || !chapter.title.trim() || chapter.title.length > 500) return null;
    if (
      typeof chapter.content !== 'string'
      || !chapter.content.trim()
      || chapter.content.length > MAX_CACHED_CHAPTER_CONTENT_LENGTH
    ) {
      return null;
    }
    return { title: chapter.title, content: chapter.content };
  });

  return chapters.some((chapter) => chapter === null) ? null : chapters as GeneratedChapter[];
}

function formatActGuidance(
  structure: Record<string, unknown>,
  act: 'act1' | 'act2' | 'act3',
): string {
  const nestedAct = structure[act];
  const source = isRecord(nestedAct) ? nestedAct : structure;
  return Object.values(source)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .slice(0, 6)
    .map((value) => `- ${value}`)
    .join('\n');
}

function stripInvalidCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      const allowedWhitespace = codePoint === 9 || codePoint === 10 || codePoint === 13;
      const invalidControl = codePoint < 32 && !allowedWhitespace;
      const invalidScalar = codePoint === 127
        || codePoint === 0xFFFE
        || codePoint === 0xFFFF
        || (codePoint >= 0xD800 && codePoint <= 0xDFFF);
      return !invalidControl && !invalidScalar;
    })
    .join('');
}

async function apiRequestWithRetry<T>(
  config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    data: unknown;
    signal?: AbortSignal;
  },
  maxRetries = 3
): Promise<{ data: T }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: JSON.stringify(config.data),
        signal: config.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status} error:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      if (config.signal?.aborted) {
        throw config.signal.reason instanceof Error
          ? config.signal.reason
          : new DOMException('Chapter generation aborted', 'AbortError');
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

async function generateSingleChapter(
  originalStory: string,
  chapterNumber: number,
  totalChapters: number,
  useTaylorSwiftThemes: boolean,
  selectedTheme?: string,
  selectedFormat?: string,
  storyline?: StorylineRequest,
  signal?: AbortSignal,
): Promise<{ title: string; content: string }> {
  const format = selectedFormat || 'short-story';
  const theme = selectedTheme || 'coming-of-age';
  
  let prompt: string;

  if (useTaylorSwiftThemes) {
    const wordTarget = format === 'novella' ?
      `approximately 1,250-3,125 words` :
      `approximately 300-2,500 words`;
    
    const themeDescriptions = {
      'coming-of-age': 'coming-of-age, self-discovery, and finding your voice',
      'first-love': 'first love, innocent romance, and the magic of new connections',
      'heartbreak': 'heartbreak, healing, and finding strength after loss',
      'friendship': 'friendship, loyalty, and the bonds that shape us'
    };
    
    const themeDescription = themeDescriptions[theme as keyof typeof themeDescriptions] || themeDescriptions['coming-of-age'];
    
    // Build storyline context if provided
    let storylineContext = '';
    if (storyline) {
      const chapterInfo = storyline.chapters.find(ch => ch.number === chapterNumber);
      storylineContext = `
      
      STORYLINE STRUCTURE:
      Logline: ${storyline.logline}
      
      Overall Themes: ${storyline.themes.join(', ')}
      
      ${chapterInfo ? `
      CHAPTER ${chapterNumber} GUIDANCE:
      Title Suggestion: ${chapterInfo.title}
      Summary: ${chapterInfo.summary}
      Target Word Count: ${chapterInfo.wordCountTarget}
      ` : ''}
      
      THREE-ACT STRUCTURE:
      ${chapterNumber <= Math.ceil(totalChapters * 0.25) ? `
      Act 1 - Setup:
      ${formatActGuidance(storyline.threeActStructure, 'act1')}
      ` : chapterNumber <= Math.ceil(totalChapters * 0.75) ? `
      Act 2 - Confrontation:
      ${formatActGuidance(storyline.threeActStructure, 'act2')}
      ` : `
      Act 3 - Resolution:
      ${formatActGuidance(storyline.threeActStructure, 'act3')}
      `}
      `;
    }
    
    prompt = `
      Create Chapter ${chapterNumber} of ${totalChapters} for a Taylor Swift-inspired young adult ${format === 'novella' ? 'novella' : 'short story'} based on this story:
      
      ${originalStory}
      ${storylineContext}
      
      SPECIFICATIONS:
      - Theme: ${themeDescription}
      - Format: YA ${format === 'novella' ? 'Novella' : 'Short Story'}
      - Target: ${wordTarget} for this chapter
      - Chapter ${chapterNumber} of ${totalChapters}
      - Age-appropriate content for readers 13-18
      - Emotional storytelling reminiscent of Taylor Swift's lyrical style
      
      Provide:
      - A compelling chapter title that reflects the emotional journey${storyline ? ' (consider the suggested title but feel free to improve it)' : ''}
      - Rich content with authentic dialogue and relatable teenage experiences
      - Character development and emotional depth
      - Age-appropriate themes and situations
      - Vivid descriptions and emotional resonance
      
      ${chapterNumber === 1 ? 'This is the opening chapter - establish the world, characters, and central conflict.' : 
        chapterNumber === totalChapters ? 'This is the final chapter - bring the story to an emotionally satisfying conclusion.' :
        'This is a middle chapter - develop the story and deepen character relationships.'}
      
      Format your response as a JSON object with "title" and "content" properties.
    `;
  } else {
    prompt = `
      Create Chapter ${chapterNumber} of ${totalChapters} for a children's book based on this story:
      
      ${originalStory}
      
      Make this chapter engaging, imaginative, and appropriate for children.
      ${chapterNumber === 1 ? 'This is the opening chapter - introduce the characters and setting.' : 
        chapterNumber === totalChapters ? 'This is the final chapter - bring the story to a satisfying conclusion.' :
        'This is a middle chapter - develop the adventure and characters.'}
      
      Format your response as a JSON object with "title" and "content" properties.
    `;
  }

  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const response = await apiRequestWithRetry<GroqChatResponse>({
    method: 'POST',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
      data: {
        model: 'openai/gpt-oss-120b',
        messages: [
        {
          role: 'system',
          content: useTaylorSwiftThemes
            ? `You are a creative young adult author who specializes in emotionally resonant ${format === 'novella' ? 'novellas' : 'short stories'} with Taylor Swift-inspired themes. You write age-appropriate content that captures the intensity and authenticity of teenage emotions.`
            : 'You are a creative children\'s book author who specializes in creating engaging chapter books.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: format === 'novella' ? 8192 : 4096,
      response_format: { type: "json_object" }
    },
    signal,
  });

  let parsedContent;
  try {
    // First, try to clean the response content
    const cleanedContent = stripInvalidCharacters(response.data.choices[0].message.content).trim();
    
    parsedContent = JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    console.error('Raw AI response:', response.data.choices[0].message.content);
    
    // Fallback: try to extract title and content from the raw text
    const rawContent = response.data.choices[0].message.content;
    
    // Try multiple regex patterns to extract content
    let titleMatch = rawContent.match(/"title"\s*:\s*"([^"]*)"/);
    let contentMatch = rawContent.match(/"content"\s*:\s*"([^"]*)"/);
    
    // If that doesn't work, try without quotes
    if (!titleMatch) {
      titleMatch = rawContent.match(/title\s*:\s*([^\n,}]+)/);
    }
    if (!contentMatch) {
      contentMatch = rawContent.match(/content\s*:\s*([^\n,}]+)/);
    }
    
    // If still no match, try to extract any text that looks like a title or content
    if (!titleMatch) {
      const lines = rawContent.split('\n');
      const titleLine = lines.find(line => line.toLowerCase().includes('title') || line.includes('Chapter'));
      if (titleLine) {
        const extractedTitle = titleLine.replace(/.*?:\s*/, '');
        titleMatch = [titleLine, extractedTitle] as RegExpMatchArray;
      }
    }
    
    if (!contentMatch) {
      // Find the longest paragraph that's not a title
      const paragraphs = rawContent.split('\n\n');
      const contentParagraph = paragraphs.find(p => 
        p.length > 50 && 
        !p.toLowerCase().includes('title') && 
        !p.toLowerCase().includes('chapter')
      );
      if (contentParagraph) {
        contentMatch = [contentParagraph, contentParagraph] as RegExpMatchArray;
      }
    }
    
    parsedContent = {
      title: titleMatch ? titleMatch[1].trim() : `Chapter ${chapterNumber}`,
      content: contentMatch ? contentMatch[1].trim() : rawContent
    };
  }
  
  // Ensure the returned content is clean and safe
  // Convert title/content to strings first to avoid calling .replace on non-string values
  const rawTitle = typeof parsedContent.title === 'string'
    ? parsedContent.title
    : JSON.stringify(parsedContent.title ?? `Chapter ${chapterNumber}`);

  const rawContent = typeof parsedContent.content === 'string'
    ? parsedContent.content
    : JSON.stringify(parsedContent.content ?? '');

  const cleanTitle = stripInvalidCharacters(rawTitle || `Chapter ${chapterNumber}`).trim();
  const cleanContent = stripInvalidCharacters(rawContent).trim();

  if (
    !cleanTitle
    || cleanTitle.length > 500
    || !cleanContent
    || cleanContent.length > MAX_CACHED_CHAPTER_CONTENT_LENGTH
  ) {
    throw new Error('The generation service returned invalid chapter content');
  }
  
  return {
    title: cleanTitle,
    content: cleanContent
  };
}

function sseHeaders(
  corsHeaders: Record<string, string>,
  idempotencyKey: string,
  replay = false,
): Record<string, string> {
  return {
    ...corsHeaders,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-store',
    'X-Idempotency-Key': idempotencyKey,
    ...(replay ? { 'X-Idempotent-Replay': 'true' } : {}),
  };
}

function enqueueEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  data: ChapterProgress,
): void {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

function replayResponse(
  chapters: GeneratedChapter[],
  claim: GenerationClaim,
  idempotencyKey: string,
  corsHeaders: Record<string, string>,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      try {
        enqueueEvent(controller, encoder, {
          type: 'status',
          status: 'replay',
          replay: true,
          idempotencyKey,
          creditsCharged: Number(claim.credits_charged),
          currentBalance: Number(claim.current_balance),
          totalChapters: chapters.length,
          message: 'Restoring the completed chapter generation...',
        });
        chapters.forEach((chapter, index) => {
          enqueueEvent(controller, encoder, {
            type: 'chapter',
            replay: true,
            currentChapter: index + 1,
            totalChapters: chapters.length,
            chapterTitle: chapter.title,
            chapterContent: chapter.content,
            progress: ((index + 1) / chapters.length) * 100,
          });
        });
        enqueueEvent(controller, encoder, {
          type: 'complete',
          replay: true,
          progress: 100,
          totalChapters: chapters.length,
          message: 'Completed chapters restored.',
        });
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: sseHeaders(corsHeaders, idempotencyKey, true),
  });
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' }, 405, corsHeaders);
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid or expired session token' }, 401, corsHeaders);
  }

  const declaredLength = Number(req.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_LENGTH) {
    return jsonResponse({ error: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' }, 413, corsHeaders);
  }

  let requestBody: unknown;
  try {
    const rawBody = await req.text();
    if (!rawBody || rawBody.length > MAX_BODY_LENGTH) {
      return jsonResponse({ error: 'PAYLOAD_TOO_LARGE', message: 'Request body is empty or too large' }, 413, corsHeaders);
    }
    requestBody = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'BAD_REQUEST', message: 'Request body must be valid JSON' }, 400, corsHeaders);
  }

  const parsed = parseStreamRequest(requestBody, req.headers.get('Idempotency-Key'));
  if (!parsed.request) {
    return jsonResponse({ error: 'BAD_REQUEST', message: parsed.error ?? 'Invalid request' }, 400, corsHeaders);
  }

  const {
    originalStory,
    useTaylorSwiftThemes,
    selectedTheme,
    selectedFormat,
    numChapters: chapterCount = storyFormats['short-story'].chapters,
    idempotencyKey,
    storyline,
  } = parsed.request;

  if (!Deno.env.get('GROQ_API_KEY')) {
    return jsonResponse(
      { error: 'GENERATION_SERVICE_UNAVAILABLE', message: 'Chapter generation is not configured' },
      503,
      corsHeaders,
      idempotencyKey,
    );
  }

  let adminClient;
  try {
    adminClient = initSupabaseClient();
  } catch (error) {
    console.error('Unable to initialize the credit service:', error);
    return jsonResponse(
      { error: 'CREDIT_SERVICE_ERROR', message: 'Credit service is not configured' },
      503,
      corsHeaders,
      idempotencyKey,
    );
  }

  const { data: claimData, error: claimError } = await adminClient
    .rpc('claim_generation_request', {
      p_user_id: userId,
      p_idempotency_key: idempotencyKey,
      p_operation_type: CHAPTER_OPERATION_TYPE,
      p_credits: CHAPTER_GENERATION_CREDITS,
      p_metadata: {
        source: 'stream-chapters',
        model_quality: 'advanced',
        selected_format: selectedFormat,
        chapter_count: chapterCount,
      },
    })
    .single();

  if (claimError || !claimData) {
    console.error('Chapter generation claim failed:', claimError);
    return jsonResponse(
      { error: 'CREDIT_SERVICE_ERROR', message: 'Unable to process credits. Please try again.' },
      503,
      corsHeaders,
      idempotencyKey,
    );
  }

  const claim = claimData as GenerationClaim;
  if (claim.outcome === 'replay') {
    const cachedChapters = parseCachedChapters(claim.response_cache);
    if (!cachedChapters) {
      console.error('Completed chapter generation has an invalid replay cache:', claim.request_id);
      return jsonResponse(
        { error: 'REPLAY_CACHE_INVALID', message: 'The completed generation could not be restored' },
        503,
        corsHeaders,
        idempotencyKey,
      );
    }
    return replayResponse(cachedChapters, claim, idempotencyKey, corsHeaders);
  }

  if (claim.outcome === 'in_progress') {
    const leaseExpiry = claim.lease_expires_at ? new Date(claim.lease_expires_at).getTime() : Date.now() + 5_000;
    const retryAfter = Math.max(1, Math.ceil((leaseExpiry - Date.now()) / 1_000));
    return jsonResponse(
      {
        error: 'GENERATION_IN_PROGRESS',
        status: 'in_progress',
        message: 'A chapter generation with this key is already in progress.',
        retry_after: retryAfter,
      },
      409,
      corsHeaders,
      idempotencyKey,
      { 'Retry-After': String(retryAfter) },
    );
  }

  if (claim.outcome === 'insufficient') {
    return jsonResponse(
      {
        error: 'INSUFFICIENT_CREDITS',
        status: 'insufficient',
        message: 'You do not have enough credits to generate chapters.',
        current_balance: Number(claim.current_balance ?? 0),
        required: CHAPTER_GENERATION_CREDITS,
      },
      402,
      corsHeaders,
      idempotencyKey,
    );
  }

  if (claim.outcome === 'failed') {
    return jsonResponse(
      {
        error: 'REQUEST_PREVIOUSLY_FAILED',
        status: 'failed',
        message: 'This generation attempt failed. Start a new attempt to retry.',
      },
      409,
      corsHeaders,
      idempotencyKey,
    );
  }

  if (claim.outcome !== 'claimed' || !claim.lease_token) {
    console.error('Unexpected generation claim state:', claim);
    return jsonResponse(
      { error: 'CREDIT_SERVICE_ERROR', message: 'Unexpected generation claim state' },
      503,
      corsHeaders,
      idempotencyKey,
    );
  }

  const leaseToken = claim.lease_token;
  const generationAbort = new AbortController();
  let claimOutstanding = true;
  let failPromise: Promise<boolean> | null = null;

  const failClaim = (errorCode: string, errorMessage: string): Promise<boolean> => {
    if (!claimOutstanding) return Promise.resolve(true);
    if (failPromise) return failPromise;

    failPromise = (async () => {
      const { data, error } = await adminClient
        .rpc('fail_generation_request', {
          p_user_id: userId,
          p_idempotency_key: idempotencyKey,
          p_lease_token: leaseToken,
          p_error_code: errorCode,
          p_error_message: errorMessage.slice(0, 2_000),
        })
        .single();
      const settlement = data as GenerationSettlement | null;
      const refundConfirmed = !error && settlement?.success === true && settlement.refunded === true;
      if (refundConfirmed) claimOutstanding = false;
      if (!refundConfirmed) {
        console.error('Unable to confirm failed-generation refund:', error ?? settlement);
      }
      return refundConfirmed;
    })();

    return failPromise;
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const onRequestAbort = () => generationAbort.abort(new DOMException('Client disconnected', 'AbortError'));
      req.signal.addEventListener('abort', onRequestAbort, { once: true });

      try {
        if (req.signal.aborted) onRequestAbort();

        enqueueEvent(controller, encoder, {
          type: 'status',
          status: 'claimed',
          replay: false,
          idempotencyKey,
          creditsCharged: CHAPTER_GENERATION_CREDITS,
          currentBalance: Number(claim.current_balance),
          totalChapters: chapterCount,
          message: 'Credits claimed. Starting chapter generation...',
        });
        enqueueEvent(controller, encoder, {
          type: 'progress',
          currentChapter: 0,
          totalChapters: chapterCount,
          progress: 0,
          message: 'Initializing chapter generation...',
        });

        const chapters: GeneratedChapter[] = [];
        const startTime = Date.now();

        for (let index = 0; index < chapterCount; index += 1) {
          if (generationAbort.signal.aborted) {
            throw generationAbort.signal.reason instanceof Error
              ? generationAbort.signal.reason
              : new DOMException('Chapter generation aborted', 'AbortError');
          }

          const chapterNumber = index + 1;
          enqueueEvent(controller, encoder, {
            type: 'progress',
            currentChapter: chapterNumber,
            totalChapters: chapterCount,
            progress: (index / chapterCount) * 100,
            message: `Generating Chapter ${chapterNumber}...`,
            estimatedTimeRemaining: index > 0
              ? ((Date.now() - startTime) / index) * (chapterCount - index) / 1_000
              : undefined,
          });

          const chapter = await generateSingleChapter(
            originalStory,
            chapterNumber,
            chapterCount,
            useTaylorSwiftThemes,
            selectedTheme,
            selectedFormat,
            storyline,
            generationAbort.signal,
          );
          chapters.push(chapter);

          enqueueEvent(controller, encoder, {
            type: 'chapter',
            currentChapter: chapterNumber,
            totalChapters: chapterCount,
            chapterTitle: chapter.title,
            chapterContent: chapter.content,
            progress: (chapterNumber / chapterCount) * 100,
          });
        }

        const responseCache = {
          chapters,
          totalChapters: chapterCount,
          operationType: CHAPTER_OPERATION_TYPE,
          creditsCharged: CHAPTER_GENERATION_CREDITS,
        };
        const { data: completionData, error: completionError } = await adminClient
          .rpc('complete_generation_request', {
            p_user_id: userId,
            p_idempotency_key: idempotencyKey,
            p_response_cache: responseCache,
            p_lease_token: leaseToken,
          })
          .single();
        const completion = completionData as GenerationSettlement | null;

        if (completionError || completion?.success !== true) {
          console.error('Unable to complete chapter generation request:', completionError ?? completion);
          await failClaim('COMPLETION_ERROR', 'Unable to persist the completed chapter generation');
          throw new Error('Unable to finalize chapter generation');
        }

        claimOutstanding = false;
        enqueueEvent(controller, encoder, {
          type: 'complete',
          replay: completion.is_replay === true,
          progress: 100,
          totalChapters: chapterCount,
          message: 'All chapters generated successfully!',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown chapter generation error';
        const errorCode = error instanceof DOMException && error.name === 'AbortError'
          ? 'CLIENT_ABORTED'
          : 'CHAPTER_GENERATION_FAILED';
        console.error('Streaming chapter generation failed:', error);
        const refundConfirmed = await failClaim(errorCode, errorMessage);

        if (!generationAbort.signal.aborted) {
          try {
            enqueueEvent(controller, encoder, {
              type: 'error',
              code: refundConfirmed ? errorCode : 'CREDIT_REFUND_ERROR',
              message: refundConfirmed
                ? 'Chapter generation failed. Your credits were refunded.'
                : 'Chapter generation failed and the credit refund could not be confirmed. Please contact support.',
            });
          } catch (streamError) {
            console.error('Unable to send chapter generation error event:', streamError);
          }
        }
      } finally {
        req.signal.removeEventListener('abort', onRequestAbort);
        try {
          controller.close();
        } catch {
          // The browser may already have cancelled the stream.
        }
      }
    },
    async cancel(reason) {
      generationAbort.abort(reason instanceof Error ? reason : new DOMException('Client cancelled stream', 'AbortError'));
      await failClaim('CLIENT_ABORTED', 'Client cancelled the chapter generation stream');
    },
  });

  return new Response(stream, {
    headers: sseHeaders(corsHeaders, idempotencyKey),
  });
});
