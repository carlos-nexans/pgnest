import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Job } from '../decorators/queue.decorators';
import { IPGMQService } from '../interfaces';
import { ProcessOptions } from '../decorators/types';
import { PGMQMetadataAccessor } from './metadata.accessor';

interface ProcessHandler {
  handler: Function;
  options: ProcessOptions;
}

@Injectable()
export class QueueConsumerDiscovery implements OnModuleDestroy {
  private readonly consumers = new Map<string, any>();
  private readonly processHandlers = new Map<string, ProcessHandler>();
  private readonly failureHandlers = new Map<string, Function>();
  private readonly completionHandlers = new Map<string, Function>();
  private readonly activeWorkers = new Map<string, number>();
  private isShuttingDown = false;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly metadataAccessor: PGMQMetadataAccessor,
    @Inject(IPGMQService) private readonly queueService: IPGMQService,
  ) {}

  async start() {
    await this.discover();
    await this.initializeConsumers();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    // Wait for active workers to finish
    for (const [queueName, count] of this.activeWorkers.entries()) {
      if (count > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async discover() {
    const providers = this.discoveryService.getProviders();
    const controllers = this.discoveryService.getControllers();
    const wrappers = [...providers, ...controllers];

    for (const wrapper of wrappers) {
      if (!wrapper.metatype) continue;

      const isProcessor = this.metadataAccessor.isProcessor(
        !wrapper.metatype || wrapper.inject
          ? wrapper.instance?.constructor
          : wrapper.metatype,
      );

      if (!isProcessor) continue;

      const metadata = this.metadataAccessor.getProcessorMetadata(
        wrapper.instance?.constructor || wrapper.metatype,
      );

      if (!metadata) continue;

      const { queueName } = metadata;
      this.consumers.set(queueName, wrapper);
      this.activeWorkers.set(queueName, 0);

      const prototype = wrapper.metatype?.prototype;
      if (!prototype) continue;

      this.metadataScanner.scanFromPrototype(
        wrapper.instance,
        prototype,
        (methodName: string) => {
          this.handleMethod(wrapper as any, methodName, queueName);
        },
      );
    }
  }

  private handleMethod(
    wrapper: InstanceWrapper,
    methodName: string,
    queueName: string,
  ) {
    const methodRef = wrapper.instance[methodName];
    const processMetadata = this.metadataAccessor.getProcessMetadata(methodRef);
    const failureMetadata = this.metadataAccessor.getOnFailedMetadata(methodRef);
    const completionMetadata = this.metadataAccessor.getOnCompletedMetadata(methodRef);

    if (processMetadata) {
      this.processHandlers.set(queueName, {
        handler: methodRef.bind(wrapper.instance),
        options: processMetadata,
      });
    }
    if (failureMetadata) {
      this.failureHandlers.set(queueName, methodRef.bind(wrapper.instance));
    }
    if (completionMetadata) {
      this.completionHandlers.set(queueName, methodRef.bind(wrapper.instance));
    }
  }

  private async initializeConsumers() {
    for (const [queueName, wrapper] of this.consumers) {
      const processHandler = this.processHandlers.get(queueName);
      const failureHandler = this.failureHandlers.get(queueName);
      const completionHandler = this.completionHandlers.get(queueName);

      if (!processHandler) continue;

      // Create queue if it doesn't exist
      try {
        await this.queueService.createQueue(queueName);
      } catch (error) {
        // Queue might already exist, continue
      }

      // Start processing loop with concurrency
      const concurrency = processHandler.options.concurrency || 1;
      for (let i = 0; i < concurrency; i++) {
        this.startWorker(
          queueName,
          processHandler.handler,
          failureHandler,
          completionHandler,
        );
      }
    }
  }

  private async startWorker(
    queueName: string,
    processHandler: Function,
    failureHandler?: Function,
    completionHandler?: Function,
  ) {
    while (!this.isShuttingDown) {
      try {
        // Get current active workers
        const activeWorkers = this.activeWorkers.get(queueName) || 0;

        // Read message with 30s visibility timeout
        const messages = await this.queueService.read(queueName, 30, 1);

        for (const message of messages) {
          // Increment active workers
          this.activeWorkers.set(queueName, activeWorkers + 1);

          const job: Job = {
            id: message.msg_id,
            data: message.message,
            attemptsMade: message.read_ct,
            queue: { name: queueName },
          };

          try {
            const result = await processHandler(job);
            await this.queueService.archive(queueName, message.msg_id);

            if (completionHandler) {
              await completionHandler(job, result);
            }
          } catch (error) {
            if (failureHandler) {
              await failureHandler(job, error);
            }

            // Check if max retries exceeded
            const maxRetries = message.maxRetries ?? 3; // Default to 3 if not specified
            if (message.read_ct >= maxRetries) {
              // Move to DLQ
              await this.queueService.moveToDeadLetter(
                queueName,
                message.msg_id,
                error,
                message.read_ct,
              );
            }
            // Otherwise, message will become visible again after visibility timeout
          } finally {
            // Decrement active workers
            this.activeWorkers.set(queueName, activeWorkers);
          }
        }
      } catch (error) {
        // Log error but continue processing
        console.error('Error processing queue:', error);
      }

      // Small delay to prevent tight loop when queue is empty
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}