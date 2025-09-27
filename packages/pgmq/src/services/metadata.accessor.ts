import { Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PROCESSOR_METADATA, PROCESS_METADATA, ON_FAILED_METADATA, ON_COMPLETED_METADATA } from '../decorators/queue.decorators';
import { ConsumerMetadata } from '../decorators/queue.decorators';

@Injectable()
export class PGMQMetadataAccessor {
  private readonly reflector: Reflector;

  constructor() {
    // Create Reflector manually like BullMQ does in tests
    this.reflector = new Reflector();
  }

  isProcessor(target: Type<any> | Function): boolean {
    if (!target) {
      return false;
    }
    return !!this.reflector.get(PROCESSOR_METADATA, target);
  }

  getProcessorMetadata(target: Type<any> | Function): ConsumerMetadata | undefined {
    return this.reflector.get(PROCESSOR_METADATA, target);
  }

  getProcessMetadata(target: Type<any> | Function): any | undefined {
    return this.reflector.get(PROCESS_METADATA, target);
  }

  getOnFailedMetadata(target: Type<any> | Function): any | undefined {
    return this.reflector.get(ON_FAILED_METADATA, target);
  }

  getOnCompletedMetadata(target: Type<any> | Function): any | undefined {
    return this.reflector.get(ON_COMPLETED_METADATA, target);
  }
}