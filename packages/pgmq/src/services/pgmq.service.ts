import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import {
  IPGMQService,
  PGMQMessage,
  PGMQJobCounts,
  PGMQDeadLetterMessage,
  SendOptions,
} from '../interfaces/pgmq.interface';

@Injectable()
export class PGMQService implements IPGMQService, OnModuleDestroy {
  private readonly logger: Logger;
  constructor(
    private readonly pool: Pool,
  ) {
    this.logger = new Logger('PGMQService');
  }

  async onModuleDestroy() {
    // Don't close the pool here since it's managed by the module
  }

  private getDLQName(queueName: string): string {
    return `${queueName}_dlq`;
  }

  async createQueue(queueName: string): Promise<void> {
    try {
      await this.pool.query('SELECT pgmq.create($1)', [queueName]);
      
      // Create DLQ
      const dlqName = this.getDLQName(queueName);
      await this.pool.query('SELECT pgmq.create($1)', [dlqName]);
    } catch (error) {
      this.logger.error(`Failed to create queue ${queueName}`, error);
      throw error;
    }
  }

  async send<T>(queueName: string, message: T, options: SendOptions = {}): Promise<number> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM pgmq.send($1, $2::jsonb)',
        [queueName, JSON.stringify(message)],
      );
      return Number(result.rows[0].send);
    } catch (error) {
      this.logger.error(`Failed to send message to queue ${queueName}`, error);
      throw error;
    }
  }

  async sendBatch<T>(queueName: string, messages: T[], options: SendOptions = {}): Promise<number[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM pgmq.send_batch($1, $2::jsonb[])',
        [queueName, messages.map(msg => JSON.stringify(msg))],
      );
      return result.rows.map(row => parseInt(row.send_batch, 10));
    } catch (error) {
      this.logger.error(
        `Failed to send batch messages to queue ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async read<T>(
    queueName: string,
    visibilityTimeout: number,
    quantity: number = 1,
  ): Promise<PGMQMessage<T>[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM pgmq.read($1, $2, $3)',
        [queueName, visibilityTimeout, quantity],
      );

      return result.rows.map((row) => ({
        msg_id: row.msg_id,
        message: row.message,
        read_ct: row.read_ct,
        maxRetries: 3, // Default value since PGMQ doesn't have this concept
        enqueued_at: row.enqueued_at,
        vt: row.vt,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to read messages from queue ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async pop<T>(queueName: string): Promise<PGMQMessage<T> | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM pgmq.pop($1)',
        [queueName],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        msg_id: row.msg_id,
        message: row.message,
        read_ct: row.read_ct,
        maxRetries: 3, // Default value since PGMQ doesn't have this concept
        enqueued_at: row.enqueued_at,
        vt: row.vt,
      };
    } catch (error) {
      this.logger.error(`Failed to pop message from queue ${queueName}`, error);
      throw error;
    }
  }

  async moveToDeadLetter(
    queueName: string,
    messageId: number,
    error: Error,
    attemptsMade: number,
  ): Promise<void> {
    try {
      // Get the original message
      const result = await this.pool.query(
        'SELECT * FROM pgmq.read($1, 0, 1) WHERE msg_id = $2',
        [queueName, messageId],
      );

      if (result.rows.length === 0) {
        return;
      }

      const message = result.rows[0];

      // Send to DLQ
      const dlqName = this.getDLQName(queueName);
      const dlqMessage = {
        originalMessage: message.message,
        originalQueue: queueName,
        error: {
          message: error.message,
          stack: error.stack,
        },
        attemptsMade,
      };

      await this.pool.query(
        'SELECT * FROM pgmq.send($1, $2::jsonb)',
        [dlqName, JSON.stringify(dlqMessage)],
      );

      // Delete from original queue
      await this.delete(queueName, messageId);
    } catch (error) {
      this.logger.error(
        `Failed to move message ${messageId} to DLQ for queue ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async archive(queueName: string, messageId: number): Promise<void> {
    try {
      // PGMQ's archive function has overloads, so we need to be explicit about the types
      await this.pool.query(
        'SELECT * FROM pgmq.archive($1::text, $2::bigint)',
        [queueName, messageId],
      );
    } catch (error) {
      this.logger.error(
        `Failed to archive message ${messageId} from queue ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async archiveBatch(queueName: string, messageIds: number[]): Promise<void> {
    try {
      // PGMQ's archive function has overloads, so we need to be explicit about the types
      await this.pool.query(
        'SELECT * FROM pgmq.archive($1::text, $2::bigint[])',
        [queueName, messageIds],
      );
    } catch (error) {
      this.logger.error(
        `Failed to archive messages from queue ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async delete(queueName: string, messageId: number): Promise<void> {
    try {
      await this.pool.query(
        'SELECT * FROM pgmq.delete($1, $2)',
        [queueName, messageId],
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete message ${messageId} from queue ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async dropQueue(queueName: string): Promise<void> {
    try {
      // Drop DLQ first
      await this.pool.query('SELECT * FROM pgmq.drop_queue($1)', [this.getDLQName(queueName)]);
      // Drop main queue
      await this.pool.query('SELECT * FROM pgmq.drop_queue($1)', [queueName]);
    } catch (error) {
      this.logger.error(`Failed to drop queue ${queueName}`, error);
      throw error;
    }
  }

  async getJobCounts(queueName: string): Promise<PGMQJobCounts> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM pgmq.metrics($1)',
        [queueName],
      );

      const metrics = result.rows[0];
      const dlqResult = await this.pool.query(
        'SELECT * FROM pgmq.metrics($1)',
        [this.getDLQName(queueName)],
      );

      return {
        waiting: metrics.queue_length || 0,
        active: 0, // Not directly available from metrics
        completed: metrics.total_messages - metrics.queue_length || 0,
        failed: dlqResult.rows[0]?.queue_length || 0,
        delayed: 0, // Not supported by PGMQ
        paused: 0, // Not supported by PGMQ
      };
    } catch (error) {
      this.logger.error(
        `Failed to get job counts for queue ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async getDeadLetters<T>(queueName: string): Promise<PGMQDeadLetterMessage<T>[]> {
    try {
      const dlqName = this.getDLQName(queueName);
      const result = await this.pool.query(
        'SELECT * FROM pgmq.read($1, 0, 100)',
        [dlqName],
      );

      return result.rows.map((row) => {
        const dlqMessage = row.message;
        return {
          id: row.msg_id,
          data: dlqMessage.originalMessage,
          originalQueue: dlqMessage.originalQueue,
          timestamp: row.enqueued_at,
          errorMessage: dlqMessage.error.message,
          errorStack: dlqMessage.error.stack,
          attemptsMade: dlqMessage.attemptsMade,
        };
      });
    } catch (error) {
      this.logger.error(
        `Failed to get dead letters for queue ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async requeueDeadLetter(queueName: string, messageId: number): Promise<number> {
    try {
      const dlqName = this.getDLQName(queueName);
      
      // Get message from DLQ
      const result = await this.pool.query(
        'SELECT * FROM pgmq.read($1, 0, 1) WHERE msg_id = $2',
        [dlqName, messageId],
      );

      if (result.rows.length === 0) {
        throw new Error(`Message ${messageId} not found in DLQ`);
      }

      const dlqMessage = result.rows[0].message;

      // Send back to original queue
      const newMsgId = await this.send(queueName, dlqMessage.originalMessage);

      // Delete from DLQ
      await this.delete(dlqName, messageId);

      return newMsgId;
    } catch (error) {
      this.logger.error(
        `Failed to requeue message ${messageId} from DLQ to ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async requeueDeadLetterBatch(queueName: string, messageIds: number[]): Promise<number[]> {
    try {
      const dlqName = this.getDLQName(queueName);
      
      // Get messages from DLQ
      const result = await this.pool.query(
        'SELECT * FROM pgmq.read($1, 0, $2) WHERE msg_id = ANY($3)',
        [dlqName, messageIds.length, messageIds],
      );

      const messages = result.rows.map(row => row.message.originalMessage);

      // Send back to original queue
      const newMsgIds = await this.sendBatch(queueName, messages);

      // Delete from DLQ
      await this.pool.query(
        'SELECT * FROM pgmq.delete($1, $2::bigint[])',
        [dlqName, messageIds],
      );

      return newMsgIds;
    } catch (error) {
      this.logger.error(
        `Failed to requeue messages from DLQ to ${queueName}`,
        error,
      );
      throw error;
    }
  }

  async purgeDeadLetters(queueName: string): Promise<void> {
    try {
      const dlqName = this.getDLQName(queueName);
      await this.pool.query('SELECT * FROM pgmq.purge_queue($1)', [dlqName]);
    } catch (error) {
      this.logger.error(
        `Failed to purge dead letters for queue ${queueName}`,
        error,
      );
      throw error;
    }
  }
}