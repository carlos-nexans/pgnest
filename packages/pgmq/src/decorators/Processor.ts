import { SetMetadata } from '@nestjs/common';
import { PROCESSOR_METADATA } from './types';

/**
 * Marks a class as a queue consumer. Drop-in replacement for @nestjs/bull's @Processor()
 * @param queueName The name of the queue to process
 */
export const Processor = (queueName: string): ClassDecorator => {
  return SetMetadata(PROCESSOR_METADATA, { queueName });
};
