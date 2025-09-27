import { Type } from '@nestjs/common';

export interface Job<T = any> {
  id: number;
  data: T;
  attemptsMade: number;
  queue: {
    name: string;
  };
}

export interface ProcessOptions {
  concurrency?: number;
}

export interface QueueConsumer {
  process(job: Job): Promise<any>;
  onFailed?(job: Job, error: Error): void;
  onCompleted?(job: Job, result: any): void;
}

export interface ConsumerMetadata {
  queueName: string;
  processOptions?: ProcessOptions;
  target: Type<any>;
}

// Use _PG suffix to avoid conflicts with Bull's metadata keys
export const PROCESSOR_METADATA = Symbol('PROCESSOR_METADATA_PG');
export const PROCESS_METADATA = Symbol('PROCESS_METADATA_PG');
export const ON_FAILED_METADATA = Symbol('ON_FAILED_METADATA_PG');
export const ON_COMPLETED_METADATA = Symbol('ON_COMPLETED_METADATA_PG');
