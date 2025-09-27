import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IPGMQService } from '@pgnest/pgmq';
import { Inject } from '@nestjs/common';

@Injectable()
export class MessageProducer implements OnModuleInit {
  private readonly logger = new Logger(MessageProducer.name);
  private messageCount = 0;
  private queueCreated = false;

  constructor(
    @Inject(IPGMQService)
    private readonly queueService: IPGMQService
  ) {}

  async onModuleInit() {
    try {
      // Create the queue if it doesn't exist
      await this.queueService.createQueue('example-queue');
      this.queueCreated = true;
      this.logger.log('Queue "example-queue" created successfully');
    } catch (error) {
      this.logger.error('Failed to create queue "example-queue"', error);
      // Continue anyway, the queue might already exist
      this.queueCreated = true;
    }
  }

  @Cron('*/5 * * * * *') // Run every 5 seconds
  async handleCron() {
    if (!this.queueCreated) {
      this.logger.warn('Queue not created yet, skipping message send');
      return;
    }

    this.messageCount++;
    const message = {
      id: this.messageCount,
      text: `Hello from producer! Message #${this.messageCount}`,
      timestamp: new Date().toISOString()
    };

    try {
      const messageId = await this.queueService.send('example-queue', message);
      this.logger.log(`Sent message #${this.messageCount} with ID: ${messageId}`);
    } catch (error) {
      this.logger.error('Failed to send message', error);
    }
  }
}
