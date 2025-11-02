/* eslint-disable @typescript-eslint/no-explicit-any */
// Type declarations for Deno and external modules

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }
  
  export const env: Env;
}

declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.7" {
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
      fetch?: typeof fetch;
    };
    realtime?: {
      channels?: any;
      timeout?: number;
    };
  }

  export interface PostgrestError {
    message: string;
    details: string;
    hint: string;
    code: string;
  }

  export interface PostgrestResponse<T> {
    data: T | null;
    error: PostgrestError | null;
    count: number | null;
    status: number;
    statusText: string;
  }

  export interface PostgrestSingleResponse<T> extends PostgrestResponse<T> {
    data: T | null;
  }

  export interface PostgrestMaybeSingleResponse<T> extends PostgrestResponse<T> {
    data: T | null;
  }

  export interface PostgrestFilterBuilder<T> {
    eq(column: string, value: any): PostgrestFilterBuilder<T>;
    neq(column: string, value: any): PostgrestFilterBuilder<T>;
    gt(column: string, value: any): PostgrestFilterBuilder<T>;
    gte(column: string, value: any): PostgrestFilterBuilder<T>;
    lt(column: string, value: any): PostgrestFilterBuilder<T>;
    lte(column: string, value: any): PostgrestFilterBuilder<T>;
    like(column: string, pattern: string): PostgrestFilterBuilder<T>;
    ilike(column: string, pattern: string): PostgrestFilterBuilder<T>;
    is(column: string, value: any): PostgrestFilterBuilder<T>;
    in(column: string, values: any[]): PostgrestFilterBuilder<T>;
    contains(column: string, value: any): PostgrestFilterBuilder<T>;
    containedBy(column: string, value: any): PostgrestFilterBuilder<T>;
    rangeLt(column: string, range: any): PostgrestFilterBuilder<T>;
    rangeGt(column: string, range: any): PostgrestFilterBuilder<T>;
    rangeGte(column: string, range: any): PostgrestFilterBuilder<T>;
    rangeLte(column: string, range: any): PostgrestFilterBuilder<T>;
    rangeAdjacent(column: string, range: any): PostgrestFilterBuilder<T>;
    overlaps(column: string, value: any): PostgrestFilterBuilder<T>;
    textSearch(column: string, query: string, options?: { config?: string }): PostgrestFilterBuilder<T>;
    filter(column: string, operator: string, value: any): PostgrestFilterBuilder<T>;
    not(column: string, operator: string, value: any): PostgrestFilterBuilder<T>;
    or(filters: string, options?: { foreignTable?: string }): PostgrestFilterBuilder<T>;
    select(columns?: string): PostgrestFilterBuilder<T>;
    order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }): PostgrestFilterBuilder<T>;
    limit(count: number, options?: { foreignTable?: string }): PostgrestFilterBuilder<T>;
    range(from: number, to: number, options?: { foreignTable?: string }): PostgrestFilterBuilder<T>;
    single(): PostgrestSingleResponse<T>;
    maybeSingle(): PostgrestMaybeSingleResponse<T>;
  }

  export interface PostgrestQueryBuilder<T> extends PostgrestFilterBuilder<T> {
    select(columns?: string): PostgrestFilterBuilder<T>;
  }

  export interface PostgrestBuilder<T> {
    select(columns?: string): PostgrestFilterBuilder<T>;
    insert(values: any, options?: { returning?: boolean | string; count?: 'exact' | 'planned' | 'estimated' }): PostgrestFilterBuilder<T>;
    upsert(values: any, options?: { returning?: boolean | string; count?: 'exact' | 'planned' | 'estimated'; onConflict?: string }): PostgrestFilterBuilder<T>;
    update(values: any, options?: { returning?: boolean | string; count?: 'exact' | 'planned' | 'estimated' }): PostgrestFilterBuilder<T>;
    delete(options?: { returning?: boolean | string; count?: 'exact' | 'planned' | 'estimated' }): PostgrestFilterBuilder<T>;
  }

  export interface SupabaseClient {
    from<T = any>(table: string): PostgrestBuilder<T>;
    rpc<T = any>(fn: string, params?: object): PostgrestFilterBuilder<T>;
    auth: {
      signUp(credentials: { email: string; password: string }): Promise<any>;
      signIn(credentials: { email: string; password: string }): Promise<any>;
      signOut(): Promise<any>;
      session(): any;
      user(): any;
    };
    storage: {
      from(bucket: string): {
        upload(path: string, file: File | Blob | ArrayBuffer | ArrayBufferView, options?: any): Promise<any>;
        download(path: string): Promise<any>;
        getPublicUrl(path: string): { publicURL: string };
        remove(paths: string[]): Promise<any>;
        list(prefix?: string, options?: any): Promise<any>;
      };
    };
  }

  export function createClient(supabaseUrl: string, supabaseKey: string, options?: SupabaseClientOptions): SupabaseClient;
} 