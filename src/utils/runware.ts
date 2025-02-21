
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
    this.connectionPromise = this.connect();
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('wss://ws-api.runware.ai/v1');
        
        this.ws.onopen = async () => {
          console.log("WebSocket connected, waiting for ready state...");
          // Wait for the connection to be fully ready
          await this.waitForReadyState();
          console.log("WebSocket ready, authenticating...");
          try {
            await this.authenticate();
            resolve();
          } catch (error) {
            console.error("Authentication failed:", error);
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          console.log("Received message:", event.data);
          const response = JSON.parse(event.data);
          
          if (response.error || response.errors) {
            console.error("WebSocket error response:", response);
            const errorMessage = response.errorMessage || response.errors?.[0]?.message || "An error occurred";
            throw new Error(errorMessage);
          }

          if (response.data) {
            response.data.forEach((item: any) => {
              if (item.taskType === "authentication") {
                console.log("Authentication successful");
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
          console.error("WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket closed");
          this.isAuthenticated = false;
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connectionPromise = this.connect();
            }, 1000 * this.reconnectAttempts); // Exponential backoff
          } else {
            console.error("Max reconnection attempts reached");
          }
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
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

      // Set a timeout to prevent infinite waiting
      setTimeout(() => {
        clearInterval(checkState);
        resolve();
      }, 5000);
    });
  }

  private authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not ready for authentication"));
        return;
      }
      
      console.log("Sending authentication message");
      const authMessage = [{
        taskType: "authentication",
        apiKey: this.apiKey,
        ...(this.connectionSessionUUID && { connectionSessionUUID: this.connectionSessionUUID }),
      }];
      
      // Set up a one-time authentication callback
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
    // Wait for connection and authentication before proceeding
    await this.connectionPromise;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
      console.log("Connection not ready, reconnecting...");
      this.connectionPromise = this.connect();
      await this.connectionPromise;
    }

    const taskUUID = crypto.randomUUID();
    
    return new Promise((resolve, reject) => {
      const message = [{
        taskType: "imageInference",
        taskUUID,
        model: "runware:100@1", // Always use this model
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

      console.log("Sending image generation message:", message);

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
}
