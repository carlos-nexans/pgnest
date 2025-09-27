export const IPGMQService = Symbol('IPGMQService');

export interface PGMQMessage<T = any> {
  msg_id: number;
  read_ct: number;
  enqueued_at: Date;
  vt: Date;
  message: T;
  maxRetries?: number; // Optional since PGMQ doesn't have this concept
}

export interface PGMQJobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface PGMQDeadLetterMessage<T = any> {
  id: number;
  data: T;
  originalQueue: string;
  timestamp: Date;
  errorMessage: string;
  errorStack: string;
  attemptsMade: number;
}

export interface SendOptions {
  maxRetries?: number;
  delay?: number | Date;
}

export interface IPGMQService {
  /**
   * Creates a new queue and its associated dead letter queue
   * @param queueName Name of the queue to create
   */
  createQueue(queueName: string): Promise<void>;

  /**
   * Sends a message to a queue
   * @param queueName Name of the queue
   * @param message Message to send (will be converted to JSON)
   * @param options Send options like maxRetries and delay
   * @returns Message ID
   */
  send<T>(
    queueName: string,
    message: T,
    options?: SendOptions,
  ): Promise<number>;

  /**
   * Sends multiple messages to a queue in a single operation
   * @param queueName Name of the queue
   * @param messages Array of messages to send
   * @param options Send options like maxRetries and delay
   * @returns Array of message IDs
   */
  sendBatch<T>(
    queueName: string,
    messages: T[],
    options?: SendOptions,
  ): Promise<number[]>;

  /**
   * Reads a message from the queue without removing it
   * @param queueName Name of the queue
   * @param visibilityTimeout Number of seconds the message should remain invisible to other consumers
   * @param quantity Number of messages to read (default: 1)
   * @returns Array of messages with their metadata
   */
  read<T>(
    queueName: string,
    visibilityTimeout: number,
    quantity?: number,
  ): Promise<PGMQMessage<T>[]>;

  /**
   * Reads and immediately deletes a message from the queue
   * @param queueName Name of the queue
   * @returns Message with its metadata, or null if queue is empty
   */
  pop<T>(queueName: string): Promise<PGMQMessage<T> | null>;

  /**
   * Archives a message by moving it to the archive table
   * @param queueName Name of the queue
   * @param messageId ID of the message to archive
   */
  archive(queueName: string, messageId: number): Promise<void>;

  /**
   * Archives multiple messages in a single operation
   * @param queueName Name of the queue
   * @param messageIds Array of message IDs to archive
   */
  archiveBatch(queueName: string, messageIds: number[]): Promise<void>;

  /**
   * Permanently deletes a message from the queue
   * @param queueName Name of the queue
   * @param messageId ID of the message to delete
   */
  delete(queueName: string, messageId: number): Promise<void>;

  /**
   * Drops a queue, its dead letter queue, and archive tables
   * @param queueName Name of the queue to drop
   */
  dropQueue(queueName: string): Promise<void>;

  /**
   * Gets counts of jobs in different states
   * @param queueName Name of the queue
   * @returns Job counts by state
   */
  getJobCounts(queueName: string): Promise<PGMQJobCounts>;

  /**
   * Gets all failed messages from the dead letter queue
   * @param queueName Name of the original queue
   * @returns Array of dead letter messages with their error information
   */
  getDeadLetters<T = any>(queueName: string): Promise<PGMQDeadLetterMessage<T>[]>;

  /**
   * Requeues a message from the dead letter queue back to its original queue
   * @param queueName Name of the original queue
   * @param messageId ID of the message in the DLQ
   */
  requeueDeadLetter(queueName: string, messageId: number): Promise<number>;

  /**
   * Requeues multiple messages from the dead letter queue back to their original queue
   * @param queueName Name of the original queue
   * @param messageIds Array of message IDs in the DLQ
   */
  requeueDeadLetterBatch(queueName: string, messageIds: number[]): Promise<number[]>;

  /**
   * Purges all messages from a dead letter queue
   * @param queueName Name of the original queue
   */
  purgeDeadLetters(queueName: string): Promise<void>;

  /**
   * Internal method to move a message to the dead letter queue
   * @param queueName Name of the original queue
   * @param messageId ID of the message to move
   * @param error Error that caused the move
   * @param attemptsMade Number of attempts made
   */
  moveToDeadLetter(
    queueName: string,
    messageId: number,
    error: Error,
    attemptsMade: number,
  ): Promise<void>;
}