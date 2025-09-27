import { SetMetadata } from '@nestjs/common';
import { PROCESS_METADATA, ProcessOptions } from './types';

/**
 * Marks a method as a job processor. Drop-in replacement for @nestjs/bull's @Process()
 * @param options Processing options like concurrency
 */
export const Process = (options: ProcessOptions = {}): MethodDecorator => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(PROCESS_METADATA, {
      ...options,
      methodName: propertyKey,
    })(descriptor.value);
    return descriptor;
  };
};
