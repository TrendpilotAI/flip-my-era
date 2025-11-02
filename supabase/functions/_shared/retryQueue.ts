/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface RetryQueueItem {
  id: string;
  webhook_type: string;
  webhook_id: string;
  payload: any;
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface RetryQueueConfig {
  maxRetries?: number;
  baseDelay?: number; // Base delay in milliseconds
  maxDelay?: number; // Maximum delay in milliseconds
  backoffMultiplier?: number;
}

export const defaultConfig: RetryQueueConfig = {
  maxRetries: 5,
  baseDelay: 60000, // 1 minute
  maxDelay: 86400000, // 24 hours
  backoffMultiplier: 2,
};

export class RetryQueue {
  private supabase;
  private config: RetryQueueConfig;

  constructor(config: RetryQueueConfig = {}) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Enqueue a webhook for retry
   */
  async enqueue(
    webhookType: string,
    webhookId: string,
    payload: any,
    retryCount: number = 0
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('webhook_retry_queue')
        .insert({
          webhook_type: webhookType,
          webhook_id: webhookId,
          payload,
          retry_count: retryCount,
          max_retries: this.config.maxRetries,
          scheduled_at: this.calculateNextRetryTime(retryCount),
        })
        .select('id')
        .single();

      if (error) throw error;

      console.log(`Webhook ${webhookId} enqueued for retry (attempt ${retryCount + 1})`);
      return data.id;
    } catch (error) {
      console.error('Failed to enqueue webhook for retry:', error);
      throw error;
    }
  }

  /**
   * Get pending webhooks for processing
   */
  async getPending(limit: number = 100): Promise<RetryQueueItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('webhook_retry_queue')
        .select('*')
        .eq('processed', false)
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get pending webhooks:', error);
      throw error;
    }
  }

  /**
   * Mark webhook as processed successfully
   */
  async markProcessed(queueId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('webhook_retry_queue')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', queueId);

      if (error) throw error;

      console.log(`Webhook retry ${queueId} marked as processed`);
    } catch (error) {
      console.error('Failed to mark webhook as processed:', error);
      throw error;
    }
  }

  /**
   * Mark webhook as failed and schedule next retry
   */
  async markFailed(queueId: string, errorMessage: string): Promise<void> {
    try {
      const { data: queueItem } = await this.supabase
        .from('webhook_retry_queue')
        .select('retry_count, max_retries')
        .eq('id', queueId)
        .single();

      if (!queueItem) {
        throw new Error(`Queue item ${queueId} not found`);
      }

      const { retry_count: retryCount, max_retries: maxRetries } = queueItem;

      if (retryCount >= maxRetries) {
        // Max retries reached, mark as permanently failed
        const { error } = await this.supabase
          .from('webhook_retry_queue')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: `Max retries (${maxRetries}) reached. Last error: ${errorMessage}`,
          })
          .eq('id', queueId);

        if (error) throw error;

        console.log(`Webhook retry ${queueId} reached max retries and marked as failed`);
      } else {
        // Schedule next retry
        const nextRetryCount = retryCount + 1;
        const { error } = await this.supabase
          .from('webhook_retry_queue')
          .update({
            retry_count: nextRetryCount,
            scheduled_at: this.calculateNextRetryTime(nextRetryCount),
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', queueId);

        if (error) throw error;

        console.log(`Webhook retry ${queueId} scheduled for attempt ${nextRetryCount + 1}`);
      }
    } catch (error) {
      console.error('Failed to mark webhook as failed:', error);
      throw error;
    }
  }

  /**
   * Calculate next retry time using exponential backoff
   */
  private calculateNextRetryTime(retryCount: number): string {
    const delay = Math.min(
      this.config.baseDelay! * Math.pow(this.config.backoffMultiplier!, retryCount),
      this.config.maxDelay!
    );
    return new Date(Date.now() + delay).toISOString();
  }

  /**
   * Clean up old processed webhooks
   */
  async cleanup(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await this.supabase
        .from('webhook_retry_queue')
        .delete()
        .eq('processed', true)
        .lt('processed_at', cutoffDate.toISOString());

      if (error) throw error;

      console.log(`Cleaned up webhooks older than ${olderThanDays} days`);
    } catch (error) {
      console.error('Failed to cleanup old webhooks:', error);
      throw error;
    }
  }
}

export default RetryQueue;