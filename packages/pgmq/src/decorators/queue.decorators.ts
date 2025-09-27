import { SetMetadata } from '@nestjs/common';

export const PROCESSOR_METADATA = Symbol('PROCESSOR_METADATA');
export const PROCESS_METADATA = Symbol('PROCESS_METADATA');
export const ON_FAILED_METADATA = Symbol('ON_FAILED_METADATA');
export const ON_COMPLETED_METADATA = Symbol('ON_COMPLETED_METADATA');

export interface ConsumerMetadata {
  queueName: string;
  concurrency?: number;
}

export interface ProcessOptions {
  concurrency?: number;
}

export interface Job<T = any> {
  id: number;
  data: T;
  attemptsMade: number;
  queue: {
    name: string;
  };
  timestamp?: Date;
  errorMessage?: string;
  errorStack?: string;
}

export const QueueProcessor = (queueName: string): ClassDecorator => {
  return SetMetadata(PROCESSOR_METADATA, { queueName });
};

export const Processor = (options: ProcessOptions = {}): MethodDecorator => {
  return SetMetadata(PROCESS_METADATA, options);
};

export const OnFailed = (): MethodDecorator => {
  return SetMetadata(ON_FAILED_METADATA, {});
};

export const OnCompleted = (): MethodDecorator => {
  return SetMetadata(ON_COMPLETED_METADATA, {});
};