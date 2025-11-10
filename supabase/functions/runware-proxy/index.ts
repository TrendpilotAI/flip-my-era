import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, handleCors, formatErrorResponse, formatSuccessResponse } from "../_shared/utils.ts";

interface RunwareProxyRequest {
  action?: "generate-image" | "generate-multiple";
  params: RunwareImageParams;
}

interface RunwareImageParams {
  positivePrompt: string;
  negativePrompt?: string;
  model?: string;
  numberResults?: number;
  outputFormat?: "PNG" | "JPG" | "WEBP";
  outputType?: "URL" | "base64Data" | "dataURI";
  CFGScale?: number;
  scheduler?: string;
  strength?: number;
  seed?: number | null;
  height?: number;
  width?: number;
  steps?: number;
  checkNSFW?: boolean;
  includeCost?: boolean;
  lora?: Array<{ model: string; weight: number }>;
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
}

interface RunwareApiEnvelope {
  data?: Array<RunwareAuthenticationResponse | RunwareImageInferenceResponse>;
  error?: string;
  errors?: Array<{ message: string }>;
  errorMessage?: string;
}

interface RunwareAuthenticationResponse {
  taskType: "authentication";
  connectionSessionUUID: string;
}

interface RunwareImageInferenceResponse {
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

interface RunwareImageInferenceRequestPayload {
  taskType: "imageInference";
  taskUUID: string;
  positivePrompt: string;
  negativePrompt?: string;
  model?: string;
  numberResults?: number;
  outputFormat?: "PNG" | "JPG" | "WEBP";
  outputType?: "URL" | "base64Data" | "dataURI";
  CFGScale?: number;
  scheduler?: string;
  strength?: number;
  seed?: number;
  height?: number;
  width?: number;
  steps?: number;
  checkNSFW?: boolean;
  includeCost?: boolean;
  lora?: Array<{ model: string; weight: number }>;
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
}

const RUNWARE_WS_URL = "wss://ws-api.runware.ai/v1";
const DEFAULT_TIMEOUT_MS = 120_000;

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: corsHeaders });
  }

  let payload: RunwareProxyRequest;
  try {
    payload = await req.json();
  } catch (error) {
    return formatErrorResponse(new Error("Invalid JSON payload"), 400);
  }

  const apiKey = Deno.env.get("RUNWARE_API_KEY") || Deno.env.get("RUNWARE_SERVICE_ROLE_KEY");
  if (!apiKey) {
    return formatErrorResponse(new Error("RUNWARE_API_KEY is not configured"), 500);
  }

  const action = payload.action ?? "generate-image";
  if (!payload.params?.positivePrompt) {
    return formatErrorResponse(new Error("positivePrompt is required"), 400);
  }

  try {
    const results = await generateRunwareImages(apiKey, payload.params, action === "generate-multiple");
    return formatSuccessResponse({ images: results });
  } catch (error) {
    return formatErrorResponse(error instanceof Error ? error : new Error(String(error)), 502);
  }
});

async function generateRunwareImages(
  apiKey: string,
  params: RunwareImageParams,
  expectMultiple: boolean
): Promise<Array<RunwareImageInferenceResponse>> {
  const numberResults = params.numberResults && params.numberResults > 0 ? params.numberResults : 1;
  const taskUUID = crypto.randomUUID();

  const ws = new WebSocket(RUNWARE_WS_URL);

  const results: Array<RunwareImageInferenceResponse> = [];

  return await new Promise((resolve, reject) => {
    let authenticated = false;
    let finished = false;
    const timeoutId = setTimeout(() => {
      if (!finished) {
        finished = true;
        try {
          ws.close();
        } catch (_e) {
          // Ignore close errors
        }
        reject(new Error("Runware request timed out"));
      }
    }, DEFAULT_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeoutId);
      ws.onopen = null as unknown as () => void;
      ws.onmessage = null as unknown as (event: MessageEvent) => void;
      ws.onerror = null as unknown as (event: Event) => void;
      ws.onclose = null as unknown as (event: CloseEvent) => void;
    };

    ws.onopen = () => {
      const authMessage = [{
        taskType: "authentication" as const,
        apiKey,
      }];
      ws.send(JSON.stringify(authMessage));
    };

    ws.onerror = () => {
      if (!finished) {
        finished = true;
        cleanup();
        reject(new Error("Runware WebSocket error"));
      }
    };

    ws.onclose = () => {
      if (!finished) {
        finished = true;
        cleanup();
        if (results.length > 0) {
          resolve(results);
        } else {
          reject(new Error("Runware connection closed before receiving results"));
        }
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const response: RunwareApiEnvelope = JSON.parse(event.data);

        if (response.error || response.errorMessage || response.errors?.length) {
          const message = response.errorMessage || response.error || response.errors?.[0]?.message || "Runware returned an error";
          finished = true;
          cleanup();
          ws.close();
          reject(new Error(message));
          return;
        }

        if (!response.data) {
          return;
        }

        for (const item of response.data) {
          if (item.taskType === "authentication") {
            if (!authenticated) {
              authenticated = true;
              const requestPayload = buildImageRequest(taskUUID, params);
              ws.send(JSON.stringify([requestPayload]));
            }
          } else if (item.taskType === "imageInference") {
            results.push(item);

            if (!expectMultiple || results.length >= numberResults) {
              finished = true;
              cleanup();
              ws.close();
              resolve(results);
              return;
            }
          }
        }
      } catch (error) {
        finished = true;
        cleanup();
        ws.close();
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
  });
}

function buildImageRequest(taskUUID: string, params: RunwareImageParams): RunwareImageInferenceRequestPayload {
  const request: RunwareImageInferenceRequestPayload = {
    taskType: "imageInference",
    taskUUID,
    positivePrompt: params.positivePrompt,
    model: params.model,
    numberResults: params.numberResults,
    outputFormat: params.outputFormat,
    outputType: params.outputType,
    CFGScale: params.CFGScale,
    scheduler: params.scheduler,
    strength: params.strength,
    seed: params.seed ?? undefined,
    height: params.height,
    width: params.width,
    steps: params.steps,
    checkNSFW: params.checkNSFW,
    includeCost: params.includeCost,
    lora: params.lora,
    controlNet: params.controlNet,
    negativePrompt: params.negativePrompt,
  };

  for (const key of Object.keys(request)) {
    const value = request[key];
    if (value === undefined || value === null) {
      delete request[key];
    }
  }

  return request;
}
