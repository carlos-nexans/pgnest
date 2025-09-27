import { SetMetadata } from '@nestjs/common';
import { ON_FAILED_METADATA } from './types';

/**
 * Marks a method to be called when job processing fails. Drop-in replacement for @nestjs/bull's @OnQueueFailed()
 */
export const OnQueueFailed = (): MethodDecorator => {
  return SetMetadata(ON_FAILED_METADATA, {});
};
