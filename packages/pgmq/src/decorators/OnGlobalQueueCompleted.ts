import { SetMetadata } from '@nestjs/common';
import { ON_COMPLETED_METADATA } from './types';

/**
 * Marks a method to be called when job processing completes. Drop-in replacement for @nestjs/bull's @OnGlobalQueueCompleted()
 */
export const OnGlobalQueueCompleted = (): MethodDecorator => {
  return SetMetadata(ON_COMPLETED_METADATA, {});
};
